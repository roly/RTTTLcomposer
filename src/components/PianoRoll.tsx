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
  cursorTick: number;
  setCursorTick: (tick: number) => void;
  playing: boolean;
  playTick: number;
  onKeyPress: (k: KeyDef) => void;
}

const PianoRoll: React.FC<Props> = ({
  keys,
  noteWithTiming,
  totalTicks,
  selected,
  toggleSelect,
  cursorTick,
  setCursorTick,
  playing,
  playTick,
  onKeyPress,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(20);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setColWidth(Math.floor(w / 48));
    });
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, []);

  const gridWidth = keys.length * colWidth;
  const gridHeight = Math.max(240, totalTicks * pxPerTick + 40);

  useEffect(() => {
    const t = playing ? playTick : cursorTick;
    const cont = gridRef.current;
    const contentH = gridHeight;
    if (cont) {
      const target = contentH - t * pxPerTick - cont.clientHeight / 2;
      cont.scrollTop = Math.max(0, Math.min(target, contentH));
    }
  }, [playTick, cursorTick, playing, gridHeight]);

  function onGridClick(e: React.MouseEvent) {
    const rect = gridContentRef.current!.getBoundingClientRect();
    const y = rect.bottom - e.clientY;
    const tick = Math.max(0, Math.round(y / pxPerTick));
    setCursorTick(tick);
  }

  return (
    <div className="flex flex-col">
      <div
        ref={gridRef}
        className="overflow-y-scroll h-72 md:h-[520px] relative"
        onClick={onGridClick}
      >
        <div
          ref={gridContentRef}
          className="relative mx-auto"
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
                style={{ bottom: i * TICKS_PER_QUARTER * pxPerTick }}
              />
            ))}
            {noteWithTiming.map((n) =>
              n.ev.isRest ? (
                <div
                  key={n.ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(n.ev.id);
                  }}
                  className={`absolute left-0 w-full ${
                    selected.has(n.ev.id)
                      ? 'bg-gray-500/50'
                      : 'bg-gray-400/30'
                  } text-center italic`}
                  style={{
                    height: n.durTicks * pxPerTick,
                    bottom: n.startTick * pxPerTick,
                  }}
                >
                  pause
                </div>
              ) : (
                <div
                  key={n.ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(n.ev.id);
                  }}
                  className={`absolute rounded ${
                    selected.has(n.ev.id)
                      ? 'bg-blue-400'
                      : 'bg-blue-600'
                  }`}
                  style={{
                    height: n.durTicks * pxPerTick,
                    width: colWidth - 2,
                    left: n.ev.keyIndex! * colWidth + 1,
                    bottom: n.startTick * pxPerTick,
                  }}
                />
              )
            )}
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500"
              style={{ bottom: (playing ? playTick : cursorTick) * pxPerTick }}
            />
          </div>
        </div>
      <div className="mx-auto" style={{ width: gridWidth }}>
        <Keyboard keys={keys} colWidth={colWidth} onKeyPress={onKeyPress} />
      </div>
    </div>
  );
};

export default PianoRoll;

