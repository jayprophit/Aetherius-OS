
import React, { useState } from 'react';
import { 
    Squares2X2Icon, DocumentTextIcon, PhotoIcon, Square2StackIcon, 
    ArrowLeftIcon, EyeIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, 
    PlusIcon, TrashIcon, Cog6ToothIcon
} from '../Icons';

interface Element {
    id: string;
    type: 'heading' | 'text' | 'image' | 'button' | 'container';
    content?: string;
    children?: Element[];
    style?: React.CSSProperties;
}

const initialElements: Element[] = [
    {
        id: 'el-1',
        type: 'container',
        style: { padding: '40px', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' },
        children: [
            { id: 'el-2', type: 'heading', content: 'Welcome to OmniPlatform', style: { fontSize: '32px', fontWeight: 'bold', color: '#1f2937' } },
            { id: 'el-3', type: 'text', content: 'Build your dream website with our visual editor.', style: { fontSize: '16px', color: '#4b5563' } },
            { id: 'el-4', type: 'button', content: 'Get Started', style: { padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', borderRadius: '5px', border: 'none', cursor: 'pointer' } }
        ]
    }
];

const DraggableWidget: React.FC<{ type: string, icon: React.FC<any>, label: string, onAdd: () => void }> = ({ type, icon: Icon, label, onAdd }) => (
    <div 
        className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md cursor-pointer transition-all hover:border-blue-500"
        onClick={onAdd}
    >
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 mb-2" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{label}</span>
    </div>
);

const SettingsPanel: React.FC<{ element: Element | null, onUpdate: (styles: React.CSSProperties, content?: string) => void }> = ({ element, onUpdate }) => {
    if (!element) return <div className="p-4 text-sm text-gray-500 text-center">Select an element to edit settings.</div>;

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Content</h3>
                {element.content !== undefined && (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold">Text</label>
                        <textarea 
                            className="w-full p-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                            value={element.content}
                            onChange={(e) => onUpdate(element.style || {}, e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-4">Style</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold">Background Color</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input 
                                type="color" 
                                value={element.style?.backgroundColor as string || '#ffffff'}
                                onChange={(e) => onUpdate({ ...element.style, backgroundColor: e.target.value }, element.content)}
                                className="w-8 h-8 rounded cursor-pointer border-0"
                            />
                            <span className="text-xs font-mono text-gray-500">{element.style?.backgroundColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold">Text Color</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input 
                                type="color" 
                                value={element.style?.color as string || '#000000'}
                                onChange={(e) => onUpdate({ ...element.style, color: e.target.value }, element.content)}
                                className="w-8 h-8 rounded cursor-pointer border-0"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold">Padding</label>
                        <input 
                            type="text" 
                            value={element.style?.padding as string || '0px'} 
                            onChange={(e) => onUpdate({ ...element.style, padding: e.target.value }, element.content)}
                            className="w-full p-2 mt-1 border rounded text-sm bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                     <div>
                        <label className="text-xs font-semibold">Font Size</label>
                        <input 
                            type="text" 
                            value={element.style?.fontSize as string || '16px'} 
                            onChange={(e) => onUpdate({ ...element.style, fontSize: e.target.value }, element.content)}
                            className="w-full p-2 mt-1 border rounded text-sm bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OmniVisualBuilder: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [elements, setElements] = useState<Element[]>(initialElements);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

    const handleAddElement = (type: Element['type']) => {
        const newEl: Element = {
            id: `el-${Date.now()}`,
            type,
            content: type === 'heading' ? 'New Heading' : type === 'button' ? 'Click Me' : 'Lorem ipsum text...',
            style: { padding: '10px', color: '#000' }
        };
        // Add to the first container for simplicity in this demo
        if (elements[0].children) {
            const newElements = [...elements];
            newElements[0].children?.push(newEl);
            setElements(newElements);
        }
    };

    const handleUpdateElement = (id: string, newStyle: React.CSSProperties, newContent?: string) => {
        const updateRecursive = (els: Element[]): Element[] => {
            return els.map(el => {
                if (el.id === id) {
                    return { ...el, style: newStyle, content: newContent };
                }
                if (el.children) {
                    return { ...el, children: updateRecursive(el.children) };
                }
                return el;
            });
        };
        setElements(updateRecursive(elements));
    };

    const selectedElement = (() => {
        let found: Element | null = null;
        const find = (els: Element[]) => {
            for (const el of els) {
                if (el.id === selectedId) found = el;
                if (el.children) find(el.children);
            }
        };
        find(elements);
        return found;
    })();

    const renderElement = (el: Element) => {
        const isSelected = el.id === selectedId;
        const commonProps = {
            key: el.id,
            onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedId(el.id); },
            style: { ...el.style, border: isSelected ? '2px solid #3b82f6' : '2px solid transparent', position: 'relative' as any },
            className: "hover:outline hover:outline-1 hover:outline-blue-300 transition-all"
        };

        switch (el.type) {
            case 'container':
                return (
                    <div {...commonProps}>
                        {el.children?.map(renderElement)}
                    </div>
                );
            case 'heading':
                return <h2 {...commonProps}>{el.content}</h2>;
            case 'button':
                return <button {...commonProps}>{el.content}</button>;
            case 'image':
                return <div {...commonProps} className="bg-gray-200 h-32 flex items-center justify-center text-gray-500">Image Placeholder</div>;
            default:
                return <p {...commonProps}>{el.content}</p>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 font-sans">
            {/* Top Bar */}
            <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">VisualBuilder Pro</h1>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setDeviceMode('desktop')} className={`p-2 rounded ${deviceMode === 'desktop' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>
                        <ComputerDesktopIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button onClick={() => setDeviceMode('mobile')} className={`p-2 rounded ${deviceMode === 'mobile' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}>
                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">Draft</button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow">Publish</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Widgets */}
                <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">Elements</div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                        <DraggableWidget type="heading" icon={DocumentTextIcon} label="Heading" onAdd={() => handleAddElement('heading')} />
                        <DraggableWidget type="text" icon={Squares2X2Icon} label="Text Editor" onAdd={() => handleAddElement('text')} />
                        <DraggableWidget type="image" icon={PhotoIcon} label="Image" onAdd={() => handleAddElement('image')} />
                        <DraggableWidget type="button" icon={Square2StackIcon} label="Button" onAdd={() => handleAddElement('button')} />
                        <DraggableWidget type="container" icon={PlusIcon} label="Container" onAdd={() => handleAddElement('container')} />
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-auto flex justify-center p-8">
                    <div 
                        className={`bg-white transition-all duration-300 shadow-xl min-h-[800px] ${deviceMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'}`}
                    >
                        {elements.map(renderElement)}
                    </div>
                </div>

                {/* Right Sidebar - Settings */}
                <div className="w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 flex justify-between items-center">
                        <span>Properties</span>
                        {selectedId && <button onClick={() => setSelectedId(null)}><Cog6ToothIcon className="w-5 h-5 text-gray-400"/></button>}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <SettingsPanel 
                            element={selectedElement} 
                            onUpdate={(style, content) => selectedId && handleUpdateElement(selectedId, style, content)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
