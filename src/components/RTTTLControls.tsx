import React, { useState } from 'react';
import { Den, NoteEvent } from '../music';
import { parseRTTTL as parseRTTTLString, generateRTTTL as generateRTTTLString } from '../rtttl';

interface Props {
  name: string;
  defDen: Den;
  bpm: number;
  notes: NoteEvent[];
  onImport: (song: { name: string; defDen: Den; bpm: number; notes: NoteEvent[] }) => void;
}

const RTTTLControls: React.FC<Props> = ({ name, defDen, bpm, notes, onImport }) => {
  const [rtttlText, setRtttlText] = useState('');

  function parseRTTTL() {
    try {
      const song = parseRTTTLString(rtttlText.trim(), defDen, bpm);
      onImport(song);
    } catch (err) {
      console.error(err);
    }
  }

  function generateRTTTL() {
    const txt = generateRTTTLString(name, defDen, bpm, notes);
    setRtttlText(txt);
    navigator.clipboard.writeText(txt);
  }

  return (
    <div className="flex-1 p-2 flex flex-col">
      <div className="font-bold">RTTTL Text</div>
      <textarea className="flex-1 border p-1 mt-1" value={rtttlText} onChange={e=>setRtttlText(e.target.value)} />
      <div className="mt-1 flex gap-2">
        <button className="border px-2" onClick={parseRTTTL}>Parse → Grid</button>
        <button className="border px-2" onClick={generateRTTTL}>Generate & Copy</button>
      </div>
    </div>
  );
};

export default RTTTLControls;
