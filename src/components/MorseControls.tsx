import React, { useState, useRef } from 'react';
import { Den, NEXT_DENS, SCALES, NoteEvent } from '../music';
import { morseToEvents } from '../morse';
import { parseRTTTL } from '../rtttl';

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
  const [scaleBySymbol, setScaleBySymbol] = useState(false);
  const scaleIndex = useRef(0);

  function addMorse() {
    let scaleNotes: string[];
    if (scale === 'Custom') {
      if (customScale.includes(':')) {
        try {
          const song = parseRTTTL(customScale, dotLen, morseOct, 120);
          scaleNotes = song.notes.filter(n => !n.isRest && n.note).map(n => `${n.note}${n.octave}`);
        } catch {
          scaleNotes = customScale.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else {
        scaleNotes = customScale.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      scaleNotes = SCALES[scale];
    }
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
      startIndex: scaleIndex.current,
      scaleBySymbol
    });
    onAdd(events);
    scaleIndex.current = nextIndex;
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold">Morse Mode</div>
      <textarea className="border p-1 mt-1 flex-1" value={morseText} onChange={e=>setMorseText(e.target.value)} />
      <div className="grid grid-cols-2 gap-1 text-xs mt-1">
        <label className="flex items-center gap-1">Dot
          <select className="border" value={dotLen} onChange={e=>setDotLen(parseInt(e.target.value) as Den)}>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="checkbox" checked={dotDot} onChange={e=>setDotDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Dash
          <select className="border" value={dashLen} onChange={e=>setDashLen(parseInt(e.target.value) as Den)}>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="checkbox" checked={dashDot} onChange={e=>setDashDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Symbol gap
          <select className="border" value={symGap} onChange={e=>setSymGap(e.target.value as any)}>
            <option>None</option>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="checkbox" checked={symDot} onChange={e=>setSymDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Letter gap
          <select className="border" value={letGap} onChange={e=>setLetGap(e.target.value as any)}>
            <option>None</option>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="checkbox" checked={letDot} onChange={e=>setLetDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Word gap
          <select className="border" value={wordGap} onChange={e=>setWordGap(e.target.value as any)}>
            <option>None</option>
            {NEXT_DENS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <input type="checkbox" checked={wordDot} onChange={e=>setWordDot(e.target.checked)} /> dotted
        </label>
        <label className="flex items-center gap-1">Octave
          <input className="border w-12" type="number" min={4} max={7} value={morseOct} onChange={e=>setMorseOct(parseInt(e.target.value))} />
        </label>
        <label className="col-span-2 flex items-center gap-1">Scale
          <select className="border" value={scale} onChange={e=>setScale(e.target.value)}>
            {Object.keys(SCALES).map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Custom">Custom</option>
          </select>
        </label>
        {scale === 'Custom' && (
          <label className="col-span-2 flex flex-col gap-1">Notes
            <textarea className="border p-1 w-full h-24" value={customScale} onChange={e=>setCustomScale(e.target.value)} placeholder="C4,C#4,D5 or RTTTL" />
          </label>
        )}
        <label className="col-span-2 flex items-center gap-1">
          <input type="checkbox" checked={scaleBySymbol} onChange={e=>setScaleBySymbol(e.target.checked)} /> Scale per symbol
        </label>
      </div>
      <button className="border px-2 mt-2" onClick={addMorse}>Add Morse</button>
    </div>
  );
};

export default MorseControls;
