import React, { useState, useEffect, useRef } from 'react';

// Types
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

// Constants
const NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const KEYS: KeyDef[] = Array.from({length:48}, (_,i)=>{
  const midi = 60 + i;
  const name = NAMES[midi%12];
  const octave = Math.floor(midi/12) - 1;
  const isBlack = name.includes('#');
  const label = !isBlack ? `${name}${octave}` : '';
  return {index:i,name,octave,midi,isBlack,label};
});
const TICKS_PER_QUARTER = 48;
const pxPerTick = 0.5;
const DUR_STATES = [
  {den:32,dotted:false},{den:32,dotted:true},
  {den:16,dotted:false},{den:16,dotted:true},
  {den:8,dotted:false},{den:8,dotted:true},
  {den:4,dotted:false},{den:4,dotted:true},
  {den:2,dotted:false},{den:2,dotted:true},
  {den:1,dotted:false},{den:1,dotted:true},
];
const TEMPOS = [5,28,31,35,40,45,50,56,63,70,80,90,100,112,125,140,160,180,200,225,250,285,320,355,400,450,500,565,635,715,800,900];
const DEFAULT_DENS:Den[] = [1,2,4,8,16,32];
const NEXT_DENS:Den[] = [1,2,4,8,16,32];

const MORSE: Record<string,string> = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....','I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.','Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-','Y':'-.--','Z':'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'
};
const SCALES: Record<string,string[]> = {
  'C Major':['C','D','E','F','G','A','B'],
  'G Major':['G','A','B','C','D','E','F#'],
  'A Minor':['A','B','C','D','E','F','G'],
  'Chromatic':['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'],
  'Pentatonic Major':['C','D','E','G','A'],
  'Pentatonic':['A','C','D','E','G'],
};

function ticksFromDen(den:Den,dotted?:boolean){
  let t = (TICKS_PER_QUARTER*4)/den;
  return dotted? t*1.5 : t;
}

