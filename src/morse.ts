import { Den, NoteEvent, KEYS, ticksFromDen } from './music';

export const MORSE: Record<string,string> = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'
};

export interface MorseOptions {
  scaleNotes: string[]; // notes may include octave eg "C#4"
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
  scaleBySymbol: boolean;
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
    if (opts.scaleBySymbol) {
      for (let j = 0; j < code.length; j++) {
        const raw = scaleNotes[idx % scaleNotes.length];
        const m = raw.match(/^([A-G]#?)(\d+)?$/i);
        const noteName = m ? m[1].toUpperCase() : raw;
        let oct = m && m[2] ? parseInt(m[2]) : opts.morseOct;
        oct = Math.min(7, Math.max(4, oct));
        const keyIndex = KEYS.findIndex(k => k.name === noteName && k.octave === oct);
        idx++;
        if (keyIndex === -1) continue;
        const sym = code[j];
        if (sym === '.') {
          events.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: noteName, octave: oct, durationDen: opts.dotLen, dotted: opts.dotDot });
        } else {
          events.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: noteName, octave: oct, durationDen: opts.dashLen, dotted: opts.dashDot });
        }
        if (j < code.length - 1 && opts.symGap !== 'None') {
          events.push({ id: crypto.randomUUID(), isRest: true, durationDen: opts.symGap, dotted: opts.symDot });
        }
      }
    } else {
      const raw = scaleNotes[idx % scaleNotes.length];
      const m = raw.match(/^([A-G]#?)(\d+)?$/i);
      const noteName = m ? m[1].toUpperCase() : raw;
      let oct = m && m[2] ? parseInt(m[2]) : opts.morseOct;
      oct = Math.min(7, Math.max(4, oct));
      const keyIndex = KEYS.findIndex(k => k.name === noteName && k.octave === oct);
      idx++;
      if (keyIndex === -1) continue;
      for (let j = 0; j < code.length; j++) {
        const sym = code[j];
        if (sym === '.') {
          events.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: noteName, octave: oct, durationDen: opts.dotLen, dotted: opts.dotDot });
        } else {
          events.push({ id: crypto.randomUUID(), isRest: false, keyIndex, note: noteName, octave: oct, durationDen: opts.dashLen, dotted: opts.dashDot });
        }
        if (j < code.length - 1 && opts.symGap !== 'None') {
          events.push({ id: crypto.randomUUID(), isRest: true, durationDen: opts.symGap, dotted: opts.symDot });
        }
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

const REV_MORSE: Record<string,string> = Object.fromEntries(
  Object.entries(MORSE).map(([k,v]) => [v,k])
);

export function eventsToMorse(events: NoteEvent[], dotTicks: number): { code: string; text: string } {
  const wordsCode: string[][] = [[]];
  const wordsText: string[][] = [[]];
  let currentSymbols = '';
  function flushLetter(){
    if (!currentSymbols) return;
    const letter = REV_MORSE[currentSymbols] || '?';
    wordsCode[wordsCode.length-1].push(currentSymbols);
    wordsText[wordsText.length-1].push(letter);
    currentSymbols='';
  }
  events.forEach(ev => {
    const units = Math.round(ticksFromDen(ev.durationDen, ev.dotted) / dotTicks);
    if (!ev.isRest) {
      if (units <= 2) currentSymbols += '.'; else currentSymbols += '-';
    } else {
      if (units >= 7) {
        flushLetter();
        wordsCode.push([]);
        wordsText.push([]);
      } else if (units >= 3) {
        flushLetter();
      } else {
        // symbol gap, do nothing
      }
    }
  });
  flushLetter();
  const code = wordsCode.map(w => w.join(' ')).join(' / ');
  const text = wordsText.map(w => w.join('')).join(' ');
  return { code, text };
}

