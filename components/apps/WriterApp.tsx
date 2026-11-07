import React, { useState, useEffect } from 'react';
import { WriterApp as WriterCore } from '../../apps/aetherius-app-suite/src/writer.ts';

export const WriterApp: React.FC = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const coreRef = React.useRef<WriterCore | null>(null);

  useEffect(() => {
    coreRef.current = new WriterCore();
    refresh();
  }, []);

  const refresh = () => {
    if (!coreRef.current) return;
    const all = coreRef.current.list();
    setDocs(all);
  };

  const handleCreate = () => {
    if (!coreRef.current) return;
    const doc = coreRef.current.create({ title: title || 'Untitled' });
    setSelectedId(doc.id);
    setTitle(doc.title);
    setContent(doc.blocks.map((b: any) => b.text).join('\n'));
    refresh();
  };

  const handleSelect = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    setSelectedId(id);
    setTitle(doc.title);
    setContent(doc.blocks.map((b: any) => b.text).join('\n'));
  };

  const handleUpdate = () => {
    if (!coreRef.current || !selectedId) return;
    const blocks = content.split('\n').map((text, i) => ({ id: `block-${i}`, type: 'paragraph' as const, text }));
    coreRef.current.update(selectedId, { title, blocks });
    refresh();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title..."
          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex-1"
        />
        <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">New</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelect(doc.id)}
              className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedId === doc.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <div className="text-sm font-medium truncate">{doc.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500">{new Date(doc.updatedAt).toLocaleString()}</div>
            </button>
          ))}
          {docs.length === 0 && <div className="p-4 text-sm text-gray-400">No documents yet.</div>}
        </div>
        <div className="flex-1 flex flex-col p-4">
          {selectedId ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 resize-none outline-none bg-transparent text-sm font-mono"
                placeholder="Write your document..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleUpdate} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Select a document or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  );
};
