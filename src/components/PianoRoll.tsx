import React, { useEffect, useRef, useState } from 'react';
import { KeyDef, NoteEvent, TICKS_PER_QUARTER, pxPerTick } from '../music';
import Keyboard from './Keyboard';

interface NoteWithTiming {
  ev: NoteEvent;
  startTick: number;
  durTicks: number;
}

interface Props {
  keys: KeyDef[];
  noteWithTiming: NoteWithTiming[];
  totalTicks: number;
  selected: Set<string>;
  toggleSelect: (id: string) => void;
  selectRange: (ids: string[]) => void;
  cursorTick: number;
  setCursorTick: (tick: number) => void;
  playing: boolean;
  playTick: number;
  onKeyPress: (k: KeyDef) => void;
  insertRest: () => void;
}

const PianoRoll: React.FC<Props> = ({
  keys,
  noteWithTiming,
  totalTicks,
  selected,
  toggleSelect,
  selectRange,
  cursorTick,
  setCursorTick,
  playing,
  playTick,
  onKeyPress,
  insertRest,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(20);
  const [containerHeight, setContainerHeight] = useState(240);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setColWidth(w / keys.length);
      setContainerHeight(entry.contentRect.height);
    });
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [keys.length]);

  const gridWidth = keys.length * colWidth;
  const gridHeight = Math.max(containerHeight, totalTicks * pxPerTick + 40);

  useEffect(() => {
    if (!gridRef.current) return;
    const target = (playing ? playTick : cursorTick) * pxPerTick;
    gridRef.current.scrollTop = Math.max(
      0,
      target - gridRef.current.clientHeight / 2,
    );
  }, [playTick, cursorTick, playing, gridHeight]);

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  function onGridMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const rect = gridRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current!.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current!.scrollTop;
    setDragStart({ x, y });
    setDragRect({ x, y, width: 0, height: 0 });
  }

  function onGridMouseMove(e: React.MouseEvent) {
    if (!dragStart) return;
    const rect = gridRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current!.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current!.scrollTop;
    const nx = Math.min(x, dragStart.x);
    const ny = Math.min(y, dragStart.y);
    const w = Math.abs(x - dragStart.x);
    const h = Math.abs(y - dragStart.y);
    setDragRect({ x: nx, y: ny, width: w, height: h });
  }

  function onGridMouseUp() {
    if (dragStart && dragRect && (dragRect.width > 2 || dragRect.height > 2)) {
      const ids: string[] = [];
      noteWithTiming.forEach((n) => {
        const left = n.ev.isRest ? 0 : n.ev.keyIndex! * colWidth + 1;
        const width = n.ev.isRest ? gridWidth : colWidth - 2;
        const top = n.startTick * pxPerTick;
        const height = n.durTicks * pxPerTick;
        if (
          left < dragRect.x + dragRect.width &&
          left + width > dragRect.x &&
          top < dragRect.y + dragRect.height &&
          top + height > dragRect.y
        ) {
          ids.push(n.ev.id);
        }
      });
      selectRange(ids);
    } else if (dragStart) {
      const tick = Math.max(0, Math.round(dragStart.y / pxPerTick));
      setCursorTick(tick);
    }
    setDragStart(null);
    setDragRect(null);
  }

  return (
    <div className="flex flex-col w-full items-start">
      <div
        ref={gridRef}
        className="w-full overflow-y-auto h-72 md:h-[520px] relative"
        onMouseDown={onGridMouseDown}
        onMouseMove={onGridMouseMove}
        onMouseUp={onGridMouseUp}
      >
        <div
          className="relative select-none"
          style={{ width: gridWidth, height: gridHeight }}
        >
          {Array.from({ length: keys.length }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-gray-400/20"
              style={{ left: i * colWidth }}
            />
          ))}
          {Array.from({
            length: Math.floor(totalTicks / TICKS_PER_QUARTER) + 1,
          }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-b border-gray-400/20"
              style={{ top: i * TICKS_PER_QUARTER * pxPerTick }}
            />
          ))}
          {noteWithTiming.map((n) =>
            n.ev.isRest ? (
              <div
                key={n.ev.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(n.ev.id);
                }}
                className={`absolute left-0 w-full ${
                  selected.has(n.ev.id)
                    ? 'bg-yellow-400 text-gray-900 font-semibold'
                    : 'bg-gray-400/30'
                }`}
                style={{
                  height: n.durTicks * pxPerTick,
                  top: n.startTick * pxPerTick,
                }}
              />
            ) : (
              <div
                key={n.ev.id}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(n.ev.id);
                }}
                className={`absolute rounded ${
                  selected.has(n.ev.id) ? 'bg-blue-400' : 'bg-blue-600'
                }`}
                style={{
                  height: n.durTicks * pxPerTick,
                  width: colWidth - 2,
                  left: n.ev.keyIndex! * colWidth + 1,
                  top: n.startTick * pxPerTick,
                }}
              />
            ),
          )}
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-500 pointer-events-none"
            style={{ top: (playing ? playTick : cursorTick) * pxPerTick }}
          />
          {dragRect && (
            <div
              className="absolute border-2 border-blue-400 bg-blue-400/20 pointer-events-none"
              style={{
                left: dragRect.x,
                top: dragRect.y,
                width: dragRect.width,
                height: dragRect.height,
              }}
            />
          )}
        </div>
      </div>
      <div className="flex flex-col" style={{ width: gridWidth }}>
        <Keyboard keys={keys} colWidth={colWidth} onKeyPress={onKeyPress} />
        <button
          className="border mt-2 py-2 w-full"
          onClick={(e) => {
            e.stopPropagation();
            insertRest();
          }}
        >
          + Pause
        </button>
      </div>
    </div>
  );
};

export default PianoRoll;
