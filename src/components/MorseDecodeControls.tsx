import React, { useState } from 'react';
import { parseRTTTL } from '../rtttl';
import { ticksFromDen, DEFAULT_DENS, Den, NoteEvent } from '../music';
import { eventsToMorse } from '../morse';

const MorseDecodeControls: React.FC = () => {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [decoded, setDecoded] = useState('');
  const [dotLen, setDotLen] = useState<Den>(8);
  const [dashLen, setDashLen] = useState<Den>(4);

  function guessLengths(notes: NoteEvent[]): { dot: Den; dash: Den } {
    const counts: Record<Den, number> = { 1: 0, 2: 0, 4: 0, 8: 0, 16: 0, 32: 0 };
    notes.filter(n => !n.isRest).forEach(n => {
      counts[n.durationDen]++;
    });
    const used = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1]);
    const dot = used[0] ? (parseInt(used[0][0]) as Den) : 8;
    const dashEntry = used.find(([d]) => parseInt(d) !== dot);
    const dash = dashEntry ? (parseInt(dashEntry[0]) as Den) : dot;
    return { dot, dash };
  }

  function decode(opts?: { dot?: Den; dash?: Den; guess?: boolean }) {
    try {
      const song = parseRTTTL(text, 8, 5, 120);
      let d = opts?.dot ?? dotLen;
      let da = opts?.dash ?? dashLen;
      if (opts?.guess) {
        const g = guessLengths(song.notes);
        d = g.dot;
        da = g.dash;
        setDotLen(d);
        setDashLen(da);
      }
      const res = eventsToMorse(song.notes, ticksFromDen(d, false), ticksFromDen(da, false));
      setMorse(res.code);
      setDecoded(res.text);
    } catch {
      setMorse('');
      setDecoded('');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold">Morse Decoder</div>
      <textarea className="border p-1 mt-1 flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="RTTTL string" />
      <div className="flex gap-2 mt-2 items-center text-sm">
        <label>
          Dot:
          <select className="border ml-1" value={dotLen} onChange={e=>{
            const val = parseInt(e.target.value) as Den;
            setDotLen(val);
            decode({ dot: val });
          }}>
            {DEFAULT_DENS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Dash:
          <select className="border ml-1" value={dashLen} onChange={e=>{
            const val = parseInt(e.target.value) as Den;
            setDashLen(val);
            decode({ dash: val });
          }}>
            {DEFAULT_DENS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
        <button className="border px-2 ml-auto" onClick={()=>decode({guess:true})}>Decode</button>
      </div>
      {morse && (
        <div className="mt-2 text-sm">
          <div className="font-bold">Morse</div>
          <div className="border p-1 whitespace-pre-wrap font-mono">{morse}</div>
          <div className="font-bold mt-2">Text</div>
          <div className="border p-1 whitespace-pre-wrap">{decoded}</div>
        </div>
      )}
    </div>
  );
};

export default MorseDecodeControls;
