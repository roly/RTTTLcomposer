import React, { useState } from 'react';
import { parseRTTTL } from '../rtttl';
import { ticksFromDen, Den, NoteEvent } from '../music';
import { eventsToMorse } from '../morse';

function gcd(a:number,b:number){
  while(b){ [a,b] = [b,a%b]; }
  return a;
}

function baseDot(notes:NoteEvent[], defDen:Den){
  if(!notes.length) return ticksFromDen(defDen,false);
  return notes
    .map(ev=>ticksFromDen(ev.durationDen,ev.dotted))
    .reduce((a,b)=>gcd(a,b));
}

const MorseDecodeControls: React.FC = () => {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [decoded, setDecoded] = useState('');

  function decode(){
    try{
      const song = parseRTTTL(text, 8, 5, 120);
      const dot = baseDot(song.notes, song.defDen);
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
