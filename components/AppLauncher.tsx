import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { marked } from 'marked';
import { ChatMessage } from '../types';
// FIX: Add missing icon imports
import { XMarkIcon, ChevronLeftIcon, HiveMindIcon, Bars3Icon, DocumentTextIcon, CodeBracketIcon, PlayIcon, ShareIcon, ArrowUpCircleIcon, PlusCircleIcon, ChevronDownIcon, GitHubIcon, MicrophoneIcon, PuzzlePieceIcon, Cog6ToothIcon, GlobeIcon, CubeTransparentIcon, ArrowsPointingOutIcon, MusicNoteIcon, ImageIcon, VideoIcon, ArrowDownTrayIcon, ClockIcon, GlobeAltIcon, LockClosedIcon, EllipsisHorizontalIcon, MapIcon, PresentationChartLineIcon, ClipboardDocumentCheckIcon } from './Icons';
import { Modal } from './ComponentDetailView';
import { ICON_BUTTON_CLASSES } from '../constants';

// From @google/genai docs, for decoding audio
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const AIVisualization: React.FC = () => (
    <div className="w-full h-48 bg-gray-900 dark:bg-black rounded-lg flex items-center justify-center mb-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-800 opacity-30 dark:opacity-50"></div>
        <div className="absolute -left-1/4 -top-1/4 w-1/2 h-1/2 bg-blue-400/30 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute -right-1/4 -bottom-1/4 w-1/2 h-1/2 bg-indigo-500/30 rounded-full filter blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="relative z-10 p-4 text-center flex items-center justify-center">
             <div className="w-32 h-32 rounded-full bg-blue-900/10 backdrop-blur-sm flex items-center justify-center border-2 border-blue-400/30">
                <img src="https://i.imgur.com/2y5W1qG.png" alt="AI Avatar" className="w-28 h-28 object-cover opacity-80" />
            </div>
        </div>
    </div>
);

const SuggestionButton: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <button className="px-3 py-1.5 bg-gray-200/50 dark:bg-gray-700/50 text-xs font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        {children}
    </button>
)

const MapControlsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const menuItems = [
        { label: 'Map Settings', icon: Cog6ToothIcon, action: () => alert("Action: Map Settings") },
        { label: 'Add Map Plugin', icon: PuzzlePieceIcon, action: () => alert("Action: Add Map Plugin") },
        { label: 'Export Map', icon: ArrowDownTrayIcon, action: () => alert("Action: Export Map") },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-md"
            >
                <MapIcon className="w-4 h-4" />
                Map Controls
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in-up">
                    {menuItems.map(item => (
                        <button key={item.label} onClick={item.action} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AppActionsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const menuItems = [
        { label: 'Save to GitHub', icon: GitHubIcon, action: () => alert("Action: Save to GitHub") },
        { label: 'Download App', icon: ArrowDownTrayIcon, action: () => alert("Action: Download App") },
        { label: 'Save', icon: DocumentTextIcon, action: () => alert("Action: Save") },
        { label: 'Copy App', icon: CodeBracketIcon, action: () => alert("Action: Copy App") },
        { label: 'View History', icon: ClockIcon, action: () => alert("Action: View History") },
        { label: 'Deploy App', icon: GlobeAltIcon, action: () => alert("Action: Deploy App") },
        { label: 'Share App', icon: ShareIcon, action: () => alert("Action: Share App") },
        { label: 'API Key', icon: LockClosedIcon, action: () => alert("Action: Manage API Key") },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-md"
            >
                <Cog6ToothIcon className="w-4 h-4" />
                App Actions
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in-up">
                    {menuItems.map(item => (
                        <button key={item.label} onClick={item.action} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AttachmentMenu: React.FC<{ onSelect: (type: string) => void }> = ({ onSelect }) => {
    const attachmentTypes = [
        { label: 'Image', icon: ImageIcon, type: 'image' },
        { label: 'Slides', icon: PresentationChartLineIcon, type: 'slides' },
        { label: 'Website', icon: GlobeAltIcon, type: 'website' },
        { label: 'File', icon: DocumentTextIcon, type: 'file' },
    ];
    return (
        <div className="absolute bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in-up">
            {attachmentTypes.map(item => (
                <button key={item.label} onClick={() => onSelect(item.type)} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};

const MessageActions: React.FC<{ text: string }> = ({ text }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
    };

    const handleShare = () => {
        alert('Sharing is not implemented yet.');
    };

    return (
        <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/50 flex items-center gap-1 opacity-70">
            <button onClick={handleCopy} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title="Copy">
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={handleShare} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title="Share">
                <ShareIcon className="w-4 h-4 text-gray-500" />
            </button>
        </div>
    );
};

const codeContent = `
import React from 'react';

const NewComponent = () => {
    return (
        <div>
            <h1>Hello, Aetherial!</h1>
            <p>This is a code preview inside the iframe window.</p>
            <p>You should be able to scroll to see this content if the container is too small.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            <p>More content to ensure scrolling is needed.</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>And more...</p>
            <p>The end.</p>
        </div>
    );
}

export default NewComponent;
`;

const exampleContent = {
    code: { type: 'code', content: codeContent, title: 'main.tsx' },
    image: { type: 'image', content: 'https://images.unsplash.com/photo-1543364195-077a17c30ff9?q=80&w=1974&auto=format&fit=crop', title: 'Mountain Landscape' },
    video: { type: 'video', content: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', title: 'Big Buck Bunny Clip' },
    audio: { type: 'audio', content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', title: 'Sample Audio Track' }
};

const FrameContent = ({ type, content, title }: { type: string, content: string, title: string }) => {
    const renderMedia = () => {
        switch (type) {
            case 'image':
                return <img src={content} alt={title} className="max-w-full h-auto mx-auto rounded-md" />;
            case 'video':
                return <video src={content} controls className="w-full max-h-full rounded-md" />;
            case 'audio':
                return <div className="p-8 flex flex-col items-center justify-center h-full"><MusicNoteIcon className="w-24 h-24 text-gray-500 mb-4"/><audio src={content} controls className="w-full max-w-sm"/></div>;
            case 'code':
                return <pre className="text-xs font-mono"><code className="language-tsx">{content}</code></pre>;
            default:
                return <p>Unsupported content type.</p>;
        }
    };

    const containerClasses = `w-full h-full bg-gray-800 dark:bg-black rounded-md text-gray-300 overflow-auto font-sans text-sm ${type !== 'code' ? 'p-4 flex items-center justify-center' : 'p-4'}`;

    return (
        <div className={containerClasses}>
            {renderMedia()}
        </div>
    );
};

const TextToSpeechTool = () => {
    const [text, setText] = useState('Hello Aetherius OS! This is a text-to-speech demonstration.');
    const [isLoading, setIsLoading] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        setAudioBuffer(null);

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say: ${text}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                // FIX: Cast window.webkitAudioContext to any to bypass TypeScript error for cross-browser compatibility.
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const decodedBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                setAudioBuffer(decodedBuffer);
            } else {
                setError('No audio data received from API.');
            }
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        if (!audioBuffer) return;
        // FIX: Cast window.webkitAudioContext to any to bypass TypeScript error for cross-browser compatibility.
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContext.destination);
        source.start();
    };

    return (
        <div className="p-4 space-y-4">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                rows={5}
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button onClick={handleGenerate} disabled={isLoading || !text.trim()} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                {isLoading ? 'Generating...' : 'Generate Speech'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {audioBuffer && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                    <button onClick={playAudio} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        <PlayIcon className="w-5 h-5"/>
                        Play Audio
                    </button>
                </div>
            )}
        </div>
    );
};

const ImageGenerationTool = () => {
    const [prompt, setPrompt] = useState('A photorealistic image of a futuristic city on an alien planet, with two suns in the sky.');
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setImageUrl(null);

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: { numberOfImages: 1 },
            });
            const base64ImageBytes = response.generatedImages[0]?.image?.imageBytes;
            if (base64ImageBytes) {
                setImageUrl(`data:image/png;base64,${base64ImageBytes}`);
            } else {
                setError('No image data received from API.');
            }
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a prompt to generate an image..."
                rows={3}
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {isLoading && <div className="text-center p-8">Loading...</div>}
            {imageUrl && (
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <img src={imageUrl} alt="Generated image" className="w-full h-auto rounded-md" />
                </div>
            )}
        </div>
    );
};

const CodeExplanationTool = () => {
    const [code, setCode] = useState('function factorial(n) {\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}');
    const [isLoading, setIsLoading] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!code.trim()) return;
        setIsLoading(true);
        setError('');
        setExplanation(null);

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Explain the following code snippet. Format the response in Markdown.\n\n\`\`\`\n${code}\n\`\`\``,
            });
            setExplanation(response.text);
        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code to explain..."
                rows={8}
                className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button onClick={handleGenerate} disabled={isLoading || !code.trim()} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                {isLoading ? 'Generating...' : 'Explain Code'}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {isLoading && <div className="text-center p-8">Loading...</div>}
            {explanation && (
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(explanation) as string }}/>
                </div>
            )}
        </div>
    );
};

const ToolRunner: React.FC<{ activeTool: string | null; onBack: () => void }> = ({ activeTool, onBack }) => {
    const tools: { [key: string]: { name: string; component: React.ReactNode } } = {
        'tts': { name: 'Text-to-Speech', component: <TextToSpeechTool /> },
        'image': { name: 'Image Generation', component: <ImageGenerationTool /> },
        'code': { name: 'Code Explanation', component: <CodeExplanationTool /> },
    };

    if (!activeTool || !tools[activeTool]) return null;

    return (
        <div className="h-full flex flex-col">
            <header className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center flex-shrink-0">
                <button onClick={onBack} className={ICON_BUTTON_CLASSES}>
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="font-semibold text-lg">{tools[activeTool].name}</h2>
            </header>
            <div className="flex-1 overflow-y-auto">
                {tools[activeTool].component}
            </div>
        </div>
    );
};

const ToolSelectionScreen: React.FC<{ onSelectTool: (tool: string) => void }> = ({ onSelectTool }) => {
    const tools = [
        { id: 'tts', name: 'Text-to-Speech', icon: MusicNoteIcon, description: 'Convert text into spoken audio.' },
        { id: 'image', name: 'Image Generation', icon: ImageIcon, description: 'Create images from text prompts.' },
        { id: 'code', name: 'Code Explanation', icon: CodeBracketIcon, description: 'Get explanations for code snippets.' },
    ];
    
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">AI Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map(tool => (
                    <button key={tool.id} onClick={() => onSelectTool(tool.id)} className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md transition-all text-left">
                        <tool.icon className="w-8 h-8 text-blue-500 mb-2"/>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{tool.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


export const AIAssistant: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Aetherius OS Assistant online. How can I help you today?' }
    ]);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState('avatar'); // 'avatar', 'iframe', 'tools'
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [modelMode, setModelMode] = useState('Adaptive');
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [frameContent, setFrameContent] = useState(exampleContent.code);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError('');

        if (!process.env.API_KEY) {
            setError('API key is not configured.');
            setIsLoading(false);
            const modelMessage: ChatMessage = {role: 'model', text: 'Error: API Key is not configured.'};
            setMessages(prev => [...prev, modelMessage]);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are the AI Assistant for Aetherius OS. You are a friendly, encouraging, and incredibly proficient assistant—a buddy dedicated to helping the user with their community interactions, content creation, and any questions they may have. Format your responses in Markdown.`
                }
            });
          
            const responseStream = await model.sendMessageStream({ message: input });

            let currentText = '';
            setMessages(prev => [...prev, { role: 'model', text: '...' }]);

            for await (const chunk of responseStream) {
                currentText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = currentText;
                    return newMessages;
                });
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = `Apologies, an anomaly occurred: ${e.message}`;
            setError(errorMessage);
            const modelMessage: ChatMessage = {role: 'model', text: errorMessage};
            setMessages(prev => [...prev, modelMessage]);
        } finally {
            setIsLoading(false);
        }
    };
  
    return (
        <div className="h-full w-full bg-white dark:bg-gray-800 flex flex-col">
            {isEnlarged && (
                <Modal title={frameContent.title} Icon={CodeBracketIcon} onClose={() => setIsEnlarged(false)}>
                    <div className="bg-gray-800 dark:bg-black w-full h-full absolute inset-0">
                       <FrameContent {...frameContent} />
                    </div>
                </Modal>
            )}

            {/* Header */}
            <header className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center bg-gray-100 dark:bg-gray-900/50 rounded-md p-1">
                    <button onClick={() => { setActiveTab('avatar'); setActiveTool(null); }} className={`px-4 py-1 text-sm font-semibold rounded transition-colors ${activeTab === 'avatar' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        Avatar
                    </button>
                    <button onClick={() => { setActiveTab('iframe'); setActiveTool(null); }} className={`px-4 py-1 text-sm font-semibold rounded transition-colors ${activeTab === 'iframe' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        Frame
                    </button>
                     <button onClick={() => setActiveTab('tools')} className={`px-4 py-1 text-sm font-semibold rounded transition-colors ${activeTab === 'tools' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        Tools
                    </button>
                </div>
                <div className="flex items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-2">(Avatar's name)</span>
                </div>
            </header>

            {/* Main Content Area */}
            {activeTab === 'avatar' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                         <button className="flex items-center text-sm px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title="Back to start">
                            <ChevronLeftIcon className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Back to start</span>
                         </button>
                         <div className="flex items-center space-x-0.5">
                            <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="View Document"><DocumentTextIcon className="w-5 h-5" /></button>
                            <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="View Code"><CodeBracketIcon className="w-5 h-5" /></button>
                            <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Run"><PlayIcon className="w-5 h-5" /></button>
                            <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Share"><ShareIcon className="w-5 h-5" /></button>
                         </div>
                    </div>

                    <div className="flex-shrink-0 p-3">
                        <AIVisualization />
                         <div className="h-40 bg-gray-100 dark:bg-gray-900/50 rounded-md p-3 overflow-y-auto text-sm text-gray-600 dark:text-gray-300 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">Suggestions</h4>
                            <div className="flex flex-wrap gap-2">
                                <SuggestionButton>Add task due dates</SuggestionButton>
                                <SuggestionButton>Implement dark mode</SuggestionButton>
                                <SuggestionButton>View PDF</SuggestionButton>
                                <SuggestionButton>Resolve conflict</SuggestionButton>
                            </div>
                        </div>
                    </div>
                
                    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden min-h-0">
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs p-3 rounded-xl ${msg.role === 'user' ? 'bg-gray-800 dark:bg-gray-900 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} />
                                    {msg.role === 'model' && msg.text && !isLoading && msg.text !== '...' && <MessageActions text={msg.text} />}
                                </div>
                            </div>
                            ))}
                            {isLoading && messages[messages.length-1].role === 'user' && (
                            <div className="flex justify-start">
                                <div className="max-w-xs p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                </div>
                                </div>
                            </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                            <form onSubmit={handleSubmit}>
                                <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                                     <div className="relative">
                                        <button type="button" onClick={() => setIsAttachmentMenuOpen(p => !p)} className={ICON_BUTTON_CLASSES} title="Add attachment"><PlusCircleIcon className="w-6 h-6"/></button>
                                        {isAttachmentMenuOpen && <AttachmentMenu onSelect={(type) => { alert(`Attach ${type}`); setIsAttachmentMenuOpen(false); }} />}
                                    </div>
                                    <div className="relative">
                                        <button type="button" onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center space-x-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-md shadow-sm" title="Change model">
                                            <span className="font-semibold text-sm">{modelMode}</span>
                                            <ChevronDownIcon className="w-4 h-4"/>
                                        </button>
                                        {isModelMenuOpen && (
                                            <div className="absolute bottom-full mb-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                                {['Adaptive', 'Gemini Flash', 'Gemini Pro'].map(mode => (
                                                    <button key={mode} type="button" onClick={() => { setModelMode(mode); setIsModelMenuOpen(false); }} className="w-full text-left block px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">{mode}</button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" className={ICON_BUTTON_CLASSES} title="View on GitHub"><GitHubIcon className="w-5 h-5"/></button>
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Send message to Aetherius"
                                        disabled={isLoading}
                                        className="w-full bg-transparent px-2 focus:outline-none text-gray-800 dark:text-gray-200 text-sm disabled:opacity-50"
                                    />
                                    <button type="button" className={ICON_BUTTON_CLASSES} title="Use voice input"><MicrophoneIcon className="w-5 h-5"/></button>
                                    <button type="submit" disabled={isLoading || !input.trim()} className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:text-gray-400 disabled:cursor-not-allowed transition-colors" title="Send message">
                                        <ArrowUpCircleIcon className="h-6 w-6"/>
                                    </button>
                                </div>
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            </form>
                            <div className="mt-2 flex items-center gap-2">
                                <MapControlsMenu />
                                <AppActionsMenu />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'iframe' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm flex-shrink-0">
                        <span className="font-mono text-xs">{frameContent.title}</span>
                         <div className="flex items-center gap-1">
                            {frameContent.type === 'code' && (
                                <>
                                    <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Copy"><DocumentTextIcon className="w-4 h-4" /></button>
                                    <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Download"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                                    <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Save"><DocumentTextIcon className="w-4 h-4" /></button>
                                    <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Save to GitHub"><GitHubIcon className="w-4 h-4" /></button>
                                    <div className="relative group">
                                         <button className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="More actions"><EllipsisHorizontalIcon className="w-4 h-4" /></button>
                                         <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 hidden group-focus-within:block group-hover:block">
                                             <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">View History</button>
                                             <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Deploy App</button>
                                             <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Share App</button>
                                             <button className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">API Key</button>
                                         </div>
                                    </div>
                                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                </>
                            )}
                            <button onClick={() => setFrameContent(exampleContent.code)} className="px-2 py-0.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="View Code"><CodeBracketIcon className="w-4 h-4" /></button>
                            <button onClick={() => setFrameContent(exampleContent.image)} className="px-2 py-0.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="View Image"><ImageIcon className="w-4 h-4" /></button>
                            <button onClick={() => setFrameContent(exampleContent.video)} className="px-2 py-0.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="View Video"><VideoIcon className="w-4 h-4" /></button>
                            <button onClick={() => setFrameContent(exampleContent.audio)} className="px-2 py-0.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="View Audio"><MusicNoteIcon className="w-4 h-4" /></button>
                            <button onClick={() => setIsEnlarged(true)} className={`${ICON_BUTTON_CLASSES} p-1.5 rounded-md`} title="Enlarge view">
                                <ArrowsPointingOutIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative">
                       <div className="absolute inset-0">
                           <FrameContent {...frameContent} />
                       </div>
                    </div>
                </div>
            )}
            {activeTab === 'tools' && (
                 <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                    {activeTool === null ? (
                        <ToolSelectionScreen onSelectTool={setActiveTool} />
                    ) : (
                        <ToolRunner activeTool={activeTool} onBack={() => setActiveTool(null)} />
                    )}
                </div>
            )}
        </div>
    );
};