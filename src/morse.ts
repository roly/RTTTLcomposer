import { Den, NoteEvent, KEYS } from './music';

export const MORSE: Record<string,string> = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'
};

export interface MorseOptions {
  scaleNotes: string[];
  morseOct: number;
  dotLen: Den;
  dotDot: boolean;
  dashLen: Den;
  dashDot: boolean;
  symGap: Den | 'None';
  symDot: boolean;
  letGap: Den | 'None';
  letDot: boolean;
  wordGap: Den | 'None';
  wordDot: boolean;
  startIndex: number;
}

export function morseToEvents(text: string, opts: MorseOptions): { events: NoteEvent[]; nextIndex: number } {
  const events: NoteEvent[] = [];
  let idx = opts.startIndex;
  const scaleNotes = opts.scaleNotes;
  if (!scaleNotes || !scaleNotes.length) return { events, nextIndex: idx };
  const up = text.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const ch = up[i];
    if (ch === ' ') {
      if (opts.wordGap !== 'None') {
        events.push({ id: crypto.randomUUID(), isRest: true, durationDen: opts.wordGap, dotted: opts.wordDot });
      }
      continue;
    }
    const code = MORSE[ch];
    if (!code) continue;
    const noteName = scaleNotes[idx % scaleNotes.length];
    const keyIndex = KEYS.findIndex(k => k.name === noteName && k.octave === opts.morseOct);
    idx++;
    for (let j = 0; j < code.length; j++) {
      const sym = code[j];
      if (sym === '.') {
        events.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: noteName, octave: opts.morseOct, durationDen: opts.dotLen, dotted: opts.dotDot });
      } else {
        events.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: noteName, octave: opts.morseOct, durationDen: opts.dashLen, dotted: opts.dashDot });
      }
      if (j < code.length - 1 && opts.symGap !== 'None') {
        events.push({ id: crypto.randomUUID(), isRest: true, durationDen: opts.symGap, dotted: opts.symDot });
      }
    }
    if (i < up.length - 1) {
      if (up[i + 1] === ' ') {
        if (opts.wordGap !== 'None') {
          events.push({ id: crypto.randomUUID(), isRest: true, durationDen: opts.wordGap, dotted: opts.wordDot });
        }
      } else if (opts.letGap !== 'None') {
        events.push({ id: crypto.randomUUID(), isRest: true, durationDen: opts.letGap, dotted: opts.letDot });
      }
    }
  }
  return { events, nextIndex: idx };
}

