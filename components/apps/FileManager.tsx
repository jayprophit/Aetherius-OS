
import React, { useState } from 'react';
import { 
    FolderIcon, DocumentTextIcon, PhotoIcon, VideoIcon, 
    ChevronRightIcon, ArrowLeftIcon, ArrowPathIcon, 
    CloudIcon, ComputerDesktopIcon, TrashIcon, HomeIcon,
    MagnifyingGlassIcon
} from '../Icons';

interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'image' | 'document' | 'video' | 'system';
    size?: string;
    date: string;
    children?: FileNode[];
}

const fileSystem: FileNode[] = [
    {
        id: 'root',
        name: 'Aetherius HD',
        type: 'folder',
        date: 'Oct 24, 2025',
        children: [
            {
                id: 'docs',
                name: 'Documents',
                type: 'folder',
                date: 'Oct 24, 2025',
                children: [
                    { id: 'doc1', name: 'Project_Genesis_Specs.pdf', type: 'document', size: '2.4 MB', date: 'Oct 20, 2025' },
                    { id: 'doc2', name: 'Q4_Financials.xlsx', type: 'document', size: '1.1 MB', date: 'Oct 22, 2025' },
                    { id: 'doc3', name: 'Manifesto.txt', type: 'document', size: '12 KB', date: 'Oct 10, 2025' },
                ]
            },
            {
                id: 'images',
                name: 'Pictures',
                type: 'folder',
                date: 'Oct 24, 2025',
                children: [
                    { id: 'img1', name: 'Avatar_Render.png', type: 'image', size: '4.2 MB', date: 'Sep 15, 2025' },
                    { id: 'img2', name: 'Screenshot_2025-10-01.png', type: 'image', size: '1.8 MB', date: 'Oct 01, 2025' },
                ]
            },
            {
                id: 'sys',
                name: 'System',
                type: 'folder',
                date: 'Jan 01, 2025',
                children: [
                    { id: 'sys1', name: 'kernel.wasm', type: 'system', size: '64 MB', date: 'Jan 01, 2025' },
                    { id: 'sys2', name: 'boot_config.json', type: 'system', size: '2 KB', date: 'Jan 01, 2025' },
                ]
            },
            {
                id: 'cloud',
                name: 'Cloud Drive',
                type: 'folder',
                date: 'Synced Now',
                children: [
                    { id: 'c1', name: 'Backup_2024.zip', type: 'system', size: '12 GB', date: 'Dec 31, 2024' }
                ]
            }
        ]
    }
];

export const FileManager: React.FC = () => {
    const [currentPath, setCurrentPath] = useState<FileNode[]>([fileSystem[0]]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);

    const currentFolder = currentPath[currentPath.length - 1];

    const handleNavigate = (folder: FileNode) => {
        setCurrentPath([...currentPath, folder]);
        setSelectedFile(null);
    };

    const handleBack = () => {
        if (currentPath.length > 1) {
            setCurrentPath(currentPath.slice(0, -1));
            setSelectedFile(null);
        }
    };

    const handleBreadcrumb = (index: number) => {
        setCurrentPath(currentPath.slice(0, index + 1));
        setSelectedFile(null);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'folder': return <FolderIcon className="w-10 h-10 text-blue-500" />;
            case 'image': return <PhotoIcon className="w-10 h-10 text-purple-500" />;
            case 'video': return <VideoIcon className="w-10 h-10 text-red-500" />;
            case 'system': return <ComputerDesktopIcon className="w-10 h-10 text-gray-500" />;
            default: return <DocumentTextIcon className="w-10 h-10 text-gray-400" />;
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            {/* Sidebar */}
            <aside className="w-48 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col pt-4">
                <div className="px-4 mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Locations</div>
                <nav className="space-y-1 px-2">
                    <button onClick={() => setCurrentPath([fileSystem[0]])} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                        <ComputerDesktopIcon className="w-4 h-4 text-blue-500" /> This PC
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                        <CloudIcon className="w-4 h-4 text-blue-400" /> iCloud Drive
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                        <TrashIcon className="w-4 h-4 text-gray-500" /> Trash
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <header className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex gap-2">
                        <button onClick={handleBack} disabled={currentPath.length <= 1} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <ArrowPathIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Breadcrumbs */}
                    <div className="flex-1 flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-1 text-sm overflow-hidden">
                        <HomeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        {currentPath.map((node, i) => (
                            <React.Fragment key={node.id}>
                                {i > 0 && <ChevronRightIcon className="w-3 h-3 text-gray-400 mx-1" />}
                                <button 
                                    onClick={() => handleBreadcrumb(i)}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-800 px-1 rounded truncate"
                                >
                                    {node.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="text" placeholder="Search" className="w-40 pl-8 pr-3 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                </header>

                {/* File Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {currentFolder.children?.map(file => (
                            <div 
                                key={file.id}
                                onClick={() => file.type === 'folder' ? handleNavigate(file) : setSelectedFile(file.id)}
                                className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all border ${selectedFile === file.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                {getIcon(file.type)}
                                <span className="text-xs font-medium text-center mt-2 truncate w-full select-none">{file.name}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">{file.size || 'Item'}</span>
                            </div>
                        ))}
                        {(!currentFolder.children || currentFolder.children.length === 0) && (
                            <div className="col-span-full text-center text-gray-400 py-20">
                                <FolderIcon className="w-16 h-16 mx-auto mb-2 opacity-20" />
                                <p>This folder is empty</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Status */}
                <footer className="h-8 border-t border-gray-200 dark:border-gray-700 flex items-center px-4 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">
                    <span>{currentFolder.children?.length || 0} items</span>
                    <span className="mx-2">|</span>
                    <span>Free Space: 842 GB</span>
                </footer>
            </div>
        </div>
    );
};
