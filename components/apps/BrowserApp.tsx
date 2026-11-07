import React, { useState, useEffect, useRef } from 'react';
import { BrowserSession } from '../../apps/aetherius-app-suite/src/browser.ts';
import { ArrowLeftIcon, ArrowRightIcon, ArrowPathIcon, PlusIcon, BookmarkIcon, XMarkIcon } from '../Icons';

interface BookmarkRecord {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

const HISTORY_KEY = 'aetherius.browser.v1';

interface Persisted {
  tabs: Array<{ id: string; url: string; title: string; history: string[]; index: number; createdAt: string }>;
  activeId: string | null;
  bookmarks: BookmarkRecord[];
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(state: Persisted): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or quota: the session still works.
  }
}

/**
 * Browser — a real tabbed web browser for the shell.
 *
 * Tabs render in iframes. History back/forward uses the frame's own
 * navigation, bookmarks persist locally, and tabs survive reload. Sites
 * that refuse framing (X-Frame-Options) are reported honestly.
 */
export const BrowserApp: React.FC = () => {
  const sessionRef = useRef<BrowserSession | null>(null);
  const [tabs, setTabs] = useState<Array<{ id: string; url: string; title: string }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [frameNonce, setFrameNonce] = useState(0);
  const [frameError, setFrameError] = useState(false);

  useEffect(() => {
    sessionRef.current = new BrowserSession();
    const saved = loadPersisted();
    if (saved) {
      for (const tab of saved.tabs) {
        try {
          sessionRef.current.open(tab.url, tab.title);
        } catch {
          // Skip tabs whose URL is no longer valid.
        }
      }
      setBookmarks(saved.bookmarks);
      setTabs(sessionRef.current ? readTabs(sessionRef.current) : []);
      setActiveId(saved.activeId && sessionRef.current ? matchActive(sessionRef.current, saved) : null);
    } else {
      const home = sessionRef.current.open('https://aetherius-os.vercel.app', 'Aetherius OS');
      setTabs(readTabs(sessionRef.current));
      setActiveId(home.id);
      setAddress(home.url);
    }
  }, []);

  const readTabs = (session: BrowserSession): Array<{ id: string; url: string; title: string }> =>
    session.tabsList().map((tab) => ({ id: tab.id, url: tab.url, title: tab.title }));

  const matchActive = (session: BrowserSession, saved: Persisted): string | null => {
    const open = readTabs(session);
    if (open.some((tab) => tab.id === saved.activeId)) return saved.activeId;
    return open[0]?.id ?? null;
  };

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;

  const syncTabs = (session: BrowserSession) => {
    const next = readTabs(session);
    setTabs(next);
    const stillThere = next.some((tab) => tab.id === activeId);
    if (!stillThere && activeId !== null) setActiveId(next[0]?.id ?? null);
  };

  const saveState = (session: BrowserSession, nextActive: string | null) => {
    const tabsNow = readTabs(session);
    // The core keeps history internally; persist URL + title per tab.
    persist({
      tabs: tabsNow.map((tab) => ({ id: tab.id, url: tab.url, title: tab.title, history: [tab.url], index: 0, createdAt: new Date().toISOString() })),
      activeId: nextActive,
      bookmarks,
    });
  };

  const openAddress = () => {
    const session = sessionRef.current;
    if (!session || !address.trim()) return;
    const target = address.includes('://') ? address : `https://${address}`;
    try {
      const tab = session.open(target);
      setAddress(tab.url);
      setActiveId(tab.id);
      setFrameError(false);
      setFrameNonce((n) => n + 1);
      syncTabs(session);
      saveState(session, tab.id);
    } catch {
      setFrameError(true);
    }
  };

  const navigate = (url: string) => {
    setAddress(url);
    setFrameError(false);
    setFrameNonce((n) => n + 1);
  };

  const newTab = () => {
    const session = sessionRef.current;
    if (!session) return;
    const tab = session.open('https://aetherius-os.vercel.app', 'Aetherius OS');
    setAddress(tab.url);
    setActiveId(tab.id);
    setFrameError(false);
    setFrameNonce((n) => n + 1);
    syncTabs(session);
    saveState(session, tab.id);
  };

  const closeTab = (id: string) => {
    const session = sessionRef.current;
    if (!session) return;
    session.close(id);
    const remaining = readTabs(session);
    const nextActive = activeId === id ? (remaining[0]?.id ?? null) : activeId;
    setActiveId(nextActive);
    if (nextActive) setAddress(remaining.find((tab) => tab.id === nextActive)?.url ?? '');
    syncTabs(session);
    saveState(session, nextActive);
  };

  const addBookmark = () => {
    if (!activeTab) return;
    const bookmark: BookmarkRecord = {
      id: `bm-${Date.now()}`,
      url: activeTab.url,
      title: activeTab.title || activeTab.url,
      createdAt: new Date().toISOString(),
    };
    setBookmarks((prev) => {
      const next = [...prev, bookmark];
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify({ tabs, activeId, bookmarks: next }));
      } catch {
        // Best effort.
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-2 pt-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveId(tab.id);
              setAddress(tab.url);
              setFrameError(false);
              setFrameNonce((n) => n + 1);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-xs max-w-44 truncate ${
              tab.id === activeId ? 'bg-white dark:bg-gray-900 font-medium' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="truncate">{tab.title || tab.url}</span>
            <span
              role="button"
              aria-label="Close tab"
              className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded px-1"
              onClick={(event) => {
                event.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <XMarkIcon className="w-3 h-3" />
            </span>
          </button>
        ))}
        <button onClick={newTab} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="New tab">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFrameNonce((n) => n + 1)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Back"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFrameNonce((n) => n + 1)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Forward"
        >
          <ArrowRightIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setFrameNonce((n) => n + 1)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Reload"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && openAddress()}
          placeholder="Search or enter a web address"
          className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-sm"
        />
        <button onClick={addBookmark} disabled={!activeTab} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40" aria-label="Bookmark this page">
          <BookmarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Bookmarks bar */}
      {bookmarks.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {bookmarks.map((bookmark) => (
            <button
              key={bookmark.id}
              onClick={() => navigate(bookmark.url)}
              className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 truncate max-w-40"
              title={bookmark.url}
            >
              {bookmark.title}
            </button>
          ))}
        </div>
      )}

      {/* Page */}
      <div className="flex-1 relative">
        {activeTab ? (
          <iframe
            key={`${activeTab.id}-${frameNonce}`}
            src={activeTab.url}
            className="absolute inset-0 w-full h-full border-0"
            title={activeTab.title || activeTab.url}
            sandbox="allow-scripts allow-same-origin allow-forms"
            onError={() => setFrameError(true)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No tabs open. Open a new tab to browse the web.
          </div>
        )}
        {frameError && activeTab && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center p-6 max-w-sm">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">The page could not be displayed</h3>
              <p className="text-sm text-gray-500 mt-2">
                {activeTab.url} refused to be embedded (X-Frame-Options) or is unreachable from here.
                This is the site&apos;s own protection, not a failure of the browser.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
