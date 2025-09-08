import React from 'react';
import { Den, TEMPOS, DEFAULT_DENS, NoteEvent } from '../music';
import {
  IconSun,
  IconMoon,
  IconSelectAll,
  IconDeselect,
  IconCopy,
  IconCut,
  IconClipboardPlus,
  IconTrash,
  IconClearAll,
  IconArrowsLeftRight,
  IconFlipHorizontal,
  IconArrowMerge,
} from '@tabler/icons-react';

const OCTAVES = [4,5,6,7];

interface Props {
  name: string;
  setName: (v: string) => void;
  bpm: number;
  setBpm: (v: number) => void;
  defDen: Den;
  setDefDen: (d: Den) => void;
  defOct: number;
  setDefOct: (v: number) => void;
  notesLength: number;
  totalTicks: number;
  lengthSec: number;
  selectedSize: number;
  selectAll: () => void;
  deselectAll: () => void;
  copySel: () => void;
  cutSel: () => void;
  pasteClip: () => void;
  delSel: () => void;
  clearAll: () => void;
  clipboardLength: number;
  dark: boolean;
  setDark: (v: boolean) => void;
  lastSelected: NoteEvent | null;
  reverseNotes: () => void;
  flipHorizontal: () => void;
  squashRests: () => void;
}

const TopControls: React.FC<Props> = ({
  name, setName, bpm, setBpm, defDen, setDefDen, defOct, setDefOct,
  notesLength, totalTicks, lengthSec, selectedSize,
  selectAll, deselectAll,
  copySel, cutSel, pasteClip, delSel, clearAll, clipboardLength,
  dark, setDark, lastSelected, reverseNotes, flipHorizontal, squashRests
}) => (
  <div className="flex gap-4 p-2 items-center flex-wrap text-xs">
    <label className="flex items-center gap-1">Name
      <input className="border p-1" value={name} onChange={e=>setName(e.target.value)} />
    </label>
    <label className="flex items-center gap-1">Tempo
      <select className="border p-1" value={bpm} onChange={e=>setBpm(parseInt(e.target.value))}>
        {TEMPOS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </label>
    <label className="flex items-center gap-1">Default d
      <select className="border p-1" value={defDen} onChange={e=>setDefDen(parseInt(e.target.value) as Den)}>
        {DEFAULT_DENS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </label>
    <label className="flex items-center gap-1">Default o
      <select className="border p-1" value={defOct} onChange={e=>setDefOct(parseInt(e.target.value))}>
        {OCTAVES.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
    <div className="flex-1 flex gap-1 flex-wrap items-center">
      <div>Events: {notesLength}</div>
      <div>Total ticks: {totalTicks}</div>
      <div>Length: {lengthSec.toFixed(2)}s</div>
      <div>
        Selected: {selectedSize}
        {lastSelected && (
          <span>
            {' '}(
            {lastSelected.isRest ? 'rest' : `${lastSelected.note}${lastSelected.octave}`}
            {' d='}
            {lastSelected.durationDen}
            {lastSelected.dotted ? '.' : ''}
            )
          </span>
        )}
      </div>
      <div className="flex gap-1 ml-2 flex-wrap">
        <button
          className="border p-1"
          onClick={selectAll}
          aria-label="Select all"
          title="Select all"
        >
          <IconSelectAll size={16} />
        </button>
        <button
          className="border p-1"
          onClick={deselectAll}
          disabled={!selectedSize}
          aria-label="Deselect"
          title="Deselect"
        >
          <IconDeselect size={16} />
        </button>
        <button
          className="border p-1"
          onClick={copySel}
          aria-label="Copy"
          title="Copy"
        >
          <IconCopy size={16} />
        </button>
        <button
          className="border p-1"
          onClick={cutSel}
          aria-label="Cut"
          title="Cut"
        >
          <IconCut size={16} />
        </button>
        <button
          className="border p-1"
          disabled={!clipboardLength}
          onClick={pasteClip}
          aria-label="Paste"
          title="Paste"
        >
          <IconClipboardPlus size={16} />
        </button>
        <button
          className="border p-1"
          onClick={delSel}
          aria-label="Delete"
          title="Delete"
        >
          <IconTrash size={16} />
        </button>
        <button
          className="border p-1"
          onClick={clearAll}
          aria-label="Clear all"
          title="Clear all"
        >
          <IconClearAll size={16} />
        </button>
        <button
          className="border p-1"
          onClick={reverseNotes}
          aria-label="Reverse"
          title="Reverse"
        >
          <IconArrowsLeftRight size={16} />
        </button>
        <button
          className="border p-1"
          onClick={flipHorizontal}
          aria-label="Flip horizontal"
          title="Flip horizontal"
        >
          <IconFlipHorizontal size={16} />
        </button>
        <button
          className="border p-1"
          onClick={squashRests}
          aria-label="Squash rests"
          title="Squash rests"
        >
          <IconArrowMerge size={16} />
        </button>
      </div>
    </div>
    <button
      className="px-2 ml-auto"
      onClick={() => setDark(!dark)}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  </div>
);

export default TopControls;
