import React, { useState } from 'react';

interface Props {
  onInterleave: (rtttl: string) => void;
}

const InterleaveControls: React.FC<Props> = ({ onInterleave }) => {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col flex-1">
      <div className="font-bold">Interleave</div>
      <textarea
        className="border p-1 mt-1 flex-1"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="RTTTL string"
      />
      <button className="border px-2 mt-2" onClick={() => onInterleave(text)}>
        Interleave
      </button>
    </div>
  );
};

export default InterleaveControls;
