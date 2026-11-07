import React, { useState, useEffect } from 'react';
import { SheetsApp as SheetsCore } from '../../apps/aetherius-app-suite/src/sheets.ts';

export const SheetsApp: React.FC = () => {
  const [sheets, setSheets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [csv, setCsv] = useState('A1,B1\nA2,B2');
  const coreRef = React.useRef<SheetsCore | null>(null);

  useEffect(() => {
    coreRef.current = new SheetsCore();
    refresh();
  }, []);

  const refresh = () => {
    if (!coreRef.current) return;
    const all = coreRef.current.list();
    setSheets(all);
  };

  const handleCreate = () => {
    if (!coreRef.current) return;
    const sheet = coreRef.current.create({ title: title || 'Untitled' });
    setSelectedId(sheet.id);
    setTitle(sheet.title);
    setCsv(sheet.data);
    refresh();
  };

  const handleSelect = (id: string) => {
    const sheet = sheets.find((s) => s.id === id);
    if (!sheet) return;
    setSelectedId(id);
    setTitle(sheet.title);
    setCsv(sheet.data);
  };

  const handleUpdate = () => {
    if (!coreRef.current || !selectedId) return;
    coreRef.current.update(selectedId, { title, data: csv });
    refresh();
  };

  const handleExport = () => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'sheet'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sheet title..."
          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex-1"
        />
        <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">New</button>
        <button onClick={handleExport} className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">Export CSV</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => handleSelect(sheet.id)}
              className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedId === sheet.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <div className="text-sm font-medium truncate">{sheet.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500">{new Date(sheet.updatedAt).toLocaleString()}</div>
            </button>
          ))}
          {sheets.length === 0 && <div className="p-4 text-sm text-gray-400">No sheets yet.</div>}
        </div>
        <div className="flex-1 flex flex-col p-4">
          {selectedId ? (
            <>
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                className="flex-1 resize-none outline-none bg-transparent text-sm font-mono"
                placeholder="CSV data..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleUpdate} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Select a sheet or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  );
};
