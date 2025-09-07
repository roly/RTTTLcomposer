import React from 'react';
import { KeyDef } from '../music';

interface Props {
  keys: KeyDef[];
  colWidth: number;
  onKeyPress: (k: KeyDef) => void;
}

const Keyboard: React.FC<Props> = ({ keys, colWidth, onKeyPress }) => (
  <div className="relative select-none" style={{width: keys.length*colWidth, height: 96}}>
    {keys.map(k => (
      <div
        key={k.index}
        onClick={() => onKeyPress(k)}
        className={`absolute flex items-end justify-center cursor-pointer box-border ${k.isBlack ? 'bg-black text-white' : 'bg-white border'}`}
        style={{left: k.index*colWidth, width: colWidth, height: '100%'}}
      >
        {!k.isBlack && <span className="text-xs text-gray-800">{k.label}</span>}
      </div>
    ))}
  </div>
);

export default Keyboard;
