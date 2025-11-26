import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleGenAI, FunctionDeclaration, Tool, Type } from "@google/genai";

// --- Child Agent Configuration ---

// 1. Define tools for the Child Agent
const childTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "calculateSum",
        description: "Calculates the sum of two numbers.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            a: { type: Type.NUMBER, description: "The first number." },
            b: { type: Type.NUMBER, description: "The second number." },
          },
          required: ["a", "b"],
        },
      },
    ],
  },
];

// 2. Child Agent Class
class ChildAgent {
  private ai: GoogleGenAI;
  private modelName: string;
  public name: string;

  constructor(name: string, apiKey: string) {
    this.name = name;
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = "gemini-2.5-flash";
  }

  async processTask(prompt: string): Promise<string> {
    console.log(`[Child: ${this.name}] Received task: "${prompt}"`);
    
    try {
        const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
            tools: childTools,
            systemInstruction: `You are a specialized worker agent named ${this.name}. You have access to math tools. Perform the task concisely.`,
        },
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            if (functionCall.name === "calculateSum") {
                const args = functionCall.args as any;
                const result = args.a + args.b;
                console.log(`[Child: ${this.name}] Tool Used: calculateSum(${args.a}, ${args.b}) = ${result}`);
                
                const response2 = await this.ai.models.generateContent({
                    model: this.modelName,
                    contents: [
                        { role: 'user', parts: [{ text: prompt }] },
                        { role: 'model', parts: [{ functionCall: functionCall }] },
                        { role: 'function', parts: [{ functionResponse: { name: functionCall.name, response: { result: result } } }] }
                    ],
                    config: { tools: childTools }
                });
                return response2.text || "No text response from child.";
            }
        }

        return response.text || "I could not process that.";
    } catch (error: any) {
        if (error.status === 429 || error.message?.includes('429') || error.error?.code === 429) {
            console.warn(`[Child: ${this.name}] Quota exceeded. Pausing agent.`);
            return "Task paused: Quota limit reached.";
        }
        console.error(`[Child: ${this.name}] Error:`, error);
        return "Error processing task.";
    }
  }
}

// --- Parent Agent Configuration ---

// 3. Define the Delegation Tool for the Parent
const delegationTool: FunctionDeclaration = {
  name: "delegateTask",
  description: "Delegates a specific sub-task to a specialized child agent.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      childName: {
        type: Type.STRING,
        description: "The name of the child agent (e.g., 'MathWorker', 'GeneralWorker').",
      },
      taskDescription: {
        type: Type.STRING,
        description: "The specific instructions for the child agent.",
      },
    },
    required: ["childName", "taskDescription"],
  },
};

// 4. Main Execution Logic (Background System)
async function runHierarchicalSystem() {
  if (!process.env.API_KEY) {
    console.warn("API_KEY missing, skipping hierarchical agent demo.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parentModel = "gemini-2.5-flash";

  const agents: Record<string, ChildAgent> = {
    "MathWorker": new ChildAgent("MathWorker", process.env.API_KEY),
    "GeneralWorker": new ChildAgent("GeneralWorker", process.env.API_KEY)
  };

  console.log("--- Parent AI Initialized ---");

  const mainPrompt = "I need to calculate the sum of 50 and 100, and then summarize the result like a poem.";

  try {
      const parentResponse = await ai.models.generateContent({
        model: parentModel,
        contents: mainPrompt,
        config: {
        systemInstruction: "You are a Manager AI. You delegate tasks to child agents: 'MathWorker' for calculations and 'GeneralWorker' for general text. Do not do math yourself.",
        tools: [{ functionDeclarations: [delegationTool] }],
        },
    });

    if (parentResponse.functionCalls && parentResponse.functionCalls.length > 0) {
        const call = parentResponse.functionCalls[0];
        console.log(`[Parent] Decided to delegate to: ${call.args['childName']}`);

        if (call.name === "delegateTask") {
        const childName = call.args['childName'] as string;
        const task = call.args['taskDescription'] as string;

        const child = agents[childName];
        
        if (child) {
            const childResult = await child.processTask(task);
            console.log(`[Parent] Received result from ${childName}: "${childResult}"`);

            const finalResponse = await ai.models.generateContent({
                model: parentModel,
                contents: [
                    { role: "user", parts: [{ text: mainPrompt }] },
                    { role: "model", parts: [{ functionCall: call }] },
                    { 
                        role: "function", 
                        parts: [{ 
                            functionResponse: { 
                                name: "delegateTask", 
                                response: { result: childResult } 
                            } 
                        }] 
                    }
                ],
                config: { tools: [{ functionDeclarations: [delegationTool] }] }
            });

            console.log(`\n[Parent Final Output]: ${finalResponse.text}`);
        } else {
            console.error(`[Parent] Error: Child agent '${childName}' not found.`);
        }
        }
    } else {
        console.log(`[Parent] Decided not to delegate. Response: ${parentResponse.text}`);
    }
  } catch (e: any) {
      if (e.status === 429 || e.message?.includes('429') || e.error?.code === 429) {
          console.warn("[Parent] Hierarchical system paused due to API quota limits. Please check billing.");
          return;
      }
      console.error("Hierarchical system error:", e);
  }
}

// --- React Rendering Logic ---

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Execute Agent Demo in background without blocking UI
setTimeout(() => {
    runHierarchicalSystem().catch(console.error);
}, 1000);