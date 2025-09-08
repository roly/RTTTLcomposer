import React, { useState } from 'react';
import { NoteEvent, KEYS } from '../music';
import { speechToEvents } from '../speech';

interface Props {
  onAdd: (events: NoteEvent[]) => void;
}

const SpeechControls: React.FC<Props> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const baseOptions = KEYS.filter(k => k.midi >= 69 && k.midi <= 84);
  const [baseIndex, setBaseIndex] = useState(baseOptions[0].index);

  function addSpeech(){
    const key = KEYS[baseIndex];
    const events = speechToEvents(text,{baseMidi:key.midi});
    onAdd(events);
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold">Speech Mode</div>
      <textarea className="border p-1 mt-1 flex-1" value={text} onChange={e=>setText(e.target.value)} />
      <label className="mt-1 text-xs flex items-center gap-1">Base key
        <select className="border" value={baseIndex} onChange={e=>setBaseIndex(parseInt(e.target.value))}>
          {baseOptions.map(k => <option key={k.index} value={k.index}>{k.name}{k.octave}</option>)}
        </select>
      </label>
      <button className="border px-2 mt-2" onClick={addSpeech}>Add Speech</button>
    </div>
  );
};

export default SpeechControls;
