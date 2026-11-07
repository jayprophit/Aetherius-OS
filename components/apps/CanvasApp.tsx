import React, { useState, useEffect, useRef } from 'react';
import { CanvasApp as CanvasCore } from '../../apps/aetherius-app-suite/src/canvas.ts';

export const CanvasApp: React.FC = () => {
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tool, setTool] = useState<'pen' | 'rect' | 'ellipse'>('pen');
  const [color, setColor] = useState('#000000');
  const coreRef = React.useRef<CanvasCore | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    coreRef.current = new CanvasCore();
    refresh();
  }, []);

  const refresh = () => {
    if (!coreRef.current) return;
    const all = coreRef.current.list();
    setBoards(all);
  };

  const handleCreate = () => {
    if (!coreRef.current) return;
    const board = coreRef.current.create({ title: title || 'Untitled' });
    setSelectedId(board.id);
    setTitle(board.title);
    refresh();
    drawBoard(board);
  };

  const handleSelect = (id: string) => {
    const board = boards.find((b) => b.id === id);
    if (!board) return;
    setSelectedId(id);
    setTitle(board.title);
    drawBoard(board);
  };

  const drawBoard = (board: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const el of board.elements || []) {
      ctx.strokeStyle = el.color || '#000000';
      ctx.lineWidth = el.strokeWidth || 2;
      ctx.beginPath();
      if (el.kind === 'rect') {
        const p = el.points[0];
        ctx.rect(p.x, p.y, 100, 100);
      } else if (el.kind === 'ellipse') {
        const p = el.points[0];
        ctx.ellipse(p.x + 50, p.y + 50, 50, 50, 0, 0, Math.PI * 2);
      } else {
        const pts = el.points;
        if (pts.length > 0) {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
        }
      }
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!coreRef.current || !selectedId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const board = boards.find((b) => b.id === selectedId);
    if (!board) return;
    const element = {
      id: `el-${Date.now()}`,
      kind: tool,
      points: [{ x, y }],
      color,
      strokeWidth: 2,
    };
    coreRef.current.addElement(selectedId, element);
    refresh();
    drawBoard({ ...board, elements: [...board.elements, element] });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Canvas title..."
          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex-1"
        />
        <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">New</button>
        <select value={tool} onChange={(e) => setTool(e.target.value as any)} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
          <option value="pen">Pen</option>
          <option value="rect">Rectangle</option>
          <option value="ellipse">Ellipse</option>
        </select>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => handleSelect(board.id)}
              className={`w-full text-left p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedId === board.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <div className="text-sm font-medium truncate">{board.title || 'Untitled'}</div>
              <div className="text-xs text-gray-500">{board.elements?.length || 0} elements</div>
            </button>
          ))}
          {boards.length === 0 && <div className="p-4 text-sm text-gray-400">No boards yet.</div>}
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onClick={handleCanvasClick}
            className="bg-white border border-gray-300 shadow-sm cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
};
