import React, { useState, useEffect } from 'react';
import { NotesApp as NotesCore } from '../../apps/aetherius-app-suite/src/notes.ts';

export const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const coreRef = React.useRef<NotesCore | null>(null);

  useEffect(() => {
    coreRef.current = new NotesCore();
    refresh();
  }, []);

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
    coreRef.current.update(selectedId, { title, body });
    refresh();
  };

  const handleDelete = () => {
    if (!coreRef.current || !selectedId) return;
    coreRef.current.delete(selectedId);
    setSelectedId(null);
    setTitle('');
    setBody('');
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
