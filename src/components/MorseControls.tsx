import React, { useState, useRef } from 'react';
import { Den, NEXT_DENS, SCALES, NoteEvent } from '../music';
import { morseToEvents } from '../morse';

interface Props {
  onAdd: (events: NoteEvent[]) => void;
}

const MorseControls: React.FC<Props> = ({ onAdd }) => {
  const [morseText, setMorseText] = useState('');
  const [dotLen, setDotLen] = useState<Den>(32);
  const [dotDot, setDotDot] = useState(false);
  const [dashLen, setDashLen] = useState<Den>(16);
  const [dashDot, setDashDot] = useState(true);
  const [symGap, setSymGap] = useState<Den | 'None'>(32);
  const [symDot, setSymDot] = useState(false);
  const [letGap, setLetGap] = useState<Den | 'None'>(16);
  const [letDot, setLetDot] = useState(true);
  const [wordGap, setWordGap] = useState<Den | 'None'>(8);
  const [wordDot, setWordDot] = useState(true);
  const [scale, setScale] = useState('Custom');
  const [customScale, setCustomScale] = useState('C');
  const [morseOct, setMorseOct] = useState(4);
  const scaleIndex = useRef(0);

  function addMorse() {
    const scaleNotes = scale === 'Custom'
      ? customScale.split(',').map(s => s.trim()).filter(Boolean)
      : SCALES[scale];
    const { events, nextIndex } = morseToEvents(morseText, {
      scaleNotes,
      morseOct,
      dotLen,
      dotDot,
      dashLen,
      dashDot,
      symGap,
      symDot,
      letGap,
      letDot,
      wordGap,
      wordDot,
      startIndex: scaleIndex.current
    });
    onAdd(events);
    scaleIndex.current = nextIndex;
  }

  return (
    <div className="flex-1 md:w-1/2 p-2 flex flex-col md:border-l mt-2 md:mt-0">
      <div className="font-bold">Morse Mode</div>
      <textarea className="border p-1 mt-1 flex-1" value={morseText} onChange={e=>setMorseText(e.target.value)} />
      <div className="grid grid-cols-2 gap-1 text-xs mt-1">
        <label className="flex items-center gap-1">Dot
          <select className="border" value={dotLen} onChange={e=>setDotLen(parseInt(e.target.value) as Den)}>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={dotDot} onChange={e=>setDotDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Dash
          <select className="border" value={dashLen} onChange={e=>setDashLen(parseInt(e.target.value) as Den)}>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={dashDot} onChange={e=>setDashDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Symbol gap
          <select className="border" value={symGap} onChange={e=>setSymGap(e.target.value as any)}>
            <option>None</option>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={symDot} onChange={e=>setSymDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Letter gap
          <select className="border" value={letGap} onChange={e=>setLetGap(e.target.value as any)}>
            <option>None</option>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={letDot} onChange={e=>setLetDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Word gap
          <select className="border" value={wordGap} onChange={e=>setWordGap(e.target.value as any)}>
            <option>None</option>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={wordDot} onChange={e=>setWordDot(e.target.checked)} /> dotted
        </label>
        <label className="col-span-2 flex items-center gap-1">Scale
          <select className="border" value={scale} onChange={e=>setScale(e.target.value)}>
            {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Custom">Custom</option>
          </select>
        </label>
        {scale === 'Custom' && (
          <label className="col-span-2 flex items-center gap-1">Notes
            <input className="border" value={customScale} onChange={e=>setCustomScale(e.target.value)} placeholder="C,C#,D" />
          </label>
        )}
        <label className="col-span-2 flex items-center gap-1">Octave
          <input className="border w-12" type="number" min={4} max={7} value={morseOct} onChange={e=>setMorseOct(parseInt(e.target.value))} />
        </label>
      </div>
      <button className="border px-2 mt-2" onClick={addMorse}>Add Morse</button>
    </div>
  );
};

export default MorseControls;
