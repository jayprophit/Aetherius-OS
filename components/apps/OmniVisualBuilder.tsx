
import React, { useState, useRef, useEffect } from 'react';
import { 
    Squares2X2Icon, DocumentTextIcon, PhotoIcon, Square2StackIcon, 
    ArrowLeftIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, 
    PlusIcon, TrashIcon, Cog6ToothIcon, PlayIcon, EyeIcon,
    ListBulletIcon, TableCellsIcon, LayersIcon, SwatchIcon,
    CheckCircleIcon
} from '../Icons';

interface Element {
    id: string;
    type: 'heading' | 'text' | 'image' | 'button' | 'container' | 'card' | 'input' | 'navbar';
    name?: string;
    content?: string;
    children?: Element[];
    style?: React.CSSProperties;
}

const initialElements: Element[] = [
    {
        id: 'nav-1',
        type: 'navbar',
        name: 'Navigation Bar',
        style: { width: '100%', padding: '15px 30px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
        children: [
            { id: 'logo', type: 'heading', name: 'Logo', content: 'Brand', style: { fontSize: '20px', fontWeight: 'bold', margin: 0 } },
            { id: 'nav-links', type: 'container', name: 'Links', style: { display: 'flex', gap: '20px' }, children: [
                { id: 'l1', type: 'text', content: 'Home', style: { cursor: 'pointer' } },
                { id: 'l2', type: 'text', content: 'About', style: { cursor: 'pointer' } },
                { id: 'l3', type: 'button', content: 'Contact', style: { padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', border: 'none' } }
            ]}
        ]
    },
    {
        id: 'hero-1',
        type: 'container',
        name: 'Hero Section',
        style: { padding: '80px 20px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' },
        children: [
            { id: 'h-1', type: 'heading', content: 'Build Faster with OmniPlatform', style: { fontSize: '48px', fontWeight: '800', color: '#1e293b', maxWidth: '800px', lineHeight: '1.2' } },
            { id: 'p-1', type: 'text', content: 'Drag, drop, and deploy production-ready websites in minutes. No coding required.', style: { fontSize: '18px', color: '#64748b', maxWidth: '600px' } },
            { id: 'btn-group', type: 'container', style: { display: 'flex', gap: '10px', marginTop: '20px' }, children: [
                { id: 'b-1', type: 'button', content: 'Get Started', style: { padding: '14px 28px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none' } },
                { id: 'b-2', type: 'button', content: 'View Demo', style: { padding: '14px 28px', backgroundColor: 'transparent', color: '#2563eb', borderRadius: '8px', fontWeight: 'bold', border: '2px solid #2563eb' } }
            ]}
        ]
    }
];

const DraggableWidget: React.FC<{ type: string, icon: React.FC<any>, label: string, onAdd: () => void }> = ({ type, icon: Icon, label, onAdd }) => (
    <div 
        className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md cursor-pointer transition-all hover:border-blue-500 group h-24"
        onClick={onAdd}
    >
        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300 mb-2 group-hover:text-blue-500" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">{label}</span>
    </div>
);

const LayersPanel: React.FC<{ elements: Element[], selectedId: string | null, onSelect: (id: string) => void }> = ({ elements, selectedId, onSelect }) => {
    const renderTree = (els: Element[], depth = 0) => {
        return els.map(el => (
            <div key={el.id}>
                <div 
                    className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer text-xs ${el.id === selectedId ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
                >
                    {el.type === 'container' || el.type === 'navbar' ? <Square2StackIcon className="w-3 h-3"/> : <DocumentTextIcon className="w-3 h-3"/>}
                    <span className="truncate">{el.name || el.type}</span>
                </div>
                {el.children && renderTree(el.children, depth + 1)}
            </div>
        ));
    };

    return (
        <div className="flex-1 overflow-y-auto py-2">
            {renderTree(elements)}
        </div>
    );
};

const SettingsPanel: React.FC<{ element: Element | null, onUpdate: (styles: React.CSSProperties, content?: string) => void }> = ({ element, onUpdate }) => {
    if (!element) return (
        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <Squares2X2Icon className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Select an element to edit.</p>
        </div>
    );

    // Helper for style change
    const updateStyle = (key: string, value: string | number) => {
        onUpdate({ ...element.style, [key]: value }, element.content);
    };

    return (
        <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Identity</h3>
                <p className="text-sm font-mono text-gray-400 mb-2">{element.id}</p>
                <div className="text-sm font-bold text-gray-800 dark:text-white capitalize">{element.type}</div>
            </div>

            {element.content !== undefined && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Content</label>
                    <textarea 
                        className="w-full p-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={element.content}
                        onChange={(e) => onUpdate(element.style || {}, e.target.value)}
                        rows={3}
                    />
                </div>
            )}

            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><SwatchIcon className="w-3 h-3"/> Appearance</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 mb-1 block">Background</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={(element.style?.backgroundColor as string) || '#ffffff'}
                                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                    className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0"
                                />
                                <input 
                                    type="text"
                                    value={(element.style?.backgroundColor as string) || ''}
                                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                    className="flex-1 text-xs bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 mb-1 block">Text Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={(element.style?.color as string) || '#000000'}
                                    onChange={(e) => updateStyle('color', e.target.value)}
                                    className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Layout</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Display</label>
                        <select 
                            value={element.style?.display || 'block'} 
                            onChange={(e) => updateStyle('display', e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1"
                        >
                            <option value="block">Block</option>
                            <option value="flex">Flex</option>
                            <option value="grid">Grid</option>
                            <option value="inline-block">Inline Block</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Direction</label>
                        <select 
                            value={element.style?.flexDirection || 'row'} 
                            onChange={(e) => updateStyle('flexDirection', e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1"
                            disabled={element.style?.display !== 'flex'}
                        >
                            <option value="row">Row</option>
                            <option value="column">Column</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Align Items</label>
                        <select 
                            value={element.style?.alignItems || 'stretch'} 
                            onChange={(e) => updateStyle('alignItems', e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1"
                        >
                            <option value="stretch">Stretch</option>
                            <option value="center">Center</option>
                            <option value="flex-start">Start</option>
                            <option value="flex-end">End</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Justify Content</label>
                        <select 
                            value={element.style?.justifyContent || 'flex-start'} 
                            onChange={(e) => updateStyle('justifyContent', e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1"
                        >
                            <option value="flex-start">Start</option>
                            <option value="center">Center</option>
                            <option value="space-between">Space Between</option>
                            <option value="space-around">Space Around</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Spacing & Size</h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block">Padding</label>
                        <input type="text" value={element.style?.padding || ''} onChange={e => updateStyle('padding', e.target.value)} className="w-full text-xs border rounded p-1 bg-transparent"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">Margin</label>
                        <input type="text" value={element.style?.margin || ''} onChange={e => updateStyle('margin', e.target.value)} className="w-full text-xs border rounded p-1 bg-transparent"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">Width</label>
                        <input type="text" value={element.style?.width || ''} onChange={e => updateStyle('width', e.target.value)} className="w-full text-xs border rounded p-1 bg-transparent"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">Height</label>
                        <input type="text" value={element.style?.height || ''} onChange={e => updateStyle('height', e.target.value)} className="w-full text-xs border rounded p-1 bg-transparent"/>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Typography</h3>
                 <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block">Font Size</label>
                        <input type="text" value={element.style?.fontSize || ''} onChange={e => updateStyle('fontSize', e.target.value)} className="w-full text-xs border rounded p-1 bg-transparent"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">Weight</label>
                         <select 
                            value={element.style?.fontWeight || 'normal'} 
                            onChange={(e) => updateStyle('fontWeight', e.target.value)}
                            className="w-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1"
                        >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="100">Thin</option>
                            <option value="900">Black</option>
                        </select>
                    </div>
                </div>
                <div>
                     <label className="text-[10px] text-gray-500 block mb-1">Text Align</label>
                     <div className="flex bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 p-0.5">
                         {['left', 'center', 'right', 'justify'].map(align => (
                             <button 
                                key={align}
                                onClick={() => updateStyle('textAlign', align)}
                                className={`flex-1 text-[10px] uppercase py-1 rounded ${element.style?.textAlign === align ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                             >
                                 {align.charAt(0).toUpperCase()}
                             </button>
                         ))}
                     </div>
                </div>
            </div>
             
             <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Effects</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-gray-500 block">Radius</label>
                        <input type="text" value={element.style?.borderRadius || ''} onChange={e => updateStyle('borderRadius', e.target.value)} className="w-full text-xs border rounded p-1 bg-transparent"/>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block">Opacity</label>
                        <input type="range" min="0" max="1" step="0.1" value={element.style?.opacity || '1'} onChange={e => updateStyle('opacity', e.target.value)} className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                </div>
            </div>

        </div>
    );
};

export const OmniVisualBuilder: React.FC<{ onExit: () => void }> = ({ onExit }) => {
    const [elements, setElements] = useState<Element[]>(initialElements);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
    const [activeSidePanel, setActiveSidePanel] = useState<'elements' | 'layers'>('elements');
    const [previewMode, setPreviewMode] = useState(false);

    const handleAddElement = (type: Element['type']) => {
        const newEl: Element = {
            id: `el-${Date.now()}`,
            type,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            content: ['heading', 'text', 'button', 'input'].includes(type) ? 'New Element' : undefined,
            style: { 
                padding: '10px', 
                color: 'inherit',
                fontSize: type === 'heading' ? '24px' : '16px',
                backgroundColor: type === 'button' ? '#3b82f6' : type === 'card' ? '#ffffff' : 'transparent',
                borderRadius: type === 'button' || type === 'input' ? '4px' : '0px',
                border: type === 'input' ? '1px solid #ccc' : type === 'card' ? '1px solid #e5e7eb' : 'none',
                width: type === 'input' || type === 'card' ? '100%' : 'auto'
            }
        };

        if (type === 'card') {
            newEl.children = [
                { id: `c-head-${Date.now()}`, type: 'heading', content: 'Card Title', style: { fontSize: '18px', fontWeight: 'bold' } },
                { id: `c-txt-${Date.now()}`, type: 'text', content: 'Card content goes here.' }
            ];
            newEl.style = { ...newEl.style, padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' };
        }
        
        // Recursive add to selected container
        const addRecursive = (els: Element[]): boolean => {
             for(let i=0; i<els.length; i++) {
                 if (els[i].id === selectedId && (els[i].type === 'container' || els[i].type === 'card' || els[i].type === 'navbar')) {
                     els[i].children = [...(els[i].children || []), newEl];
                     return true;
                 }
                 if (els[i].children) {
                     if(addRecursive(els[i].children!)) return true;
                 }
             }
             return false;
        };

        const newElements = JSON.parse(JSON.stringify(elements));
        if (!selectedId || !addRecursive(newElements)) {
             if (newElements.length > 0 && newElements[1]?.type === 'container') {
                // Try to add to hero if no selection
                 newElements[1].children?.push(newEl);
             } else {
                 newElements.push(newEl);
             }
        }
        setElements(newElements);
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

    const handleDelete = () => {
        if(!selectedId) return;
        const deleteRecursive = (els: Element[]): Element[] => {
            return els.filter(el => el.id !== selectedId).map(el => ({
                ...el,
                children: el.children ? deleteRecursive(el.children) : undefined
            }));
        };
        setElements(deleteRecursive(elements));
        setSelectedId(null);
    };

    const findElement = (id: string | null, els: Element[]): Element | null => {
        if (!id) return null;
        for (const el of els) {
            if (el.id === id) return el;
            if (el.children) {
                const found = findElement(id, el.children);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedElement = findElement(selectedId, elements);

    const renderElement = (el: Element) => {
        const isSelected = el.id === selectedId && !previewMode;
        
        const commonProps = {
            key: el.id,
            onClick: (e: React.MouseEvent) => { 
                if(!previewMode) {
                    e.stopPropagation(); 
                    setSelectedId(el.id); 
                }
            },
            style: { 
                ...el.style, 
                outline: isSelected ? '2px solid #3b82f6' : 'none',
                outlineOffset: isSelected ? '-2px' : '0',
                position: 'relative' as const
            },
            className: `transition-all ${!previewMode ? 'hover:outline hover:outline-1 hover:outline-blue-300 hover:outline-dashed' : ''}`
        };

        switch (el.type) {
            case 'container':
            case 'card':
            case 'navbar':
                return (
                    <div {...commonProps}>
                        {el.children?.map(renderElement)}
                        {!previewMode && el.children?.length === 0 && (
                            <div className="p-4 text-gray-300 text-xs text-center border-2 border-dashed border-gray-200 rounded select-none">
                                {el.name} (Empty)
                            </div>
                        )}
                    </div>
                );
            case 'heading':
                return <h2 {...commonProps}>{el.content}</h2>;
            case 'button':
                return <button {...commonProps}>{el.content}</button>;
            case 'input':
                return <input {...commonProps} placeholder={el.content} readOnly={!previewMode} />;
            case 'image':
                return (
                    <div {...commonProps} className="bg-gray-200 min-h-[100px] flex items-center justify-center text-gray-500 rounded overflow-hidden">
                        <PhotoIcon className="w-8 h-8"/>
                    </div>
                );
            default:
                return <p {...commonProps}>{el.content}</p>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 font-sans">
            {/* Top Bar */}
            <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shadow-sm z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300" title="Go Back">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">VisualBuilder Pro</h1>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button onClick={() => setDeviceMode('desktop')} className={`p-2 rounded ${deviceMode === 'desktop' ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500'}`} title="Desktop View">
                        <ComputerDesktopIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setDeviceMode('tablet')} className={`p-2 rounded ${deviceMode === 'tablet' ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500'}`} title="Tablet View">
                         <div className="w-5 h-5 border-2 border-current rounded-sm" style={{ width: '14px', height: '18px', margin: '1px 3px' }}></div>
                    </button>
                    <button onClick={() => setDeviceMode('mobile')} className={`p-2 rounded ${deviceMode === 'mobile' ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500'}`} title="Mobile View">
                        <DevicePhoneMobileIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-3 items-center">
                    <button 
                        onClick={() => setPreviewMode(!previewMode)} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${previewMode ? 'bg-green-100 text-green-700 border border-green-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                        {previewMode ? <EyeIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                        {previewMode ? 'Edit' : 'Preview'}
                    </button>
                    {selectedId && (
                        <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete Selected">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
                    <button onClick={onExit} className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow">Publish</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Widgets & Layers */}
                {!previewMode && (
                    <div className="w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            <button 
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeSidePanel === 'elements' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveSidePanel('elements')}
                            >
                                Elements
                            </button>
                            <button 
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeSidePanel === 'layers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveSidePanel('layers')}
                            >
                                Layers
                            </button>
                        </div>
                        
                        {activeSidePanel === 'elements' ? (
                             <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                                <DraggableWidget type="container" icon={PlusIcon} label="Container" onAdd={() => handleAddElement('container')} />
                                <DraggableWidget type="card" icon={Square2StackIcon} label="Card" onAdd={() => handleAddElement('card')} />
                                <DraggableWidget type="navbar" icon={TableCellsIcon} label="Navbar" onAdd={() => handleAddElement('navbar')} />
                                <DraggableWidget type="heading" icon={DocumentTextIcon} label="Heading" onAdd={() => handleAddElement('heading')} />
                                <DraggableWidget type="text" icon={ListBulletIcon} label="Text" onAdd={() => handleAddElement('text')} />
                                <DraggableWidget type="image" icon={PhotoIcon} label="Image" onAdd={() => handleAddElement('image')} />
                                <DraggableWidget type="button" icon={PlayIcon} label="Button" onAdd={() => handleAddElement('button')} />
                                <DraggableWidget type="input" icon={Squares2X2Icon} label="Input" onAdd={() => handleAddElement('input')} />
                            </div>
                        ) : (
                            <LayersPanel elements={elements} selectedId={selectedId} onSelect={setSelectedId} />
                        )}
                    </div>
                )}

                {/* Canvas */}
                <div 
                    className="flex-1 bg-gray-200/50 dark:bg-black/50 overflow-auto flex justify-center p-8 cursor-default" 
                    onClick={() => setSelectedId(null)}
                >
                    <div 
                        className={`bg-white transition-all duration-300 shadow-2xl min-h-[800px] ${
                            deviceMode === 'mobile' ? 'w-[375px]' : 
                            deviceMode === 'tablet' ? 'w-[768px]' : 
                            'w-full max-w-[1200px]'
                        }`}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        {elements.map(renderElement)}
                    </div>
                </div>

                {/* Right Sidebar - Settings */}
                {!previewMode && (
                    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <span>Properties</span>
                            {selectedId && <button onClick={() => setSelectedId(null)}><Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-blue-500"/></button>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <SettingsPanel 
                                element={selectedElement} 
                                onUpdate={(style, content) => selectedId && handleUpdateElement(selectedId, style, content)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
