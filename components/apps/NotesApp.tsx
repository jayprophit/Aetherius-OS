import React, { useState, useEffect } from 'react';
import { NotesApp as NotesCore, type Note } from '../../apps/aetherius-app-suite/src/notes.ts';
import {
  BrowserSyncStore,
  HttpSyncTransport,
  SyncEngine,
  getOrCreateDeviceId,
} from '../../apps/aetherius-sync/src/index';
import { effectiveSyncEndpoint, getSyncToken } from '../settings/syncSession';

const NOTES_KEY = "aetherius.notes.v1";

function loadPersisted(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(note: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(note));
  } catch {
    // Private browsing or quota: notes still work for the session.
  }
}

/**
 * Notes with local persistence and optional cloud sync.
 *
 * Notes always persist locally first (local-first). When a sync token has
 * been provided in Settings → Cloud & Sync this session, every mutation is
 * also pushed through the sync engine, and opening the app pulls remote
 * changes. Without a token nothing leaves the device.
 */
export const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [syncState, setSyncState] = useState<'off' | 'syncing' | 'synced' | 'error'>('off');
  const coreRef = React.useRef<NotesCore | null>(null);
  const engineRef = React.useRef<SyncEngine | null>(null);

  useEffect(() => {
    coreRef.current = new NotesCore();
    // Restore locally persisted notes (stable ids) so reload keeps them.
    for (const note of loadPersisted()) {
      try {
        coreRef.current.importNote(note);
      } catch {
        // Skip a malformed persisted record rather than failing the app.
      }
    }
    // If sync is configured this session, pull and merge.
    const token = getSyncToken();
    if (token) {
      try {
        const store = new BrowserSyncStore();
        const transport = new HttpSyncTransport({ baseUrl: effectiveSyncEndpoint() || "", token });
        let deviceId = "device-ephemeral";
        try {
          deviceId = getOrCreateDeviceId(window.localStorage);
        } catch {
          deviceId = "device-ephemeral";
        }
        const engine = new SyncEngine({ store, transport, deviceId });
        engineRef.current = engine;
        setSyncState('syncing');
        engine
          .sync()
          .then(() => {
            for (const record of engine.list("aetherius-notes", "notes")) {
              if (record.deleted) continue;
              const remote = record.value as Note;
              if (remote && typeof remote.id === "string") {
                try {
                  coreRef.current?.importNote(remote);
                } catch {
                  // Skip a malformed remote record.
                }
              }
            }
            setSyncState('synced');
            refresh();
          })
          .catch(() => setSyncState('error'));
      } catch {
        setSyncState('error');
      }
    }
    refresh();
  }, []);

  const pushNote = (note: Note | undefined, deleted = false) => {
    persist(coreRef.current?.list({ includeArchived: true }) ?? []);
    const engine = engineRef.current;
    if (!engine || !note) return;
    try {
      if (deleted) {
        engine.remove("aetherius-notes", "notes", note.id);
      } else {
        engine.put("aetherius-notes", "notes", note.id, note);
      }
      setSyncState('syncing');
      engine
        .sync()
        .then((report) => setSyncState(report.ok ? 'synced' : 'error'))
        .catch(() => setSyncState('error'));
    } catch {
      setSyncState('error');
    }
  };

  const refresh = () => {
    if (!coreRef.current) return;
    const all = coreRef.current.list();
    const filtered = search ? all.filter((n: any) => n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())) : all;
    setNotes(filtered);
  };

  const handleCreate = () => {
    if (!coreRef.current) return;
    const note = coreRef.current.create({ title: title || 'Untitled', body: body || '' });
    setTitle('');
    setBody('');
    setSelectedId(note.id);
    pushNote(note);
    refresh();
  };

  const handleSelect = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setSelectedId(id);
    setTitle(note.title);
    setBody(note.body);
  };

  const handleUpdate = () => {
    if (!coreRef.current || !selectedId) return;
    const note = coreRef.current.update(selectedId, { title, body });
    pushNote(note);
    refresh();
  };

  const handleDelete = () => {
    if (!coreRef.current || !selectedId) return;
    const gone = coreRef.current.get(selectedId);
    coreRef.current.delete(selectedId);
    setSelectedId(null);
    setTitle('');
    setBody('');
    pushNote(gone, true);
    refresh();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); refresh(); }}
          placeholder="Search notes..."
          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex-1"
        />
        <span className="text-xs text-gray-500" title={syncState === 'off'
          ? 'Local only — add the sync token in Settings → Cloud & Sync to sync notes'
          : `Sync: ${syncState}`}>
          {syncState === 'off' ? 'Local' : syncState === 'syncing' ? 'Syncing…' : syncState === 'synced' ? 'Synced' : 'Sync error'}
        </span>
        <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">New</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelect(note.id)}
              className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedId === note.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <div className="text-sm font-medium truncate">{note.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500 truncate">{note.body.slice(0, 60)}</div>
            </button>
          ))}
          {notes.length === 0 && <div className="p-4 text-sm text-gray-400">No notes yet.</div>}
        </div>
        <div className="flex-1 flex flex-col p-4">
          {selectedId ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-bold mb-2 bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 outline-none"
                placeholder="Note title"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 resize-none outline-none bg-transparent text-sm"
                placeholder="Write your note..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleUpdate} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
                <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Select a note or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  );
};
