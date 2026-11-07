import React, { useState, useEffect } from 'react';
import {
    FolderIcon, DocumentTextIcon, PhotoIcon, VideoIcon,
    ChevronRightIcon, ArrowLeftIcon, TrashIcon, HomeIcon,
    MagnifyingGlassIcon, PlusIcon
} from '../Icons';

interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'image' | 'document' | 'video';
    size?: string;
    date: string;
    children?: FileNode[];
}

const STORAGE_KEY = 'aetherius.files.v1';

function seedFilesystem(): FileNode[] {
    return [
        {
            id: 'root',
            name: 'Aetherius HD',
            type: 'folder',
            date: new Date().toLocaleDateString(),
            children: [
                { id: 'docs', name: 'Documents', type: 'folder', date: new Date().toLocaleDateString(), children: [] },
                { id: 'pics', name: 'Pictures', type: 'folder', date: new Date().toLocaleDateString(), children: [] },
                { id: 'vids', name: 'Videos', type: 'folder', date: new Date().toLocaleDateString(), children: [] },
            ],
        },
    ];
}

function loadFilesystem(): FileNode[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as FileNode[];
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // Start empty rather than crashing.
    }
    return seedFilesystem();
}

function findFolder(root: FileNode[], path: string[]): FileNode | null {
    let current: FileNode | undefined = root[0];
    if (!current) return null;
    for (const id of path.slice(1)) {
        current = current.children?.find((child) => child.id === id);
        if (!current) return null;
    }
    return current;
}

/**
 * Files — a local-first virtual file system persisted in localStorage.
 * Create folders and files; they survive reload. It does not read the host
 * filesystem (a browser cannot) and does not claim to.
 */
export const FileManager: React.FC = () => {
    const [filesystem, setFilesystem] = useState<FileNode[]>(loadFilesystem);
    const [currentPath, setCurrentPath] = useState<FileNode[]>([filesystem[0]]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const currentFolder = currentPath[currentPath.length - 1];

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filesystem));
        } catch {
            // Private browsing / quota: the tree still works for the session.
        }
    }, [filesystem]);

    // Keep the open path valid after mutations.
    useEffect(() => {
        const ids = currentPath.map((node) => node.id);
        const resolved = findFolder(filesystem, ids);
        if (!resolved) setCurrentPath([filesystem[0]]);
    }, [filesystem, currentPath]);

    const mutate = (fn: (folder: FileNode) => void) => {
        setFilesystem((prev) => {
            const next: FileNode[] = JSON.parse(JSON.stringify(prev));
            const folder = findFolder(next, currentPath.map((node) => node.id));
            if (folder) fn(folder);
            return next;
        });
    };

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

    const handleCreateFolder = () => {
        const stamp = Date.now();
        mutate((folder) => {
            folder.children = folder.children || [];
            folder.children.push({
                id: `f${stamp}`,
                name: `New Folder ${folder.children.length + 1}`,
                type: 'folder',
                date: new Date().toLocaleDateString(),
            });
        });
    };

    const handleCreateFile = () => {
        const stamp = Date.now();
        mutate((folder) => {
            folder.children = folder.children || [];
            folder.children.push({
                id: `d${stamp}`,
                name: `New Document ${folder.children.length + 1}.txt`,
                type: 'document',
                size: '0 B',
                date: new Date().toLocaleDateString(),
            });
        });
    };

    const handleDeleteSelected = () => {
        if (!selectedFile) return;
        mutate((folder) => {
            folder.children = (folder.children || []).filter((child) => child.id !== selectedFile);
        });
        setSelectedFile(null);
    };

    const allFiles: FileNode[] = [];
    const collect = (node: FileNode) => {
        (node.children || []).forEach((child) => {
            allFiles.push(child);
            if (child.type === 'folder') collect(child);
        });
    };
    if (search.trim()) collect(filesystem[0]);

    const visible = search.trim()
        ? allFiles.filter((file) => file.name.toLowerCase().includes(search.trim().toLowerCase()))
        : (currentFolder?.children || []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'folder': return <FolderIcon className="w-10 h-10 text-blue-500" />;
            case 'image': return <PhotoIcon className="w-10 h-10 text-purple-500" />;
            case 'video': return <VideoIcon className="w-10 h-10 text-red-500" />;
            default: return <DocumentTextIcon className="w-10 h-10 text-gray-400" />;
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            {/* Sidebar */}
            <aside className="w-48 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col pt-4">
                <div className="px-4 mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Locations</div>
                <nav className="space-y-1 px-2">
                    <button onClick={() => setCurrentPath([filesystem[0]])} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left">
                        <HomeIcon className="w-4 h-4 text-blue-500" /> Aetherius HD
                    </button>
                    <button onClick={handleDeleteSelected} disabled={!selectedFile} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-40">
                        <TrashIcon className="w-4 h-4 text-gray-500" /> Delete selected
                    </button>
                </nav>
                <div className="px-4 mt-6">
                    <button onClick={handleCreateFolder} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <PlusIcon className="w-4 h-4" /> New Folder
                    </button>
                    <button onClick={handleCreateFile} className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <DocumentTextIcon className="w-4 h-4" /> New Document
                    </button>
                </div>
                <div className="px-4 mt-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2 top-2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search files"
                            className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs"
                        />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <header className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex gap-2">
                        <button onClick={handleBack} disabled={currentPath.length <= 1} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <nav className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 overflow-hidden">
                        {currentPath.map((node, index) => (
                            <span key={node.id} className="flex items-center gap-1">
                                <button onClick={() => handleBreadcrumb(index)} className="hover:text-blue-500 font-medium">
                                    {node.name}
                                </button>
                                {index < currentPath.length - 1 && <ChevronRightIcon className="w-3 h-3" />}
                            </span>
                        ))}
                    </nav>
                    {search.trim() && (
                        <span className="text-xs text-gray-400 ml-2">Results for “{search.trim()}” ({visible.length})</span>
                    )}
                </header>

                {/* File Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {visible.length === 0 ? (
                        <div className="text-center text-gray-400 mt-16">
                            <FolderIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm">This folder is empty.</p>
                            <p className="text-xs mt-1">Use New Folder or New Document to add files. They are saved on this device.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6">
                            {visible.map((file) => (
                                <button
                                    key={file.id}
                                    onDoubleClick={() => file.type === 'folder' && handleNavigate(file)}
                                    onClick={() => setSelectedFile(file.id)}
                                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${selectedFile === file.id ? 'bg-blue-50 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800/60'}`}
                                >
                                    {getIcon(file.type)}
                                    <span className="text-xs text-center break-words w-full truncate">{file.name}</span>
                                    <span className="text-[10px] text-gray-400">{file.size || file.date}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status bar with real stats */}
                <footer className="h-6 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center px-4 text-[10px] text-gray-500">
                    <span>{visible.length} items · saved on this device (local storage) — host filesystem is not accessible from a browser</span>
                </footer>
            </div>
        </div>
    );
};
