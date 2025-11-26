
import { 
    knowledgeBaseData, 
    milestonesData, 
    buildChecklistData, 
    loggedInUser, 
    allUsers 
} from '../data';
import { GoogleGenAI } from '@google/genai';

// --- TYPES ---
export interface KernelContext {
    user: typeof loggedInUser;
    currentView?: string;
}

export interface MemoryEntry {
    id: string;
    content: string;
    type: 'Conversation' | 'UserPreference' | 'System' | 'Code' | 'Document';
    timestamp: string;
    embedding: number[]; // Simulated 2D vector for visualization
    tags?: string[];
}

interface SearchResult {
    source: string;
    content: string;
    score: number;
}

// --- THE AETHERIUS KERNEL (Local AI Engine) ---
class AetheriusKernelService {
    private static instance: AetheriusKernelService;
    private externalAi: GoogleGenAI | null = null;
    private memoryKey = 'aetherius_long_term_memory';

    private constructor() {
        // Initialize external uplink only if key exists.
        if (process.env.API_KEY) {
            this.externalAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
    }

    public static getInstance(): AetheriusKernelService {
        if (!AetheriusKernelService.instance) {
            AetheriusKernelService.instance = new AetheriusKernelService();
        }
        return AetheriusKernelService.instance;
    }

    // --- MEMORY SYSTEM ---

    private loadMemories(): MemoryEntry[] {
        try {
            const data = localStorage.getItem(this.memoryKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Memory Read Error", e);
            return [];
        }
    }

    private saveMemories(memories: MemoryEntry[]) {
        try {
            // Limit to last 200 entries to prevent localStorage overflow in prototype
            const trimmed = memories.slice(-200); 
            localStorage.setItem(this.memoryKey, JSON.stringify(trimmed));
        } catch (e) {
            console.error("Memory Write Error", e);
        }
    }

    public addMemory(content: string, type: MemoryEntry['type'], tags: string[] = []): MemoryEntry {
        const memories = this.loadMemories();
        
        // Create a deterministic pseudo-random embedding based on content hash
        // This allows the MemoryNode visualizer to place similar topics somewhat near each other
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            hash = (hash << 5) - hash + content.charCodeAt(i);
            hash |= 0;
        }
        const x = Math.abs((hash % 1000) / 1000);
        const y = Math.abs(((hash >> 10) % 1000) / 1000);

        const entry: MemoryEntry = {
            id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            content,
            type,
            timestamp: new Date().toISOString(),
            embedding: [x, y],
            tags
        };

        this.saveMemories([...memories, entry]);
        return entry;
    }

    public getMemories(): MemoryEntry[] {
        return this.loadMemories();
    }

    public recallContext(query: string): string {
        const memories = this.loadMemories();
        if (memories.length === 0) return "";

        const terms = query.toLowerCase().split(' ').filter(t => t.length > 3);
        if (terms.length === 0) return "";

        // Simple keyword matching simulation of vector search
        const scored = memories.map(mem => {
            let score = 0;
            const contentLower = mem.content.toLowerCase();
            terms.forEach(term => {
                if (contentLower.includes(term)) score += 1;
            });
            // Boost recent memories slightly
            const age = Date.now() - new Date(mem.timestamp).getTime();
            if (age < 1000 * 60 * 60) score += 0.5; 
            
            return { ...mem, searchScore: score };
        });

        const relevant = scored
            .filter(m => m.searchScore > 0)
            .sort((a, b) => b.searchScore - a.searchScore)
            .slice(0, 5); // Top 5 relevant memories

        if (relevant.length === 0) return "";

        return `\n\n[RECALLED MEMORY CONTEXT]:\n${relevant.map(m => `- [${m.timestamp}] ${m.content}`).join('\n')}\n[END MEMORY]\n`;
    }

    // --- CONTEXT AWARE GREETING ENGINE ---
    public getDynamicGreeting(user: typeof loggedInUser): string {
        const now = new Date();
        const hour = now.getHours();
        const identity = user.systemIdentity;
        const aiName = identity?.aiNickname || identity?.aiCoreName || "Aether";
        const userName = user.name.split(' ')[0]; 

        // 1. Time of Day Logic
        let timeGreeting = "Hello";
        if (hour >= 5 && hour < 12) {
            timeGreeting = "Good morning";
        } else if (hour >= 12 && hour < 17) {
            timeGreeting = "Good afternoon";
        } else if (hour >= 17 && hour < 22) {
            timeGreeting = "Good evening";
        } else {
            timeGreeting = "Burning the midnight oil"; 
        }

        // 2. Persistence / Session Context
        const lastSeenKey = 'aetherius_last_seen';
        const lastSeenStr = localStorage.getItem(lastSeenKey);
        let contextMsg = "System initialized and ready.";

        if (lastSeenStr) {
            const lastSeen = new Date(lastSeenStr);
            const diffHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

            if (diffHours < 1) {
                contextMsg = "I am still here. What shall we focus on next?";
            } else if (diffHours < 4) {
                contextMsg = "Welcome back.";
            } else if (diffHours > 24) {
                contextMsg = "It has been a while. I've run diagnostics in your absence; all systems green.";
            }
        } else {
            contextMsg = "It is a pleasure to meet you. I am online.";
        }

        // 3. Retrieve recent memory for context (optional implementation detail for now)
        const memories = this.loadMemories();
        if (memories.length > 0) {
            const lastMemory = memories[memories.length - 1];
            if (lastMemory.type === 'Conversation') {
                // Subtle reference to last topic can be added here if desired
            }
        }

        // 4. Random Proactive Prompt
        const prompts = [
            "Shall we review your latest build checklist items?",
            "I detect optimal network conditions for research.",
            "Would you like to check the latest market trends?",
            "The OmniChain ledger is synced.",
            "Ready to continue our work on the architecture?",
            "My cognitive nodes are fully operational."
        ];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        // Update last seen
        try {
            localStorage.setItem(lastSeenKey, now.toISOString());
        } catch (e) { console.error("Storage error", e); }

        return `**${aiName}**: ${timeGreeting}, ${userName}. ${contextMsg}\n\n${randomPrompt}`;
    }

    // --- CORE PROCESSING LOOP ---
    public async *processInput(input: string, context: KernelContext): AsyncGenerator<string> {
        const query = input.trim();
        const lowerQuery = query.toLowerCase();

        // Save User Input to Memory
        this.addMemory(`User: ${query}`, 'Conversation');

        // 0. EXPLICIT EXTERNAL UPLINK
        if (lowerQuery.startsWith('external:') || lowerQuery.startsWith('gemini:') || lowerQuery.startsWith('net:')) {
            const cleanInput = input.replace(/^(external:|gemini:|net:)\s*/i, '');
            try {
                yield* this.queryExternalUplink(cleanInput, context);
            } catch (e: any) {
                yield* this.streamResponse(`[UPLINK ERROR]: Could not connect to external grid. ${e.message}`);
            }
            return;
        }

        // 1. HARDCODED IDENTITY & SYSTEM AWARENESS
        if (lowerQuery.match(/who are you|what are you|identity/)) {
            const identity = context.user.systemIdentity;
            const name = identity?.aiNickname || identity?.aiCoreName || "Aether";
            const type = identity?.buildType || "Grandchild";
            const response = `I am **${name}**, a **${type} Node** Artificial Intelligence running on the **Aetherius OS Kernel**.\n\nI am a self-contained system designed to assist ${context.user.name}. I operate independently of the Genesis Parent unless creating a blockchain consensus event.`;
            this.addMemory(`AI: ${response}`, 'System');
            yield* this.streamResponse(response);
            return;
        }

        if (lowerQuery.includes('status') || lowerQuery.includes('report')) {
            const report = this.generateSystemReport();
            this.addMemory(`AI: [System Report Generated]`, 'System');
            yield* this.streamResponse(report);
            return;
        }

        // 2. INTERNAL RAG (Retrieval Augmented Generation - Static Data)
        const bestMatch = this.searchInternalData(lowerQuery);
        if (bestMatch && bestMatch.score > 0.35) {
            const response = `**Source: ${bestMatch.source}**\n\n${bestMatch.content}`;
            this.addMemory(`AI: ${bestMatch.content.substring(0, 100)}...`, 'System');
            yield* this.streamResponse(response);
            return;
        }

        // 3. COMMAND INTERPRETER
        if (lowerQuery.includes('open') || lowerQuery.includes('launch')) {
            const response = `Command recognized. To launch an application, please use the navigation dock or the specialized **App Launcher** interface.`;
            this.addMemory(`AI: ${response}`, 'System');
            yield* this.streamResponse(response);
            return;
        }

        // 4. GENERAL CONVERSATION (With Memory Context)
        // If no specific command matched, try to use Gemini for a conversational response
        // leveraging the persistent memory we just built.
        if (this.externalAi) {
            try {
                // Retrieve relevant context from persistent memory
                const memoryContext = this.recallContext(query);
                
                const sysPrompt = `
                You are Aetherius, the advanced OS Kernel AI.
                User: ${context.user.name}.
                Role: ${context.user.systemIdentity?.buildType} Node Operator.
                
                Your Goal: Be a helpful, highly intelligent operating system assistant.
                
                MEMORY CONTEXT:
                The following are relevant snippets from your past interactions with this user. Use them to provide a personalized and continuous experience.
                ${memoryContext}
                
                Directives:
                - If the user asks a question you don't know, you can use the 'googleSearch' tool if available, or admit limitation.
                - Be concise and technical but friendly.
                - Do not hallucinate OS features that don't exist in the context of Aetherius OS (a web-based simulation).
                `;

                const chat = this.externalAi.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { 
                        systemInstruction: sysPrompt,
                        tools: [{ googleSearch: {} }]
                    }
                });

                const result = await chat.sendMessageStream({ message: query });
                let fullResponse = '';
                
                for await (const chunk of result) {
                    const text = chunk.text;
                    if (text) {
                        fullResponse += text;
                        yield text;
                    }
                    // Handle grounding metadata if present
                    if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                         const sources = chunk.candidates[0].groundingMetadata.groundingChunks
                            .filter((c: any) => c.web?.uri && c.web?.title)
                            .map((c: any) => `[${c.web.title}](${c.web.uri})`);
                        if (sources.length > 0) {
                            const sourceText = `\n\n**Sources:**\n${[...new Set(sources)].map(s => `- ${s}`).join('\n')}`;
                            fullResponse += sourceText;
                            yield sourceText;
                        }
                    }
                }
                
                // Save the AI's response to memory
                this.addMemory(`AI: ${fullResponse}`, 'Conversation');
                return;

            } catch (e: any) {
                if (e.status === 429 || e.message?.includes('429') || e.error?.code === 429) {
                    yield "**[SYSTEM ALERT]** API Rate Limit/Quota Exceeded. The AI core is temporarily offline. Please check your billing or wait before trying again.";
                    this.addMemory(`AI Error: Quota Exceeded`, 'System');
                    return;
                }
                console.error("AI Chat Error", e);
                // Fallback if AI fails
            }
        }

        // 5. ULTIMATE FALLBACK
        const fallback = `**[KERNEL NOTICE]**
        
My internal databases do not contain specific data regarding "${input}". 
I attempted to access the external grid but the uplink is currently unavailable or unconfigured.

**Options:**
1. Refine your query to reference known OS modules (e.g., "Show Milestones", "Quantum Core").
2. Check your API Key configuration for general chat capabilities.`;
        
        this.addMemory(`AI: [Fallback Message]`, 'System');
        yield* this.streamResponse(fallback);
    }

    // --- INTERNAL LOGIC MODULES ---

    private searchInternalData(query: string): SearchResult | null {
        const terms = query.split(' ').map(t => t.trim()).filter(t => t.length > 2);
        let bestMatch: SearchResult | null = null;
        let highestScore = 0;

        // Helper to score text against query terms
        const calculateScore = (text: string) => {
            const lowerText = text.toLowerCase();
            let matches = 0;
            terms.forEach(term => {
                if (lowerText.includes(term)) matches++;
            });
            return matches / terms.length;
        };

        // 1. Search Knowledge Base
        for (const item of knowledgeBaseData) {
            const content = `${item.name}\n${item.details}`;
            const score = calculateScore(content);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    source: `Knowledge Base [${item.id}] - ${item.status}`,
                    content: `**${item.name}**\n${item.details}`,
                    score
                };
            }
        }

        // 2. Search Milestones (UPDATED for new Object structure)
        const allMilestones = [
            ...milestonesData.projectMilestones,
            ...milestonesData.technicalBreakdown,
            ...milestonesData.platformFeatureMilestones
        ];

        for (const item of allMilestones) {
             const content = `${item.title}\n${item.description || ''}`;
             const score = calculateScore(content);
             if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    source: `Milestone Tracker`,
                    content: `**Milestone:** ${item.title}\n**Status:** ${item.status} (${item.progress}%)\n**Details:** ${item.description || 'N/A'}`,
                    score
                };
             }
        }

        // 3. Search Checklist
        for (const category of buildChecklistData) {
            for (const item of category.items) {
                const score = calculateScore(item.name + ' ' + item.description);
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = {
                        source: `Build Checklist: ${category.name}`,
                        content: `**Feature:** ${item.name}\n**Status:** ${item.status}\n**Description:** ${item.description}`,
                        score
                    };
                }
            }
        }

        return bestMatch;
    }

    private generateSystemReport(): string {
        const user = loggedInUser;
        const identity = user.systemIdentity;
        
        // Calculate build progress
        const totalItems = buildChecklistData.flatMap(c => c.items).length;
        let completed = 0;
        buildChecklistData.forEach(c => c.items.forEach(i => {
            if(i.status === 'Completed') completed++;
            if(i.children) i.children.forEach(child => { if(child.status === 'Completed') completed++; });
        }));
        const progress = Math.round((completed / totalItems) * 100);

        return `### AETHERIUS OS SYSTEM REPORT
--------------------------------
**Operator:** ${user.name}
**Identity Hash:** ${identity?.userId}
**Node Architecture:** ${identity?.buildType} (${identity?.aiCoreName})
**Network Status:** ONLINE (OmniChain Mainnet)

**Build Metrics:**
- Core Progress: ${progress}%
- Knowledge Nodes: ${knowledgeBaseData.length}
- Active Modules: ${buildChecklistData.length}

**Virtual Hardware:**
- Quantum Coherence: 99.9%
- Neural Link: STANDBY
- Time Crystal Clock: SYNCED

System is operating within nominal parameters.`;
    }

    // --- UTILS ---

    private async *streamResponse(text: string) {
        // Simulates typing effect for local data (fast)
        const chunkSize = 4;
        for (let i = 0; i < text.length; i += chunkSize) {
            yield text.slice(0, i + chunkSize);
            await new Promise(resolve => setTimeout(resolve, 8)); 
        }
    }

    private async *queryExternalUplink(input: string, context: KernelContext) {
        if (!this.externalAi) {
            throw new Error("Uplink hardware missing (API Key not configured).");
        }

        // Contextual Uplink
        const memoryContext = this.recallContext(input);

        const sysPrompt = `
        You are the 'External Uplink' module for Aetherius OS.
        You are NOT the operating system itself. You are a research tool used by the OS.
        
        USER CONTEXT:
        - Name: ${context.user.name}
        - Role: ${context.user.systemIdentity?.buildType} Node Operator
        
        MEMORY CONTEXT:
        ${memoryContext}
        
        MANDATE:
        - Provide expert, technical answers to the user's query.
        - Do not simulate a persona. Be concise and factual.
        - If asked about Aetherius OS internals, defer to the local kernel.
        - Use Google Search to find real-time information when necessary.
        `;

        try {
            const chat = this.externalAi.chats.create({
                model: 'gemini-2.5-flash',
                config: { 
                    systemInstruction: sysPrompt,
                    tools: [{ googleSearch: {} }] 
                }
            });
            
            const result = await chat.sendMessageStream({ message: input });
            let buffer = '';
            let groundingMetadata: any = null;

            yield "**[ESTABLISHING SECURE UPLINK & SCANNING WEB...]**\n\n";
            
            for await (const chunk of result) {
                const text = chunk.text;
                if (text) {
                    buffer += text;
                    yield buffer;
                }
                if (chunk.candidates?.[0]?.groundingMetadata) {
                    groundingMetadata = chunk.candidates[0].groundingMetadata;
                }
            }

            if (groundingMetadata?.groundingChunks) {
                const sources = groundingMetadata.groundingChunks
                    .filter((c: any) => c.web?.uri && c.web?.title)
                    .map((c: any) => `[${c.web.title}](${c.web.uri})`);
                
                const uniqueSources = [...new Set(sources)];

                if (uniqueSources.length > 0) {
                    buffer += `\n\n**Sources:**\n${uniqueSources.map((s: string) => `- ${s}`).join('\n')}`;
                    yield buffer;
                }
            }
            
            // Store research results in memory
            this.addMemory(`Research: ${input} -> ${buffer.substring(0, 150)}...`, 'Document');
        } catch (e: any) {
            if (e.status === 429 || e.message?.includes('429') || e.error?.code === 429) {
                yield "**[UPLINK FAILURE]** API Quota Exceeded. Connection terminated to preserve system integrity.";
                return;
            }
            throw e;
        }
    }
}

export const Kernel = AetheriusKernelService.getInstance();