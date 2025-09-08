import React from 'react';
import { Den, NEXT_DENS } from '../music';
import {
  IconPlayerSkipBack,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconRepeat,
} from '@tabler/icons-react';

interface Props {
  nextLen: Den;
  setNextLen: (d: Den) => void;
  nextDot: boolean;
  setNextDot: (v: boolean) => void;
  insertRest: () => void;
  clearAll: () => void;
  goToStart: () => void;
  togglePlay: () => void;
  goToEnd: () => void;
  loop: boolean;
  setLoop: (v: boolean) => void;
  playing: boolean;
  keyboardMode: boolean;
  setKeyboardMode: (v: boolean) => void;
}

const InsertControls: React.FC<Props> = ({
  nextLen, setNextLen, nextDot, setNextDot,
  insertRest, clearAll, goToStart, togglePlay, goToEnd,
  loop, setLoop, playing, keyboardMode, setKeyboardMode
}) => (
  <div className="flex flex-wrap gap-2 p-2 items-center text-xs border-b">
    <label>
      Next
      <select className="border" value={nextLen} onChange={e=>setNextLen(parseInt(e.target.value) as Den)}>
        {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
    <label className="flex items-center gap-1">
      <input type="checkbox" checked={nextDot} onChange={e=>setNextDot(e.target.checked)} /> dotted
    </label>
    <button className="border px-1" onClick={insertRest}>+ Pause</button>
    <button className="border px-1" onClick={clearAll}>Clear</button>
    <div className="flex items-center gap-2 ml-2">
      <button
        className="p-1"
        onClick={goToStart}
        aria-label="Go to start"
        title="Go to start"
      >
        <IconPlayerSkipBack size={24} />
      </button>
      <button
        className="p-1"
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}
      </button>
      <button
        className="p-1"
        onClick={goToEnd}
        aria-label="Go to end"
        title="Go to end"
      >
        <IconPlayerSkipForward size={24} />
      </button>
      <button
        className={`p-1 rounded ${loop ? 'bg-blue-500 text-white' : ''}`}
        onClick={() => setLoop(!loop)}
        aria-label="Toggle loop"
        title="Toggle loop"
        aria-pressed={loop}
      >
        <IconRepeat size={24} />
      </button>
    </div>
    <label className="mt-2 md:ml-auto flex items-center gap-1 w-full md:w-auto justify-end">
      <input type="checkbox" checked={keyboardMode} onChange={e=>setKeyboardMode(!!e.target.checked)} /> Keyboard mode
      <span className="italic">QWERTYUIOP[] = C5..B5, Space=pause</span>
    </label>
  </div>
);

export default InsertControls;
