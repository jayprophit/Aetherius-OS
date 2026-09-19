
import React, { useState } from 'react';
import { 
    ChatBubbleLeftRightIcon, PhotoIcon, VideoIcon, CodeBracketIcon, 
    PresentationChartLineIcon, EnvelopeIcon, ArrowPathIcon, DocumentTextIcon, 
    CalendarIcon, ChartBarIcon, SearchIcon, SparklesIcon, ArrowRightIcon, 
    CheckCircleIcon, PlusIcon
} from '../Icons';

// Tool Categories and Inventory
const toolCategories = [
    { id: 'chat', name: 'AI Chatbots', icon: ChatBubbleLeftRightIcon, count: 10, desc: 'Conversational AI & Reasoning' },
    { id: 'image', name: 'Image Generation', icon: PhotoIcon, count: 8, desc: 'Text-to-Image & Editing' },
    { id: 'video', name: 'Video Creation', icon: VideoIcon, count: 8, desc: 'Text-to-Video & Animation' },
    { id: 'code', name: 'Coding Assistance', icon: CodeBracketIcon, count: 10, desc: 'Code Completion & Review' },
    { id: 'presentation', name: 'Presentation', icon: PresentationChartLineIcon, count: 8, desc: 'Slide Deck Generation' },
    { id: 'email', name: 'Email Assistant', icon: EnvelopeIcon, count: 4, desc: 'Writing & Sorting' },
    { id: 'workflow', name: 'Automation', icon: ArrowPathIcon, count: 6, desc: 'Workflow & Integration' },
    { id: 'writing', name: 'Content Writing', icon: DocumentTextIcon, count: 8, desc: 'Copywriting & SEO' },
    { id: 'meeting', name: 'Meetings', icon: CalendarIcon, count: 8, desc: 'Scheduling & Transcription' },
    { id: 'data', name: 'Data Analysis', icon: ChartBarIcon, count: 4, desc: 'Visualization & Insights' },
];

const toolInventory: Record<string, { name: string; desc: string; model: string; status: 'Active' | 'Planned' }[]> = {
    chat: [
        { name: 'ChatGPT Clone', desc: 'General purpose conversational AI.', model: 'GPT-4-Turbo', status: 'Active' },
        { name: 'Claude Clone', desc: 'Long-context analysis and coding.', model: 'Claude-3-Opus', status: 'Active' },
        { name: 'Gemini Clone', desc: 'Multimodal reasoning engine.', model: 'Gemini-1.5-Pro', status: 'Active' },
        { name: 'Perplexity Clone', desc: 'Real-time web research assistant.', model: 'Sonar-Large', status: 'Active' },
        { name: 'Grok Clone', desc: 'Real-time news and wit.', model: 'Grok-1.5', status: 'Planned' },
    ],
    image: [
        { name: 'Midjourney Clone', desc: 'Artistic high-fidelity generation.', model: 'V6-Alpha', status: 'Active' },
        { name: 'DALL-E Clone', desc: 'Prompt-faithful image creation.', model: 'DALL-E-3', status: 'Active' },
        { name: 'Stable Diffusion XL', desc: 'Open-source flexible generation.', model: 'SDXL-Turbo', status: 'Active' },
        { name: 'Adobe Firefly Clone', desc: 'Commercial-safe asset generation.', model: 'Firefly-v2', status: 'Planned' },
    ],
    video: [
        { name: 'Sora Clone', desc: 'High-fidelity video generation.', model: 'Sora-v1', status: 'Planned' },
        { name: 'Runway Gen-2', desc: 'Cinematic video synthesis.', model: 'Gen-2', status: 'Active' },
        { name: 'Pika Labs Clone', desc: 'Animation and motion control.', model: 'Pika-1.0', status: 'Active' },
    ],
    code: [
        { name: 'GitHub Copilot Clone', desc: 'IDE-integrated code completion.', model: 'Codex-v2', status: 'Active' },
        { name: 'Devin Clone', desc: 'Autonomous software engineer.', model: 'Devin-Beta', status: 'Planned' },
        { name: 'Cursor Clone', desc: 'AI-native code editor.', model: 'Cursor-Small', status: 'Active' },
    ]
};

const Sidebar: React.FC<{ activeCategory: string, onSelect: (id: string) => void }> = ({ activeCategory, onSelect }) => (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
                AI Platform
            </h2>
            <p className="text-xs text-gray-500 mt-1">120+ Integrated Tools</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <button 
                onClick={() => onSelect('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${activeCategory === 'dashboard' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                <span>Dashboard</span>
            </button>
            <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
            {toolCategories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${activeCategory === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    <div className="flex items-center gap-3">
                        <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                        <span>{cat.name}</span>
                    </div>
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-gray-500">{cat.count}</span>
                </button>
            ))}
        </nav>
    </div>
);

const ToolCard: React.FC<{ tool: { name: string, desc: string, model: string, status: string } }> = ({ tool }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-shadow group cursor-pointer">
        <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${tool.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {tool.status}
            </span>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{tool.desc}</p>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-[10px] font-mono text-gray-400">{tool.model}</span>
            <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </div>
    </div>
);

const DashboardView: React.FC<{ onSelectCategory: (id: string) => void }> = ({ onSelectCategory }) => (
    <div className="space-y-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">AI Productivity Platform</h1>
            <p className="text-blue-100 max-w-2xl">
                Access over 120 integrated AI tools in a single unified interface. 
                Generate content, write code, and automate workflows with enterprise-grade models.
            </p>
            <div className="mt-6 flex gap-4">
                <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors">
                    Quick Start Guide
                </button>
                <button className="bg-purple-700/50 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-purple-700/70 transition-colors border border-white/20">
                    View API Docs
                </button>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Tool Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {toolCategories.map(cat => (
                    <div 
                        key={cat.id} 
                        onClick={() => onSelectCategory(cat.id)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                <cat.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">{cat.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CategoryView: React.FC<{ categoryId: string }> = ({ categoryId }) => {
    const category = toolCategories.find(c => c.id === categoryId);
    const tools = toolInventory[categoryId] || [];

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        {category && <category.icon className="w-8 h-8 text-blue-600" />}
                        {category?.name}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{category?.desc}</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                        {tools.length} Tools Available
                    </span>
                </div>
            </div>

            {tools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tools.map((tool, idx) => (
                        <ToolCard key={idx} tool={tool} />
                    ))}
                     {/* Placeholder for expansion */}
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 hover:border-gray-300 transition-colors cursor-pointer">
                        <PlusIcon className="w-8 h-8 mb-2" />
                        <span className="text-sm font-bold">Request New Tool</span>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-bold mb-2">Coming Soon</h3>
                    <p className="text-sm max-w-md text-center">
                        We are currently integrating models for the {category?.name} category. 
                        Check back in the next release cycle.
                    </p>
                </div>
            )}
        </div>
    );
};

export const AiProductivityPlatform: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex h-full bg-gray-50 dark:bg-gray-900 font-sans animate-fade-in">
            <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 shrink-0">
                    <div className="relative w-96">
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search 120+ AI tools..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600">Documentation</button>
                        <button className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600">API Access</button>
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full"></div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {activeCategory === 'dashboard' ? (
                        <DashboardView onSelectCategory={setActiveCategory} />
                    ) : (
                        <CategoryView categoryId={activeCategory} />
                    )}
                </main>
            </div>
        </div>
    );
};
