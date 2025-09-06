import React from 'react';
import { Den, NEXT_DENS } from '../music';

interface Props {
  nextLen: Den;
  setNextLen: (d: Den) => void;
  nextDot: boolean;
  setNextDot: (v: boolean) => void;
  insertRest: () => void;
  clearAll: () => void;
  keyboardMode: boolean;
  setKeyboardMode: (v: boolean) => void;
}

const InsertControls: React.FC<Props> = ({
  nextLen, setNextLen, nextDot, setNextDot,
  insertRest, clearAll, keyboardMode, setKeyboardMode
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
    <label className="mt-2 md:ml-auto flex items-center gap-1 w-full md:w-auto justify-end">
      <input type="checkbox" checked={keyboardMode} onChange={e=>setKeyboardMode(!!e.target.checked)} /> Keyboard mode
      <span className="italic">QWERTYUIOP[] = C5..B5, Space=pause</span>
    </label>
  </div>
);

export default InsertControls;
