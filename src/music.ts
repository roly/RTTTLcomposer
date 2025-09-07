export type Den = 1 | 2 | 4 | 8 | 16 | 32;
export interface NoteEvent {
  id: string;
  isRest: boolean;
  keyIndex?: number;
  note?: string;
  octave?: number;
  durationDen: Den;
  dotted?: boolean;
}
export interface KeyDef {
  index: number;
  name: string;
  octave: number;
  midi: number;
  isBlack: boolean;
  label: string;
}

export const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const KEYS: KeyDef[] = Array.from({length:48}, (_,i)=>{
  const midi = 60 + i;
  const name = NAMES[midi%12];
  const octave = Math.floor(midi/12) - 1;
  const isBlack = name.includes('#');
  const label = !isBlack ? `${name}${octave}` : '';
  return {index:i,name,octave,midi,isBlack,label};
});
export const TICKS_PER_QUARTER = 48;
export const pxPerTick = 0.5;
export const DUR_STATES = [
  {den:32,dotted:false},{den:32,dotted:true},
  {den:16,dotted:false},{den:16,dotted:true},
  {den:8,dotted:false},{den:8,dotted:true},
  {den:4,dotted:false},{den:4,dotted:true},
  {den:2,dotted:false},{den:2,dotted:true},
  {den:1,dotted:false},{den:1,dotted:true},
];
export const TEMPOS = [5,28,31,35,40,45,50,56,63,70,80,90,100,112,125,140,160,170,180,200,225,250,285,320,355,400,450,500,565,635,715,800,900];
export const DEFAULT_DENS:Den[] = [1,2,4,8,16,32];
export const NEXT_DENS:Den[] = [1,2,4,8,16,32];

export const SCALES: Record<string,string[]> = {
  'C Major':['C','D','E','F','G','A','B'],
  'G Major':['G','A','B','C','D','E','F#'],
  'A Minor':['A','B','C','D','E','F','G'],
  'Chromatic':['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
  'Pentatonic Major':['C','D','E','G','A'],
  'Pentatonic':['A','C','D','E','G'],
};

export function ticksFromDen(den:Den,dotted?:boolean){
  let t = (TICKS_PER_QUARTER*4)/den;
  return dotted? t*1.5 : t;
}
