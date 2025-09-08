import { NoteEvent, Den, KEYS } from './music';
import { generateRTTTL } from './rtttl';

const STOPWORDS = new Set(['the','a','an','and','or','but','of','to','in','on','for','your']);
const DEG_BY_TIER = [0,2,4,5,7];

export function syllabify(word: string): string[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g,'');
  if(!clean) return [];
  const sylls = clean.match(/[^aeiouy]*[aeiouy]+/g);
  return sylls ?? [clean];
}

export function vowelTier(v: string | undefined): number {
  switch(v){
    case 'u': return 0;
    case 'o': return 1;
    case 'a': return 2;
    case 'e': return 3;
    case 'i':
    case 'y': return 4;
    default: return 2; // mid tier
  }
}

function clamp(n:number,min:number,max:number){
  return Math.max(min,Math.min(max,n));
}

export interface SpeechOptions {
  baseMidi: number;
}

export function speechToEvents(text: string, {baseMidi}: SpeechOptions): NoteEvent[] {
  const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
  const events: NoteEvent[] = [];
  lines.forEach((line,lineIdx)=>{
    const words = line.split(/\s+/).filter(Boolean);
    words.forEach((word,idxWord)=>{
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g,'');
      const syls = syllabify(word);
      const isStop = STOPWORDS.has(cleanWord);
      syls.forEach((syl,i)=>{
        const v = syl.match(/[aeiouy]/)?.[0];
        const tier = vowelTier(v);
        const degree = DEG_BY_TIER[tier];
        const fall = Math.round((1 - idxWord/Math.max(1, words.length-1))*4) - 2;
        const jitter = i>0? -1: 0;
        const midi = clamp(baseMidi + degree + fall + jitter, 55, 84);
        const key = KEYS.find(k=>k.midi===midi) ?? KEYS[0];
        const stressed = !isStop && i===0;
        let durationDen: Den = stressed ? 4 : 8;
        const isLineFinal = idxWord===words.length-1 && i===syls.length-1;
        if(isLineFinal) durationDen = 4;
        events.push({
          id: crypto.randomUUID(),
          isRest:false,
          keyIndex:key.index,
          note:key.name,
          octave:key.octave,
          durationDen,
        });
      });
      if(/[ktp]$/i.test(cleanWord)){
        events.push({id:crypto.randomUUID(),isRest:true,durationDen:16});
      }
    });
    if(lineIdx<lines.length-1){
      events.push({id:crypto.randomUUID(),isRest:true,durationDen:4});
    }
  });
  return events.slice(0,256);
}

export function speechToRTTTL(name:string, tempo:number, text:string, baseMidi:number){
  const events = speechToEvents(text,{baseMidi});
  const defDen:Den = 8;
  const defOct = 5;
  return generateRTTTL(name, defDen, defOct, tempo, events);
}

