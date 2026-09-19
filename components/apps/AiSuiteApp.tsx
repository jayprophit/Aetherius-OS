
import React, { useState, useEffect } from 'react';
import { 
    PhotoIcon, CodeBracketIcon, SpeakerWaveIcon, SparklesIcon, 
    PlayIcon, ArrowDownTrayIcon, CommandLineIcon, AdjustmentsHorizontalIcon,
    CpuChipIcon
} from '../Icons';

// --- Sub-Components for the Studio ---

const ImageGenWorkspace: React.FC = () => {
    const [prompt, setPrompt] = useState('A futuristic city floating in clouds, cyberpunk style, neon lights, 8k resolution');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleGenerate = () => {
        setGenerating(true);
        setProgress(0);
        setResult(null);
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setGenerating(false);
                    // Select a random tech/sci-fi image from Unsplash
                    const images = [
                        'https://images.unsplash.com/photo-1535378433864-643131b77c70?q=80&w=1000',
                        'https://images.unsplash.com/photo-1614726365723-49cfa28018b4?q=80&w=1000',
                        'https://images.unsplash.com/photo-1618193139062-2c5bf4f935b7?q=80&w=1000'
                    ];
                    setResult(images[Math.floor(Math.random() * images.length)]);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            <div className="flex gap-4">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Describe the image you want to generate..."
                />
                <button 
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    {generating ? <SparklesIcon className="w-5 h-5 animate-spin"/> : <PhotoIcon className="w-5 h-5"/>}
                    Generate
                </button>
            </div>

            <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden group">
                {!generating && !result && (
                    <div className="text-center text-gray-600">
                        <PhotoIcon className="w-16 h-16 mx-auto mb-4 opacity-50"/>
                        <p>Enter a prompt to generate artwork</p>
                    </div>
                )}
                
                {generating && (
                    <div className="w-64">
                        <p className="text-purple-400 text-center mb-2 font-mono text-sm">Diffusion Process: {progress}%</p>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {result && !generating && (
                    <>
                        <img src={result} alt="Generated" className="w-full h-full object-contain" />
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black">
                                <ArrowDownTrayIcon className="w-4 h-4"/> Save
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const CodeGenWorkspace: React.FC = () => {
    const [input, setInput] = useState('Write a Python function to calculate the Fibonacci sequence using recursion.');
    const [code, setCode] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleGenerate = () => {
        setCode('');
        setIsTyping(true);
        const mockCode = `def fibonacci(n):
    """
    Calculates the nth Fibonacci number recursively.
    """
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Example Usage
for i in range(10):
    print(fibonacci(i))
    
# Output: 0 1 1 2 3 5 8 13 21 34`;

        let i = 0;
        const interval = setInterval(() => {
            setCode(mockCode.substring(0, i));
            i++;
            if (i > mockCode.length) {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 30);
    };

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-sm font-bold text-gray-400 mb-2">INSTRUCTION</h3>
                <div className="flex gap-4">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-white font-mono focus:border-blue-500 outline-none h-24 resize-none"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={isTyping}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-bold flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <CommandLineIcon className="w-6 h-6"/>
                        Generate Code
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-gray-700 p-4 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
                    <span className="text-xs font-mono text-gray-400">main.py</span>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    </div>
                </div>
                <pre className="flex-1 font-mono text-sm text-green-400 overflow-auto">
                    <code>{code}{isTyping && <span className="animate-pulse">_</span>}</code>
                </pre>
            </div>
        </div>
    );
};

const AudioGenWorkspace: React.FC = () => {
    const [text, setText] = useState('Welcome to Aetherius OS. I am your virtual assistant.');
    const [playing, setPlaying] = useState(false);

    const handleSpeak = () => {
        setPlaying(true);
        setTimeout(() => setPlaying(false), 3000);
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-12 gap-8">
            <div className="w-full max-w-2xl space-y-4">
                <label className="text-sm font-bold text-gray-400">TEXT TO SPEECH INPUT</label>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-6 text-lg text-white focus:ring-2 focus:ring-green-500 outline-none h-48 resize-none"
                />
            </div>

            <div className="flex items-center gap-6">
                <button className="p-4 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700">
                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-400"/>
                </button>
                <button 
                    onClick={handleSpeak}
                    className={`p-6 rounded-full ${playing ? 'bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]' : 'bg-green-600 hover:bg-green-500'} text-white transition-all`}
                >
                    {playing ? <SpeakerWaveIcon className="w-8 h-8 animate-pulse"/> : <PlayIcon className="w-8 h-8"/>}
                </button>
                 <button className="p-4 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700">
                    <ArrowDownTrayIcon className="w-6 h-6 text-gray-400"/>
                </button>
            </div>
            
            {playing && (
                <div className="flex gap-1 h-12 items-center">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-2 bg-green-500 rounded-full animate-[bounce_1s_infinite]" 
                            style={{ 
                                height: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.05}s`
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Component ---

export const AiSuiteApp: React.FC<{ onSetView: (view: string) => void }> = () => {
    const [activeTool, setActiveTool] = useState<'image' | 'code' | 'audio'>('image');

    return (
        <div className="h-full flex bg-gray-950 text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold flex items-center gap-3">
                        <CpuChipIcon className="w-8 h-8 text-blue-500"/>
                        GenAI Studio
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Creative Intelligence Suite</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTool('image')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTool === 'image' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <PhotoIcon className="w-5 h-5"/> Image Generator
                    </button>
                    <button 
                        onClick={() => setActiveTool('code')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTool === 'code' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <CodeBracketIcon className="w-5 h-5"/> Code Architect
                    </button>
                    <button 
                        onClick={() => setActiveTool('audio')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTool === 'audio' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <SpeakerWaveIcon className="w-5 h-5"/> Voice Synth
                    </button>
                </nav>
                <div className="p-4 text-xs text-gray-600 text-center">
                    v2.4.0 | Connected to Aether Core
                </div>
            </aside>

            {/* Workspace */}
            <main className="flex-1 bg-gray-950 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-50"></div>
                {activeTool === 'image' && <ImageGenWorkspace />}
                {activeTool === 'code' && <CodeGenWorkspace />}
                {activeTool === 'audio' && <AudioGenWorkspace />}
            </main>
        </div>
    );
};
