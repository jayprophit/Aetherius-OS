import React, { useState, useRef, KeyboardEvent, useMemo, useEffect } from 'react';
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, LockClosedIcon, StarIcon, ChevronDownIcon, BookmarkIcon } from './Icons';
import { ICON_BUTTON_CLASSES } from '../constants';

interface Bookmark {
  title: string;
  url: string;
}

export const Browser: React.FC = () => {
    const [url, setUrl] = useState<string>('https://www.google.com/webhp?igu=1');
    const [displayUrl, setDisplayUrl] = useState<string>('https://www.google.com');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [history, setHistory] = useState<string[]>(['https://www.google.com/webhp?igu=1']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
    const bookmarksMenuRef = useRef<HTMLDivElement>(null);

    // Load bookmarks from localStorage on initial render
    useEffect(() => {
        try {
            const savedBookmarks = localStorage.getItem('aetherius_bookmarks');
            if (savedBookmarks) {
                setBookmarks(JSON.parse(savedBookmarks));
            }
        } catch (error) {
            console.error("Failed to load bookmarks:", error);
        }
    }, []);

    // Save bookmarks to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('aetherius_bookmarks', JSON.stringify(bookmarks));
        } catch (error) {
            console.error("Failed to save bookmarks:", error);
        }
    }, [bookmarks]);

    // Close bookmarks menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bookmarksMenuRef.current && !bookmarksMenuRef.current.contains(event.target as Node)) {
                setIsBookmarksOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;

    const navigateTo = (newUrl: string, addToHistory = true) => {
        let finalUrl = newUrl;
        if (!/^https?:\/\//i.test(newUrl)) {
            finalUrl = `https://www.google.com/search?q=${encodeURIComponent(newUrl)}`;
        }
        
        setUrl(finalUrl);
        setDisplayUrl(finalUrl);
        setIsBookmarksOpen(false); // Close menu on navigation

        if (addToHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(finalUrl);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            navigateTo(e.currentTarget.value);
        }
    };
    
    const handleRefresh = () => {
        if (iframeRef.current) {
            iframeRef.current.src = url;
        }
    };

    const handleBack = () => {
        if (canGoBack) {
            const newIndex = historyIndex - 1;
            const newUrl = history[newIndex];
            setUrl(newUrl);
            setDisplayUrl(newUrl);
            setHistoryIndex(newIndex);
        }
    };

    const handleForward = () => {
        if (canGoForward) {
            const newIndex = historyIndex + 1;
            const newUrl = history[newIndex];
            setUrl(newUrl);
            setDisplayUrl(newUrl);
            setHistoryIndex(newIndex);
        }
    };
    
    const handleHome = () => {
        navigateTo('https://www.google.com/webhp?igu=1');
    };

    const handleIframeLoad = () => {
        try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                const newUrl = iframeRef.current.contentWindow.location.href;
                if(newUrl !== 'about:blank' && newUrl !== url){
                   // Cross-origin policies prevent reading the URL from the iframe directly
                }
            }
        } catch (e) {
            console.warn("Could not access iframe location due to cross-origin restrictions.");
        }
    };

    const isCurrentUrlBookmarked = useMemo(() => {
        return bookmarks.some(bookmark => bookmark.url === url);
    }, [bookmarks, url]);

    const handleToggleBookmark = () => {
        if (isCurrentUrlBookmarked) {
            setBookmarks(bookmarks.filter(b => b.url !== url));
        } else {
            const title = prompt('Enter a title for this bookmark:', document.title || displayUrl);
            if (title) {
                setBookmarks([...bookmarks, { title, url }]);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2">
                <button onClick={handleBack} disabled={!canGoBack} className={ICON_BUTTON_CLASSES} title="Go back">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button onClick={handleForward} disabled={!canGoForward} className={ICON_BUTTON_CLASSES} title="Go forward">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button onClick={handleRefresh} className={ICON_BUTTON_CLASSES} title="Reload page">
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
                <button onClick={handleHome} className={ICON_BUTTON_CLASSES} title="Go to home page">
                    <HomeIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                    <LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        value={displayUrl}
                        onChange={(e) => setDisplayUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search Google or type a URL"
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full h-9 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                    />
                    <button onClick={handleToggleBookmark} className={`absolute right-1 top-1/2 -translate-y-1/2 ${ICON_BUTTON_CLASSES}`} title="Add to bookmarks">
                        <StarIcon className={`w-5 h-5 ${isCurrentUrlBookmarked ? 'text-yellow-400' : 'text-gray-400'}`} solid={isCurrentUrlBookmarked} />
                    </button>
                </div>
                <div className="relative" ref={bookmarksMenuRef}>
                    <button onClick={() => setIsBookmarksOpen(!isBookmarksOpen)} className={`${ICON_BUTTON_CLASSES} flex items-center gap-1`} title="View bookmarks">
                        <BookmarkIcon className="w-5 h-5" />
                        <ChevronDownIcon className="w-4 h-4"/>
                    </button>
                    {isBookmarksOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in-up">
                            <div className="p-2 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 mb-1">Bookmarks</div>
                            {bookmarks.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto">
                                    {bookmarks.map((bookmark, index) => (
                                        <button 
                                            key={index}
                                            onClick={() => navigateTo(bookmark.url)}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                        >
                                            <span className="truncate flex-1">{bookmark.title}</span>
                                            <span className="text-xs text-gray-400 truncate max-w-[100px]">{bookmark.url.replace(/^https?:\/\//, '')}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">No bookmarks yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </header>
            <main className="flex-1 bg-white dark:bg-black">
                <iframe
                    ref={iframeRef}
                    src={url}
                    className="w-full h-full border-none"
                    title="Aetherius OS Browser"
                    sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts"
                    onLoad={handleIframeLoad}
                ></iframe>
            </main>
        </div>
    );
};
