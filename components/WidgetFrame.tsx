import React, { useRef, useState } from "react";
import { ArrowsPointingOutIcon } from "./Icons";

/**
 * Widget frame with drag-to-move and S/M/L resize.
 *
 * Widgets are absolutely positioned by the Desktop; this frame adds:
 *  - drag to reposition (pointer events: mouse, touch and pen all work)
 *  - S/M/L size cycling via the size button (compact by default: the
 *    old M/L sizes were too big for a desktop corner)
 *  - keyboard moving: focus the frame, arrow keys nudge, +/- resize
 * Layout changes are reported up and persisted by the Desktop.
 */

export type WidgetSize = "S" | "M" | "L";

export interface WidgetPlacement {
  x: number;
  y: number;
  size: WidgetSize;
  visible: boolean;
}

const SIZES: Record<WidgetSize, { w: number; h: number }> = {
  S: { w: 180, h: 120 },
  M: { w: 240, h: 160 },
  L: { w: 320, h: 215 },
};

const SIZE_ORDER: WidgetSize[] = ["S", "M", "L"];

export const WidgetFrame: React.FC<{
  placement: WidgetPlacement;
  locked?: boolean;
  label: string;
  onMove: (placement: WidgetPlacement) => void;
  children: React.ReactNode;
}> = ({ placement, locked = false, label, onMove, children }) => {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const dims = SIZES[placement.size];

  const onPointerDown = (event: React.PointerEvent) => {
    if (locked) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a")) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, origX: placement.x, origY: placement.y };
    setDragging(true);
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // pointer capture is best-effort
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    onMove({
      ...placement,
      x: Math.max(0, drag.origX + event.clientX - drag.startX),
      y: Math.max(0, drag.origY + event.clientY - drag.startY),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const cycleSize = () => {
    if (locked) return;
    const index = SIZE_ORDER.indexOf(placement.size);
    const next = SIZE_ORDER[(index + 1) % SIZE_ORDER.length];
    onMove({ ...placement, size: next });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (locked) return;
    const step = event.shiftKey ? 24 : 8;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onMove({ ...placement, x: Math.max(0, placement.x - step) });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onMove({ ...placement, x: placement.x + step });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      onMove({ ...placement, y: Math.max(0, placement.y - step) });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      onMove({ ...placement, y: placement.y + step });
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      cycleSize();
    }
  };

  return (
    <div
      className={`absolute group ${locked ? "" : dragging ? "cursor-grabbing z-30" : "cursor-grab"}`}
      style={{ left: placement.x, top: placement.y, width: dims.w, height: dims.h }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      tabIndex={locked ? -1 : 0}
      role="group"
      aria-label={`${label} widget. ${locked ? "Layout is locked." : "Drag to move, arrow keys nudge, plus resizes."}`}
    >
      <div className="h-full w-full">{children}</div>
      {!locked && (
        <>
          <span className="absolute top-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded select-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            ⠿ move
          </span>
          <button
            onClick={cycleSize}
            onKeyDown={(event) => event.stopPropagation()}
            className="absolute top-1 right-1 flex items-center gap-1 text-[10px] leading-none bg-black/60 text-white px-1.5 py-1 rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
            title={`Resize widget (now ${placement.size})`}
            aria-label={`Resize ${label} widget (currently ${placement.size})`}
          >
            <ArrowsPointingOutIcon className="w-3 h-3" /> {placement.size}
          </button>
        </>
      )}
    </div>
  );
};
