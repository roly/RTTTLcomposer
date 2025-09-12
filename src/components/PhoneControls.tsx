import React from 'react';
import { Den, NoteEvent } from '../music';
import {
  dtmfToEvents,
  blueBoxToEvents,
  redBoxCoinToEvents,
  tone2600ToEvents,
  modemNoiseToEvents,
  DTMF_FREQS,
  BLUE_BOX_FREQS,
  RED_BOX_PAIR,
  TONE_2600,
  MODEM_TEMPO,
} from '../phone';
import { playFreqs } from '../sound';

interface Props {
  onAdd: (events: NoteEvent[]) => void;
  setBpm: (tempo: number) => void;
}

const PhoneControls: React.FC<Props> = ({ onAdd, setBpm }) => {
  const toneDen: Den = 32;
  const gapDen: Den = 16;

  function addEvents(events: NoteEvent[]) {
    events.push({ id: crypto.randomUUID(), isRest: true, durationDen: gapDen });
    onAdd(events);
  }

  const handleDtmf = (k: string) => {
    const pair = DTMF_FREQS[k];
    if (pair) playFreqs(pair);
    addEvents(dtmfToEvents(k, { toneDen }));
  };
  const handleBlue = (k: string) => {
    const pair = BLUE_BOX_FREQS[k];
    if (pair) playFreqs(pair);
    addEvents(blueBoxToEvents(k, { toneDen }));
  };
  const handleRed = (v: 5 | 10 | 25) => {
    playFreqs(RED_BOX_PAIR);
    addEvents(redBoxCoinToEvents(v, { toneDen, gapDen }));
  };
  const handle2600 = () => {
    playFreqs([TONE_2600]);
    addEvents(tone2600ToEvents(8));
  };
  const handleModem = () => {
    setBpm(MODEM_TEMPO);
    addEvents(modemNoiseToEvents(5, { toneDen }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-bold mb-1">DTMF Keypad</div>
        <div className="grid grid-cols-4 gap-1">
          {['1','2','3','A','4','5','6','B','7','8','9','C','*','0','#','D'].map(k => (
            <button key={k} className="border p-2" onClick={() => handleDtmf(k)}>{k}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="font-bold mb-1">Blue Box</div>
        <div className="grid grid-cols-3 gap-1">
          {['KP','1','2','3','4','5','6','7','8','9','0','ST'].map(k => (
            <button key={k} className="border p-2" onClick={() => handleBlue(k)}>{k}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="font-bold mb-1">Red Box</div>
        <div className="flex gap-1 flex-wrap">
          <button className="border p-2" onClick={() => handleRed(5)}>5¢</button>
          <button className="border p-2" onClick={() => handleRed(10)}>10¢</button>
          <button className="border p-2" onClick={() => handleRed(25)}>25¢</button>
          <button className="border p-2" onClick={handle2600}>2600Hz</button>
        </div>
      </div>
      <div>
        <div className="font-bold mb-1">Modem</div>
        <button className="border p-2" onClick={handleModem}>AOL Noise</button>
      </div>
    </div>
  );
};

export default PhoneControls;

