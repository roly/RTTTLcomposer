import React from 'react';

interface Props {
  rtttl: string;
  setRtttl: (v: string) => void;
}

const RTTTLControls: React.FC<Props> = ({ rtttl, setRtttl }) => (
  <div className="flex-1 p-2 flex flex-col">
    <div className="font-bold">RTTTL Text</div>
    <textarea className="flex-1 border p-1 mt-1" value={rtttl} onChange={e=>setRtttl(e.target.value)} />
    <div className="mt-1 flex gap-2">
      <button
        className="border px-2"
        onClick={()=>navigator.clipboard.writeText(rtttl)}
        aria-label="Copy RTTTL to clipboard"
        title="Copy RTTTL to clipboard"
      >
        Copy
      </button>
    </div>
  </div>
);

export default RTTTLControls;