const App:React.FC = () => {
  // Theme
  const [dark,setDark] = useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(()=>{
    document.documentElement.classList.toggle('dark',dark);
  },[dark]);

  // State
  const [name,setName] = useState('Tune');
  const [bpm,setBpm] = useState(120);
  const [defDen,setDefDen] = useState<Den>(4);
  const [notes,setNotes] = useState<NoteEvent[]>([]);
  const [selected,setSelected] = useState<Set<string>>(new Set());
  const [clipboard,setClipboard] = useState<Omit<NoteEvent,'id'>[]>([]);
  const [cursorTick,setCursorTick] = useState(0);
  const cursorRef = useRef(0);
  useEffect(()=>{ cursorRef.current = cursorTick; },[cursorTick]);
  const [nextLen,setNextLen] = useState<Den>(4);
  const [nextDot,setNextDot] = useState(false);
  const [keyboardMode,setKeyboardMode] = useState(false);
  const [playing,setPlaying] = useState(false);
  const [playTick,setPlayTick] = useState(0);
  const [loop,setLoop] = useState(false);
  const [rtttlText,setRtttlText] = useState('');
  const [morseText,setMorseText] = useState('');
  const [dotLen,setDotLen] = useState<Den>(8);
  const [dotDot,setDotDot] = useState(false);
  const [dashLen,setDashLen] = useState<Den>(4);
  const [dashDot,setDashDot] = useState(false);
  const [symGap,setSymGap] = useState<Den | 'None'>('None');
  const [symDot,setSymDot] = useState(false);
  const [letGap,setLetGap] = useState<Den | 'None'>('None');
  const [letDot,setLetDot] = useState(false);
  const [wordGap,setWordGap] = useState<Den | 'None'>('None');
  const [wordDot,setWordDot] = useState(false);
  const [scale,setScale] = useState('C Major');
  const [customScale,setCustomScale] = useState('');
  const [morseOct,setMorseOct] = useState(4);
  const scaleIndex = useRef(0);

  const gridRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const [colWidth,setColWidth] = useState(20);

  useEffect(()=>{
    const ro = new ResizeObserver((entries: ResizeObserverEntry[])=>{
      const w = entries[0].contentRect.width;
      setColWidth(Math.floor(w/48));
    });
    if(gridRef.current) ro.observe(gridRef.current);
    return ()=>ro.disconnect();
  },[]);

  // Derived
  const noteWithTiming = notes.reduce<{ev:NoteEvent;startTick:number;durTicks:number}[]>((arr: {ev:NoteEvent;startTick:number;durTicks:number}[], ev: NoteEvent)=>{
    const start = arr.length? arr[arr.length-1].startTick + arr[arr.length-1].durTicks : 0;
    const dur = ticksFromDen(ev.durationDen,ev.dotted);
    arr.push({ev,startTick:start,durTicks:dur});
    return arr;
  },[]);
  const totalTicks = noteWithTiming.reduce((s: number, n: {ev:NoteEvent;startTick:number;durTicks:number})=>s+n.durTicks,0);
  const tickSec = 60 / bpm / TICKS_PER_QUARTER;
  const gridWidth = KEYS.length*colWidth;
  const gridHeight = Math.max(240,totalTicks*pxPerTick+40);

  // Scroll
  useEffect(()=>{
    const t = playing? playTick : cursorTick;
    const cont = gridRef.current; const contentH = gridHeight;
    if(cont){
      const target = contentH - t*pxPerTick - cont.clientHeight/2;
      cont.scrollTop = Math.max(0,Math.min(target,contentH));
    }
  },[playTick,cursorTick,playing,gridHeight]);

  // Key playback preview
  const audioCtxRef = useRef<AudioContext>();
  function playTone(midi:number,dur=0.3){
    if(!audioCtxRef.current){
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new AC();
    }
    const ctx = audioCtxRef.current;
    if(ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type='sine';
    osc.frequency.value = 440 * Math.pow(2,(midi-69)/12);
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.setValueAtTime(0.001,now);
    gain.gain.linearRampToValueAtTime(0.3,now+0.01);
    gain.gain.linearRampToValueAtTime(0.001,now+dur);
    osc.stop(now+dur+0.05);
  }

  // Insert helper
  function insertEvent(ev:NoteEvent){
    const dur = ticksFromDen(ev.durationDen,ev.dotted);
    setNotes((prev: NoteEvent[])=>{
      const nw = prev.reduce<{startTick:number;durTicks:number}[]>((arr: {startTick:number;durTicks:number}[], n: NoteEvent)=>{
        const st = arr.length? arr[arr.length-1].startTick + arr[arr.length-1].durTicks : 0;
        arr.push({startTick:st,durTicks:ticksFromDen(n.durationDen,n.dotted)});
        return arr;
      },[]);
      const idx = nw.findIndex((n: {startTick:number;durTicks:number})=>n.startTick>=(cursorRef.current ?? 0));
      const arr = [...prev];
      if(idx===-1) arr.push(ev); else arr.splice(idx,0,ev);
      return arr;
    });
    cursorRef.current = (cursorRef.current ?? 0) + dur;
    setCursorTick(cursorRef.current ?? 0);
  }

  // Keyboard click
  function onKeyPress(k:KeyDef){
    insertEvent({id:crypto.randomUUID(),isRest:false,keyIndex:k.index,note:k.name,octave:k.octave,durationDen:nextLen,dotted:nextDot});
    playTone(k.midi,0.2);
  }

  // Pause insert
  function insertRest(){
    insertEvent({id:crypto.randomUUID(),isRest:true,durationDen:nextLen,dotted:nextDot});
  }

  // Clear
  function clearAll(){
    setNotes([]); setSelected(new Set()); cursorRef.current = 0; setCursorTick(0); setPlayTick(0);
  }

  // Selection toggle
  function toggleSelect(id:string){
    const s = new Set(selected); if(s.has(id)) s.delete(id); else s.add(id); setSelected(s);
  }

  // Copy/Cut/Paste/Delete
  function copySel(){
    const items = notes.filter((n: NoteEvent)=>selected.has(n.id)).map(({id,...rest}: NoteEvent & {id: string})=>rest);
    setClipboard(items);
  }
  function cutSel(){ copySel(); delSel(); }
  function delSel(){ setNotes(notes.filter((n: NoteEvent)=>!selected.has(n.id))); setSelected(new Set()); }
  function pasteClip(){
    if(!clipboard.length) return;
    let t = cursorRef.current ?? 0;
    const newItems:NoteEvent[] = clipboard.map((c: Omit<NoteEvent,'id'>)=>({...c,id:crypto.randomUUID()} as NoteEvent));
    const newNotes = [...notes];
    let idx = noteWithTiming.findIndex((n: {ev:NoteEvent;startTick:number;durTicks:number})=>n.startTick>=cursorTick);
    newItems.forEach((ev: NoteEvent)=>{
      const dur = ticksFromDen(ev.durationDen,ev.dotted);
      if(idx===-1){ newNotes.push(ev); } else { newNotes.splice(idx,0,ev); idx++; }
      t+=dur;
    });
    setNotes(newNotes); cursorRef.current = t; setCursorTick(t);
  }

  // Arrow key etc
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if(e.key===' ' && keyboardMode){ e.preventDefault(); insertRest(); }
      if(keyboardMode){
        const map = 'qwertyuiop[]';
        const idx = map.indexOf(e.key);
        if(idx>=0){
          e.preventDefault();
          const base = KEYS.findIndex(k=>k.name==='C' && k.octave===5);
          const key = KEYS[base+idx];
          if(key) onKeyPress(key);
        }
      }
      if(e.key==='Enter' && e.shiftKey){ e.preventDefault(); togglePlay(); }
      if(selected.size){
        if(e.key==='ArrowLeft' || e.key==='ArrowRight'){
          const d = e.key==='ArrowLeft'? -1 : 1;
          const newNotes = notes.map((n: NoteEvent)=>{
            if(!selected.has(n.id) || n.isRest) return n;
            const ni = n.keyIndex! + d; if(ni<0 || ni>=KEYS.length) return n;
            return {...n,keyIndex:ni,note:KEYS[ni].name,octave:KEYS[ni].octave};
          });
          // veto if any went out of range
          if(newNotes.every((n: NoteEvent, i: number)=>!selected.has(notes[i].id) || (n.keyIndex!==notes[i].keyIndex))) setNotes(newNotes);
        }
        if(e.key==='ArrowUp' && e.shiftKey){
          const newNotes = notes.map((n: NoteEvent)=>{
            if(!selected.has(n.id)) return n;
            const idx = DUR_STATES.findIndex(d=>d.den===n.durationDen && !!d.dotted===!!n.dotted);
            if(idx < DUR_STATES.length-1){ const st = DUR_STATES[idx+1]; return {...n,durationDen:st.den as Den,dotted:st.dotted}; }
            return n;
          });
          if(newNotes.every((n: NoteEvent, i: number)=>!selected.has(notes[i].id) || n.durationDen!==notes[i].durationDen || n.dotted!==notes[i].dotted)) setNotes(newNotes);
        }
        if(e.key==='ArrowDown' && e.shiftKey){
          const newNotes = notes.map((n: NoteEvent)=>{
            if(!selected.has(n.id)) return n;
            const idx = DUR_STATES.findIndex(d=>d.den===n.durationDen && !!d.dotted===!!n.dotted);
            if(idx>0){ const st = DUR_STATES[idx-1]; return {...n,durationDen:st.den as Den,dotted:st.dotted}; }
            return n;
          });
          if(newNotes.every((n: NoteEvent, i: number)=>!selected.has(notes[i].id) || n.durationDen!==notes[i].durationDen || n.dotted!==notes[i].dotted)) setNotes(newNotes);
        }
        if(e.key==='Delete' || e.key==='Backspace'){ delSel(); }
        if((e.key==='c'||e.key==='C') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); copySel(); }
        if((e.key==='x'||e.key==='X') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); cutSel(); }
        if((e.key==='v'||e.key==='V') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); pasteClip(); }
      } else {
        if(e.key==='ArrowUp'){ e.preventDefault(); const base = cursorRef.current ?? 0; const nt = Math.min(base+ticksFromDen(nextLen,nextDot),totalTicks); cursorRef.current = nt; setCursorTick(nt); }
        if(e.key==='ArrowDown'){ e.preventDefault(); const base = cursorRef.current ?? 0; const nt = Math.max(0,base-ticksFromDen(nextLen,nextDot)); cursorRef.current = nt; setCursorTick(nt); }
      }
    }
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[selected,notes,cursorTick,nextLen,nextDot,keyboardMode,clipboard,noteWithTiming,totalTicks]);

  // Playback
  const timeoutsRef = useRef<number[]>([]);
  function clearTimers(){
    const timeouts = timeoutsRef.current ?? (timeoutsRef.current = []);
    timeouts.forEach((t:number)=>clearTimeout(t));
    timeoutsRef.current = [];
  }
  function startPlayback(startTick:number){
    if(!audioCtxRef.current){
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new AC();
    }
    if(audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    clearTimers();
    setPlaying(true);
    cursorRef.current = startTick;
    setCursorTick(startTick);
    setPlayTick(startTick);
    noteWithTiming.forEach((n: {ev:NoteEvent;startTick:number;durTicks:number})=>{
      const start = (n.startTick-startTick)*tickSec*1000;
      if(start>=0){
        const id = window.setTimeout(()=>{
          if(!n.ev.isRest){ playTone(KEYS[n.ev.keyIndex!].midi,n.durTicks*tickSec); }
          setPlayTick(n.startTick);
        },start);
        const timeouts = timeoutsRef.current ?? (timeoutsRef.current = []);
        timeouts.push(id);
      }
    });
    const end = (totalTicks-startTick)*tickSec*1000;
    const endId = window.setTimeout(()=>{
      if(loop){
        startPlayback(0);
      } else {
        setPlaying(false);
        cursorRef.current = totalTicks;
        setCursorTick(totalTicks);
        setPlayTick(totalTicks);
      }
    },end);
    const timeouts = timeoutsRef.current ?? (timeoutsRef.current = []);
    timeouts.push(endId);
  }
  function togglePlay(){
    if(playing){
      clearTimers();
      setPlaying(false);
      cursorRef.current = playTick;
      setCursorTick(playTick);
      return;
    }
    startPlayback(cursorTick);
  }

  // Grid click
  function onGridClick(e:React.MouseEvent){
    const rect = gridContentRef.current!.getBoundingClientRect();
    const y = rect.bottom - e.clientY;
    const tick = Math.max(0,Math.round(y/pxPerTick));
    cursorRef.current = tick;
    setCursorTick(tick);
  }

  // RTTTL parse/generate
  function parseRTTTL(){
    try{
      const txt = rtttlText.trim();
      const [n,settings,seq] = txt.split(':');
      setName(n);
      const parts = settings.split(',');
      let d:Den = defDen; let o = 5; let b = bpm;
      parts.forEach((p: string)=>{ const [k,v] = p.split('='); if(k==='d') d=parseInt(v) as Den; if(k==='o') o=parseInt(v); if(k==='b') b=parseInt(v); });
      setDefDen(d); setBpm(b);
      const evs:NoteEvent[] = [];
      seq.split(',').forEach((tok0: string)=>{
        let tok = tok0;
        tok = tok.trim(); if(!tok) return; let dot=false; if(tok.includes('.')){ dot=true; tok=tok.replace('.',''); }
        let m = tok.match(/^\d+/); let den:Den = m? parseInt(m[0]) as Den : d; tok = tok.replace(/^\d+/,'');
        if(tok.startsWith('p')){ evs.push({id:crypto.randomUUID(),isRest:true,durationDen:den,dotted:dot}); return; }
        let note = tok[0].toUpperCase(); tok=tok.slice(1); let sharp=false; if(tok.startsWith('#')){sharp=true;tok=tok.slice(1);} let oct=o; if(tok) oct=parseInt(tok[0]);
        const name = note+(sharp?'#':'');
        const keyIndex = KEYS.findIndex((k: KeyDef)=>k.name===name && k.octave===oct);
        if(keyIndex>=0){ evs.push({id:crypto.randomUUID(),isRest:false,keyIndex,note:name,octave:oct,durationDen:den,dotted:dot}); }
      });
      setNotes(evs); cursorRef.current = 0; setCursorTick(0); setPlayTick(0);
    }catch(err){ console.error(err); }
  }
  function generateRTTTL(){
    const header = `${name}:d=${defDen},o=5,b=${bpm}:`;
    const body = notes.map((n: NoteEvent)=>{
      const dur = n.durationDen!==defDen? n.durationDen.toString(): '';
      const dot = n.dotted? '.':'';
      if(n.isRest) return `${dur}p${dot}`;
      return `${dur}${n.note?.toLowerCase()}${KEYS[n.keyIndex!].octave}${dot}`;
    }).join(',');
    const txt = header+body; setRtttlText(txt); navigator.clipboard.writeText(txt);
  }

  // Morse Add
  function addMorse(){
    const scaleNotes = scale==='Custom'? customScale.split(',').map((s: string)=>s.trim()).filter(Boolean): SCALES[scale];
    if(!scaleNotes || !scaleNotes.length) return;
    const text = morseText.toUpperCase();
    for(let i=0;i<text.length;i++){
      const ch = text[i];
      if(ch===' '){ if(wordGap!=='None') insertEvent({id:crypto.randomUUID(),isRest:true,durationDen:wordGap,dotted:wordDot}); continue; }
      const code = MORSE[ch]; if(!code) continue;
      const noteName = scaleNotes[(scaleIndex.current ?? 0) % scaleNotes.length];
      const keyIndex = KEYS.findIndex(k=>k.name===noteName && k.octave===morseOct);
      scaleIndex.current = (scaleIndex.current ?? 0) + 1;
      for(let j=0;j<code.length;j++){
        const sym = code[j];
        if(sym==='.') insertEvent({id:crypto.randomUUID(),isRest:false,keyIndex,note:noteName,octave:morseOct,durationDen:dotLen,dotted:dotDot});
        else insertEvent({id:crypto.randomUUID(),isRest:false,keyIndex,note:noteName,octave:morseOct,durationDen:dashLen,dotted:dashDot});
        if(j<code.length-1 && symGap!=='None') insertEvent({id:crypto.randomUUID(),isRest:true,durationDen:symGap,dotted:symDot});
      }
      if(i<text.length-1){ if(text[i+1]===' '){ if(wordGap!=='None') insertEvent({id:crypto.randomUUID(),isRest:true,durationDen:wordGap,dotted:wordDot}); } else if(letGap!=='None') insertEvent({id:crypto.randomUUID(),isRest:true,durationDen:letGap,dotted:letDot}); }
    }
  }

  // Dev self-test
  useEffect(()=>{
    console.assert(DUR_STATES.length===12,'duration states length');
    const rt = `${name}:d=${defDen},o=5,b=${bpm}:`;
    console.assert(rt.startsWith(name),'rtttl header test');
  },[]);

  return (
    <div className="min-h-screen flex flex-col text-xs md:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top controls */}
      <div className="flex gap-4 p-2 items-center flex-wrap text-xs">
        <label className="flex items-center gap-1">Name<input className="border p-1" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setName(e.target.value)} /></label>
        <label className="flex items-center gap-1">Tempo<select className="border p-1" value={bpm} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setBpm(parseInt(e.target.value))}>{TEMPOS.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        <label className="flex items-center gap-1">Default d<select className="border p-1" value={defDen} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setDefDen(parseInt(e.target.value) as Den)}>{DEFAULT_DENS.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        <div className="flex-1 flex gap-1 flex-wrap items-center">
          <div>Events: {notes.length}</div>
          <div>Total ticks: {totalTicks}</div>
          <div>Length: {(totalTicks*tickSec).toFixed(2)}s</div>
          <div>Selected: {selected.size}</div>
          <div className="flex gap-1 ml-2">
            <button className="border px-1" onClick={copySel}>Copy</button>
            <button className="border px-1" onClick={cutSel}>Cut</button>
            <button className="border px-1" disabled={!clipboard.length} onClick={pasteClip}>Paste</button>
            <button className="border px-1" onClick={delSel}>Delete</button>
          </div>
        </div>
        <div className="flex gap-2 items-center ml-auto">
          <button className="border px-2" onClick={()=>setDark(!dark)}>{dark?'Light':'Dark'}</button>
          <button className={`border px-2 ${loop?'bg-blue-500 text-white':''}`} onClick={()=>setLoop(!loop)}>{loop?'Looping':'Loop'}</button>
          <button className="border px-2" onClick={togglePlay}>{playing?'Stop':'Play'}</button>
          <span className="text-[10px]">Shift+Enter to Play/Stop</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <div ref={gridRef} className="overflow-y-scroll h-72 md:h-[520px] relative" onClick={onGridClick}>
          <div ref={gridContentRef} className="relative mx-auto" style={{width:gridWidth,height:gridHeight}}>
            {Array.from({length:KEYS.length}).map((_: unknown, i: number)=>(
              <div key={i} className="absolute top-0 bottom-0 border-l border-gray-400/20" style={{left:i*colWidth}} />
            ))}
            {Array.from({length:Math.floor(totalTicks/TICKS_PER_QUARTER)+1}).map((_: unknown, i: number)=>(
              <div key={i} className="absolute left-0 right-0 border-b border-gray-400/20" style={{bottom:i*TICKS_PER_QUARTER*pxPerTick}} />
            ))}
            {noteWithTiming.map((n: {ev:NoteEvent;startTick:number;durTicks:number})=> n.ev.isRest ? (
              <div key={n.ev.id} onClick={(e: React.MouseEvent<HTMLDivElement>)=>{e.stopPropagation();toggleSelect(n.ev.id);}} className={`absolute left-0 w-full ${selected.has(n.ev.id)?'bg-gray-500/50':'bg-gray-400/30'} text-center italic`} style={{height:n.durTicks*pxPerTick,bottom:n.startTick*pxPerTick}}>
                pause
              </div>
            ):(
              <div key={n.ev.id} onClick={(e: React.MouseEvent<HTMLDivElement>)=>{e.stopPropagation();toggleSelect(n.ev.id);}} className={`absolute rounded ${selected.has(n.ev.id)?'bg-blue-400':'bg-blue-600'}`} style={{height:n.durTicks*pxPerTick,width:colWidth-2,left:n.ev.keyIndex!*colWidth+1,bottom:n.startTick*pxPerTick}} />
            ))}
            <div className="absolute left-0 right-0 h-0.5 bg-red-500" style={{bottom:(playing?playTick:cursorTick)*pxPerTick}} />
          </div>
        </div>
      </div>

      {/* Keyboard */}
      <div className="relative select-none" style={{width:gridWidth,height:96}}>
        {KEYS.map(k=>(
          <div
            key={k.index}
            onClick={()=>onKeyPress(k)}
            className={`absolute flex items-end justify-center cursor-pointer ${k.isBlack?'bg-black text-white':'bg-white border'}`}
            style={{left:k.index*colWidth,width:colWidth,height:'100%'}}
          >
            {!k.isBlack && <span className="text-xs text-gray-800">{k.label}</span>}
          </div>
        ))}
      </div>
      {/* Under keyboard toolbar */}
      <div className="flex flex-wrap gap-2 p-2 items-center text-xs border-b">
        <label>Next<select className="border" value={nextLen} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setNextLen(parseInt(e.target.value) as Den)}>{NEXT_DENS.map((n: Den)=><option key={n} value={n}>{n}</option>)}</select></label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={nextDot} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setNextDot(e.target.checked!)} /> dotted</label>
        <button className="border px-1" onClick={insertRest}>+ Pause</button>
        <button className="border px-1" onClick={clearAll}>Clear</button>
        <label className="mt-2 md:ml-auto flex items-center gap-1 w-full md:w-auto justify-end"><input type="checkbox" checked={keyboardMode} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setKeyboardMode(!!e.target.checked)} /> Keyboard mode <span className="italic">QWERTYUIOP[] = C5..B5, Space=pause</span></label>
      </div>

      {/* Bottom panels */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 p-2 flex flex-col">
          <div className="font-bold">RTTTL Text</div>
          <textarea className="flex-1 border p-1 mt-1" value={rtttlText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setRtttlText(e.target.value)} />
          <div className="mt-1 flex gap-2">
            <button className="border px-2" onClick={parseRTTTL}>Parse → Grid</button>
            <button className="border px-2" onClick={generateRTTTL}>Generate & Copy</button>
          </div>
        </div>
        <div className="flex-1 md:w-1/2 p-2 flex flex-col md:border-l mt-2 md:mt-0">
          <div className="font-bold">Morse Mode</div>
          <textarea className="border p-1 mt-1 flex-1" value={morseText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setMorseText(e.target.value)} />
          <div className="grid grid-cols-2 gap-1 text-xs mt-1">
            <label className="flex items-center gap-1">Dot<select className="border" value={dotLen} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setDotLen(parseInt(e.target.value) as Den)}>{NEXT_DENS.map((n: Den)=><option key={n} value={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={dotDot} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setDotDot(!!e.target.checked)} /> dotted</label>
            <label className="flex items-center gap-1">Dash<select className="border" value={dashLen} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setDashLen(parseInt(e.target.value) as Den)}>{NEXT_DENS.map((n: Den)=><option key={n} value={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={dashDot} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setDashDot(!!e.target.checked)} /> dotted</label>
            <label className="flex items-center gap-1">Symbol gap<select className="border" value={symGap} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setSymGap(e.target.value as any)}><option>None</option>{NEXT_DENS.map((n: Den)=><option key={n} value={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={symDot} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setSymDot(!!e.target.checked)} /> dotted</label>
            <label className="flex items-center gap-1">Letter gap<select className="border" value={letGap} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setLetGap(e.target.value as any)}><option>None</option>{NEXT_DENS.map((n: Den)=><option key={n} value={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={letDot} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setLetDot(!!e.target.checked)} /> dotted</label>
            <label className="flex items-center gap-1">Word gap<select className="border" value={wordGap} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setWordGap(e.target.value as any)}><option>None</option>{NEXT_DENS.map((n: Den)=><option key={n} value={n}>{n}</option>)}</select></label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={wordDot} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setWordDot(!!e.target.checked)} /> dotted</label>
            <label className="col-span-2 flex items-center gap-1">Scale<select className="border" value={scale} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setScale(e.target.value)}>{Object.keys(SCALES).map((s: string)=><option key={s} value={s}>{s}</option>)}<option value="Custom">Custom</option></select></label>
            {scale==='Custom' && <label className="col-span-2 flex items-center gap-1">Notes<input className="border" value={customScale} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setCustomScale(e.target.value)} placeholder="C,C#,D" /></label>}
            <label className="col-span-2 flex items-center gap-1">Octave<input className="border w-12" type="number" min={4} max={7} value={morseOct} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setMorseOct(parseInt(e.target.value))} /></label>
          </div>
          <button className="border px-2 mt-2" onClick={addMorse}>Add Morse</button>
        </div>
      </div>
    </div>
  );
};

export default App;
