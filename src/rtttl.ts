import { Den, NoteEvent, KEYS, KeyDef } from './music';

export interface RTTTLSong {
  name: string;
  defDen: Den;
  bpm: number;
  notes: NoteEvent[];
}

export function parseRTTTL(txt: string, currentDef: Den, currentBpm: number): RTTTLSong {
  const [n, settings, seq] = txt.trim().split(':');
  const parts = settings.split(',');
  let d: Den = currentDef;
  let o = 5;
  let b: number = currentBpm;
  parts.forEach(p => {
    const [k, v] = p.split('=');
    if (k === 'd') d = parseInt(v) as Den;
    if (k === 'o') o = parseInt(v);
    if (k === 'b') b = parseInt(v);
  });
  const evs: NoteEvent[] = [];
  seq.split(',').forEach(tok0 => {
    let tok = tok0.trim();
    if (!tok) return;
    let dot = false;
    if (tok.includes('.')) {
      dot = true;
      tok = tok.replace('.', '');
    }
    let m = tok.match(/^\d+/);
    let den: Den = m ? (parseInt(m[0]) as Den) : d;
    tok = tok.replace(/^\d+/, '');
    if (tok.startsWith('p')) {
      evs.push({ id: crypto.randomUUID(), isRest: true, durationDen: den, dotted: dot });
      return;
    }
    let note = tok[0].toUpperCase();
    tok = tok.slice(1);
    let sharp = false;
    if (tok.startsWith('#')) {
      sharp = true;
      tok = tok.slice(1);
    }
    let oct = o;
    if (tok) oct = parseInt(tok[0]);
    const name = note + (sharp ? '#' : '');
    const keyIndex = KEYS.findIndex((k: KeyDef) => k.name === name && k.octave === oct);
    if (keyIndex >= 0) {
      evs.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: name, octave: oct, durationDen: den, dotted: dot });
    }
  });
  return { name: n, defDen: d, bpm: b, notes: evs };
}

export function generateRTTTL(name: string, defDen: Den, bpm: number, notes: NoteEvent[]): string {
  const header = `${name}:d=${defDen},o=5,b=${bpm}:`;
  const body = notes
    .map(n => {
      const dur = n.durationDen !== defDen ? n.durationDen.toString() : '';
      const dot = n.dotted ? '.' : '';
      if (n.isRest) return `${dur}p${dot}`;
      return `${dur}${n.note?.toLowerCase()}${KEYS[n.keyIndex!].octave}${dot}`;
    })
    .join(',');
  return header + body;
}

