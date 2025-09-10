import React, { useState } from 'react';
import { parseRTTTL } from '../rtttl';
import { ticksFromDen } from '../music';
import { eventsToMorse } from '../morse';

const MorseDecodeControls: React.FC = () => {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [decoded, setDecoded] = useState('');

  function decode(){
    try{
      const song = parseRTTTL(text, 8, 5, 120);
      const dot = song.notes.length
        ? Math.min(...song.notes.map(ev => ticksFromDen(ev.durationDen, ev.dotted)))
        : ticksFromDen(song.defDen, false);
      const res = eventsToMorse(song.notes, dot);
      setMorse(res.code);
      setDecoded(res.text);
    }catch{
      setMorse('');
      setDecoded('');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold">Morse Decoder</div>
      <textarea className="border p-1 mt-1 flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="RTTTL string" />
      <button className="border px-2 mt-2" onClick={decode}>Decode</button>
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
