import React from 'react';
import { Den, TEMPOS, DEFAULT_DENS } from '../music';

interface Props {
  name: string;
  setName: (v: string) => void;
  bpm: number;
  setBpm: (v: number) => void;
  defDen: Den;
  setDefDen: (d: Den) => void;
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
  loop: boolean;
  setLoop: (v: boolean) => void;
  playing: boolean;
  togglePlay: () => void;
  goToStart: () => void;
  goToEnd: () => void;
}

const TopControls: React.FC<Props> = ({
  name, setName, bpm, setBpm, defDen, setDefDen,
  notesLength, totalTicks, lengthSec, selectedSize,
  copySel, cutSel, pasteClip, delSel, clipboardLength,
  dark, setDark, loop, setLoop, playing, togglePlay,
  goToStart, goToEnd
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
    <div className="flex-1 flex gap-1 flex-wrap items-center">
      <div>Events: {notesLength}</div>
      <div>Total ticks: {totalTicks}</div>
      <div>Length: {lengthSec.toFixed(2)}s</div>
      <div>Selected: {selectedSize}</div>
      <div className="flex gap-1 ml-2">
        <button className="border px-1" onClick={copySel}>Copy</button>
        <button className="border px-1" onClick={cutSel}>Cut</button>
        <button className="border px-1" disabled={!clipboardLength} onClick={pasteClip}>Paste</button>
        <button className="border px-1" onClick={delSel}>Delete</button>
      </div>
    </div>
    <div className="flex gap-2 items-center ml-auto">
      <button className="border px-2" onClick={()=>setDark(!dark)}>{dark?'Light':'Dark'}</button>
      <button
        className="border px-2"
        onClick={goToStart}
        aria-label="Go to start"
        title="Go to start"
      >
        ⏮
      </button>
      <button
        className="border px-2"
        onClick={goToEnd}
        aria-label="Go to end"
        title="Go to end"
      >
        ⏭
      </button>
      <button
        className={`border px-2 ${loop?'bg-blue-500 text-white':''}`}
        onClick={()=>setLoop(!loop)}
        aria-label="Toggle loop"
        title="Toggle loop"
      >
        🔁
      </button>
      <button
        className="border px-2"
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing?'⏸':'▶️'}
      </button>
      <span className="text-[10px]">Shift+Enter to Play/Stop</span>
    </div>
  </div>
);

export default TopControls;
