import React from 'react';
import { Den, TEMPOS, DEFAULT_DENS, NoteEvent } from '../music';
import { IconSun, IconMoon } from '@tabler/icons-react';

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
  copySel: () => void;
  cutSel: () => void;
  pasteClip: () => void;
  delSel: () => void;
  clipboardLength: number;
  dark: boolean;
  setDark: (v: boolean) => void;
  lastSelected: NoteEvent | null;
}

const TopControls: React.FC<Props> = ({
  name, setName, bpm, setBpm, defDen, setDefDen, defOct, setDefOct,
  notesLength, totalTicks, lengthSec, selectedSize,
  copySel, cutSel, pasteClip, delSel, clipboardLength,
  dark, setDark, lastSelected
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
      <div className="flex gap-1 ml-2">
        <button className="border px-1" onClick={copySel}>Copy</button>
        <button className="border px-1" onClick={cutSel}>Cut</button>
        <button className="border px-1" disabled={!clipboardLength} onClick={pasteClip}>Paste</button>
        <button className="border px-1" onClick={delSel}>Delete</button>
      </div>
    </div>
    <button
      className="border px-2 ml-auto"
      onClick={() => setDark(!dark)}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  </div>
);

export default TopControls;
