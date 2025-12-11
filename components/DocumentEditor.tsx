

import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { 
    DocumentTextIcon, StarIcon, ClockIcon, ArrowDownTrayIcon, 
    ShareIcon, PlusIcon, ChevronDownIcon, ArrowLeftIcon, ArrowRightIcon,
    EyeIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon,
    TrashIcon, ArchiveBoxIcon
} from './Icons';

export const DocumentEditor: React.FC = () => {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('Untitled Document');
    
    // History State
    const [history, setHistory] = useState<string[]>(['']);
    const [historyIndex, setHistoryIndex] = useState(0);
    
    // Editor State
    const [fontSize, setFontSize] = useState(16);
    const [showPreview, setShowPreview] = useState(false);
    
    // Find & Replace State
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    
    // Auto-save State
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    const [isDirty, setIsDirty] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load initial content
    useEffect(() => {
        const savedContent = localStorage.getItem('document_editor_content');
        if (savedContent) {
            setContent(savedContent);
            setHistory([savedContent]);
            setHistoryIndex(0);
        }
    }, []);

    // Auto-save timer (30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (isDirty) {
                saveDocument();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [content, isDirty]);

    const saveDocument = () => {
        localStorage.setItem('document_editor_content', content);
        setLastSaved(new Date());
        setIsDirty(false);
    };

    const updateContent = (newContent: string, addToHistory = true) => {
        setContent(newContent);
        setIsDirty(true);
        
        if (addToHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newContent);
            // Limit history to 50 steps
            if (newHistory.length > 50) newHistory.shift();
            
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setContent(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setContent(history[newIndex]);
        }
    };

    const insertMarkdown = (prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = textareaRef.current.value;
        
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        const newContent = `${before}${prefix}${selected}${suffix}${after}`;
        updateContent(newContent);
        
        // Defer focus restoration to allow render
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
            }
        }, 0);
    };

    const handleReplace = (replaceAll: boolean) => {
        if (!findText) return;
        
        if (replaceAll) {
            // Using split/join instead of replaceAll for broader compatibility with older TS configs
            const newContent = content.split(findText).join(replaceText);
            if (newContent !== content) updateContent(newContent);
        } else {
            const newContent = content.replace(findText, replaceText);
            if (newContent !== content) updateContent(newContent);
        }
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 hidden md:flex">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow hover:bg-blue-700 transition-colors mb-6">
                    <PlusIcon className="w-4 h-4" /> New Document
                </button>
                
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-500 uppercase px-2 mb-2">My Library</h3>
                    {['Project Proposal', 'Q4 Meeting Notes', 'Ideas Draft', 'Script v1'].map(doc => (
                        <div key={doc} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                            {doc}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Editor */}
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
                {/* Top Toolbar */}
                <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)}
                            className="text-lg font-bold bg-transparent outline-none text-gray-900 dark:text-white w-full"
                        />
                        <div className="flex gap-4 text-xs text-gray-500 mt-1 items-center">
                            <button className="hover:text-gray-800 dark:hover:text-gray-300">File</button>
                            <button className="hover:text-gray-800 dark:hover:text-gray-300">Edit</button>
                            <button className="hover:text-gray-800 dark:hover:text-gray-300">View</button>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1">
                                {isDirty ? (
                                    <>
                                        <ClockIcon className="w-3 h-3 text-yellow-500"/> Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-3 h-3 text-green-500"/> Saved {lastSaved.toLocaleTimeString()}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={saveDocument} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title="Save Now">
                            <ArrowDownTrayIcon className="w-5 h-5 text-gray-500"/>
                        </button>
                        <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold flex items-center gap-2">
                            <ShareIcon className="w-4 h-4"/> Share
                        </button>
                    </div>
                </header>

                {/* Formatting Bar */}
                <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto flex-shrink-0">
                    {/* Undo/Redo */}
                    <div className="flex items-center gap-1 mr-2 border-r border-gray-300 dark:border-gray-600 pr-2">
                        <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                            <ArrowLeftIcon className="w-4 h-4 text-gray-700 dark:text-gray-200"/>
                        </button>
                        <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30">
                            <ArrowRightIcon className="w-4 h-4 text-gray-700 dark:text-gray-200"/>
                        </button>
                    </div>

                    {/* Markdown Tools */}
                    <select className="bg-transparent text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300">
                        <option>Normal Text</option>
                        <option>Heading 1</option>
                        <option>Heading 2</option>
                        <option>Heading 3</option>
                    </select>
                    
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
                        <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold font-serif w-8">B</button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 italic font-serif w-8">I</button>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <button onClick={() => insertMarkdown('`', '`')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 font-mono text-xs w-8">&lt;/&gt;</button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    {/* Font Size */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setFontSize(Math.max(10, fontSize - 2))} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm font-bold text-gray-600 dark:text-gray-300">-</button>
                        <span className="text-sm font-mono w-6 text-center">{fontSize}</span>
                        <button onClick={() => setFontSize(Math.min(48, fontSize + 2))} className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm font-bold text-gray-600 dark:text-gray-300">+</button>
                    </div>

                    <div className="flex-1"></div>

                    {/* Tools */}
                    <button 
                        onClick={() => setShowFindReplace(!showFindReplace)} 
                        className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold ${showFindReplace ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                        <MagnifyingGlassIcon className="w-4 h-4"/> Find
                    </button>

                    <button 
                        onClick={() => setShowPreview(!showPreview)} 
                        className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold ${showPreview ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                        <EyeIcon className="w-4 h-4"/> Preview
                    </button>
                </div>

                {/* Find & Replace Bar */}
                {showFindReplace && (
                    <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap items-center gap-2 animate-fade-in-down">
                        <input 
                            type="text" 
                            placeholder="Find..." 
                            value={findText}
                            onChange={e => setFindText(e.target.value)}
                            className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <input 
                            type="text" 
                            placeholder="Replace with..." 
                            value={replaceText}
                            onChange={e => setReplaceText(e.target.value)}
                            className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button onClick={() => handleReplace(false)} className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600">Replace</button>
                        <button onClick={() => handleReplace(true)} className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600">Replace All</button>
                        <button onClick={() => setShowFindReplace(false)} className="ml-auto p-1 hover:text-red-500"><XMarkIcon className="w-4 h-4"/></button>
                    </div>
                )}

                {/* Paper Area */}
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-8 flex justify-center relative">
                    <div className="w-full max-w-[816px] min-h-[1056px] bg-white dark:bg-gray-800 shadow-lg p-12 text-gray-800 dark:text-gray-200">
                        {showPreview ? (
                            <div 
                                className="prose dark:prose-invert max-w-none" 
                                style={{ fontSize: `${fontSize}px` }}
                                dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}
                            />
                        ) : (
                            <textarea 
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => updateContent(e.target.value)}
                                className="w-full h-full bg-transparent outline-none resize-none leading-relaxed font-mono"
                                style={{ fontSize: `${fontSize}px` }}
                                placeholder="Start typing or use Markdown..."
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};