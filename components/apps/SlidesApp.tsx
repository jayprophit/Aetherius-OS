import React, { useState, useEffect } from 'react';
import { SlidesApp as SlidesCore } from '../../apps/aetherius-app-suite/src/slides.ts';

export const SlidesApp: React.FC = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const coreRef = React.useRef<SlidesCore | null>(null);

  useEffect(() => {
    coreRef.current = new SlidesCore();
    refresh();
  }, []);

  const refresh = () => {
    if (!coreRef.current) return;
    const all = coreRef.current.list();
    setDecks(all);
  };

  const handleCreate = () => {
    if (!coreRef.current) return;
    const deck = coreRef.current.create({ title: title || 'Untitled Deck' });
    setSelectedId(deck.id);
    setTitle(deck.title);
    refresh();
  };

  const handleSelect = (id: string) => {
    const deck = decks.find((d) => d.id === id);
    if (!deck) return;
    setSelectedId(id);
    setTitle(deck.title);
  };

  const handleAddSlide = () => {
    if (!coreRef.current || !selectedId) return;
    const deck = coreRef.current.session(selectedId); deck.addSlide('New Slide'); refresh();
    refresh();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Deck title..."
          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex-1"
        />
        <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">New Deck</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => handleSelect(deck.id)}
              className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedId === deck.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <div className="text-sm font-medium truncate">{deck.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500">{deck.slides.length} slides</div>
            </button>
          ))}
          {decks.length === 0 && <div className="p-4 text-sm text-gray-400">No decks yet.</div>}
        </div>
        <div className="flex-1 flex flex-col p-4">
          {selectedId ? (
            <>
              <div className="flex gap-2 mb-4">
                <button onClick={handleAddSlide} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Add Slide</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {decks.find((d) => d.id === selectedId)?.slides.map((slide: any, i: number) => (
                  <div key={slide.id || i} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium mb-2">Slide {i + 1}: {slide.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{slide.elements?.length || 0} elements</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Select a deck or create a new one.</div>
          )}
        </div>
      </div>
    </div>
  );
};
