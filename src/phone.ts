import { Den, NoteEvent, KEYS, KeyDef } from './music';
import { generateRTTTL } from './rtttl';

// DTMF keypad frequencies (key -> [low, high])
export const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  'A': [697, 1633],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  'B': [770, 1633],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  'C': [852, 1633],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
  'D': [941, 1633],
};

// Blue box / MF signalling approximations
export const BLUE_BOX_FREQS: Record<string, [number, number]> = {
  '1': [700, 900],
  '2': [700, 1100],
  '3': [900, 1100],
  '4': [700, 1300],
  '5': [900, 1300],
  '6': [1100, 1300],
  '7': [700, 1500],
  '8': [900, 1500],
  '9': [1100, 1500],
  '0': [1300, 1500],
  'KP': [1100, 1700],
  'ST': [1500, 1700],
};

export const RED_BOX_PAIR: [number, number] = [1700, 2200];
export const TONE_2600 = 2600;
export const MODEM_TEMPO = 800;

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function nearestKey(freq: number): KeyDef {
  let best = KEYS[0];
  let minDiff = Math.abs(midiToFreq(best.midi) - freq);
  for (const k of KEYS) {
    const diff = Math.abs(midiToFreq(k.midi) - freq);
    if (diff < minDiff) {
      best = k;
      minDiff = diff;
    }
  }
  return best;
}

interface ToneOptions {
  toneDen?: Den;
  gapDen?: Den;
}

function pairToEvents(pair: [number, number], toneDen: Den): NoteEvent[] {
  return pair.map(freq => {
    const key = nearestKey(freq);
    return {
      id: crypto.randomUUID(),
      isRest: false,
      keyIndex: key.index,
      note: key.name,
      octave: key.octave,
      durationDen: toneDen,
    };
  });
}

export function dtmfToEvents(keys: string, { toneDen = 32, gapDen = 16 }: ToneOptions = {}): NoteEvent[] {
  const events: NoteEvent[] = [];
  const up = keys.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const ch = up[i];
    const pair = DTMF_FREQS[ch];
    if (!pair) continue;
    events.push(...pairToEvents(pair, toneDen));
    if (i < up.length - 1) {
      events.push({ id: crypto.randomUUID(), isRest: true, durationDen: gapDen });
    }
  }
  return events;
}

export function blueBoxToEvents(seq: string, { toneDen = 32, gapDen = 16 }: ToneOptions = {}): NoteEvent[] {
  const tokens = seq.toUpperCase().match(/KP|ST|[0-9]/g) ?? [];
  const events: NoteEvent[] = [];
  tokens.forEach((tok, idx) => {
    const pair = BLUE_BOX_FREQS[tok];
    if (!pair) return;
    events.push(...pairToEvents(pair, toneDen));
    if (idx < tokens.length - 1) {
      events.push({ id: crypto.randomUUID(), isRest: true, durationDen: gapDen });
    }
  });
  return events;
}

export function redBoxCoinToEvents(value: 5 | 10 | 25, { toneDen = 32, gapDen = 32 }: ToneOptions = {}): NoteEvent[] {
  const bursts = { 5: 1, 10: 2, 25: 5 }[value] ?? 0;
  const events: NoteEvent[] = [];
  for (let i = 0; i < bursts; i++) {
    events.push(...pairToEvents(RED_BOX_PAIR, toneDen));
    if (i < bursts - 1) {
      events.push({ id: crypto.randomUUID(), isRest: true, durationDen: gapDen });
    }
  }
  return events;
}

export function tone2600ToEvents(toneDen: Den = 8): NoteEvent[] {
  const key = nearestKey(TONE_2600);
  return [
    {
      id: crypto.randomUUID(),
      isRest: false,
      keyIndex: key.index,
      note: key.name,
      octave: key.octave,
      durationDen: toneDen,
    },
  ];
}

export function modemNoiseToEvents(seconds = 5, { toneDen = 32 }: ToneOptions = {}): NoteEvent[] {
  const noteDurSec = 60 / MODEM_TEMPO * 4 / toneDen;
  const total = Math.round(seconds / noteDurSec);
  const events: NoteEvent[] = [];
  for (let i = 0; i < total; i++) {
    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    events.push({
      id: crypto.randomUUID(),
      isRest: false,
      keyIndex: key.index,
      note: key.name,
      octave: key.octave,
      durationDen: toneDen,
    });
  }
  return events;
}

// Helpers to directly create RTTTL strings
export function dtmfToRTTTL(name: string, tempo: number, keys: string, opts?: ToneOptions) {
  const toneDen = opts?.toneDen ?? 32;
  const defOct = 5;
  const events = dtmfToEvents(keys, opts);
  return generateRTTTL(name, toneDen, defOct, tempo, events);
}

export function blueBoxToRTTTL(name: string, tempo: number, seq: string, opts?: ToneOptions) {
  const toneDen = opts?.toneDen ?? 32;
  const defOct = 5;
  const events = blueBoxToEvents(seq, opts);
  return generateRTTTL(name, toneDen, defOct, tempo, events);
}

export function redBoxCoinToRTTTL(name: string, tempo: number, value: 5 | 10 | 25, opts?: ToneOptions) {
  const toneDen = opts?.toneDen ?? 32;
  const defOct = 5;
  const events = redBoxCoinToEvents(value, opts);
  return generateRTTTL(name, toneDen, defOct, tempo, events);
}

export function tone2600ToRTTTL(name: string, tempo: number, toneDen: Den = 8) {
  const defOct = 5;
  const events = tone2600ToEvents(toneDen);
  return generateRTTTL(name, toneDen, defOct, tempo, events);
}

