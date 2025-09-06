import React, { useState, useEffect, useRef } from 'react';

import { Den, NoteEvent, KeyDef, KEYS, TICKS_PER_QUARTER, DUR_STATES, ticksFromDen } from "./music";
import { playTone, getAudioContext } from "./sound";
import TopControls from "./components/TopControls";
import PianoRoll from "./components/PianoRoll";
import InsertControls from "./components/InsertControls";
import RTTTLControls from "./components/RTTTLControls";
import MorseControls from "./components/MorseControls";
import { parseRTTTL, generateRTTTL } from "./rtttl";


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
  const updateCursor = (tick:number) => { cursorRef.current = tick; setCursorTick(tick); };
  const [nextLen,setNextLen] = useState<Den>(4);
  const [nextDot,setNextDot] = useState(false);
  const [keyboardMode,setKeyboardMode] = useState(false);
  const [playing,setPlaying] = useState(false);
  const [playTick,setPlayTick] = useState(0);
  const [loop,setLoop] = useState(false);
  const [rtttl,setRtttl] = useState('');
  const skipParseRef = useRef(false);

  // Derived
  const noteWithTiming = notes.reduce<{ev:NoteEvent;startTick:number;durTicks:number}[]>((arr: {ev:NoteEvent;startTick:number;durTicks:number}[], ev: NoteEvent)=>{
    const start = arr.length? arr[arr.length-1].startTick + arr[arr.length-1].durTicks : 0;
    const dur = ticksFromDen(ev.durationDen,ev.dotted);
    arr.push({ev,startTick:start,durTicks:dur});
    return arr;
  },[]);
  const totalTicks = noteWithTiming.reduce((s: number, n: {ev:NoteEvent;startTick:number;durTicks:number})=>s+n.durTicks,0);
  const tickSec = 60 / bpm / TICKS_PER_QUARTER;

  useEffect(()=>{
    skipParseRef.current = true;
    setRtttl(generateRTTTL(name,defDen,bpm,notes));
  },[name,defDen,bpm,notes]);

  useEffect(()=>{
    if(skipParseRef.current){ skipParseRef.current=false; return; }
    try{
      const song = parseRTTTL(rtttl, defDen, bpm);
      clearTimers();
      setPlaying(false);
      setName(song.name); setDefDen(song.defDen); setBpm(song.bpm); setNotes(song.notes);
      cursorRef.current = 0; setCursorTick(0); setPlayTick(0);
    }catch(err){
      // ignore parse errors
    }
  },[rtttl]);


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
    getAudioContext();
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
  function goToStart(){
    clearTimers();
    setPlaying(false);
    cursorRef.current = 0;
    setCursorTick(0);
    setPlayTick(0);
  }

  function goToEnd(){
    clearTimers();
    setPlaying(false);
    cursorRef.current = totalTicks;
    setCursorTick(totalTicks);
    setPlayTick(totalTicks);
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
        <TopControls
          name={name}
          setName={setName}
          bpm={bpm}
          setBpm={setBpm}
          defDen={defDen}
          setDefDen={setDefDen}
          notesLength={notes.length}
          totalTicks={totalTicks}
          lengthSec={totalTicks*tickSec}
          selectedSize={selected.size}
          copySel={copySel}
          cutSel={cutSel}
          pasteClip={pasteClip}
          delSel={delSel}
          clipboardLength={clipboard.length}
          dark={dark}
          setDark={setDark}
          loop={loop}
          setLoop={setLoop}
          playing={playing}
          togglePlay={togglePlay}
          goToStart={goToStart}
          goToEnd={goToEnd}
        />

      {/* Piano roll */}
      <PianoRoll
        keys={KEYS}
        noteWithTiming={noteWithTiming}
        totalTicks={totalTicks}
        selected={selected}
        toggleSelect={toggleSelect}
        cursorTick={cursorTick}
        setCursorTick={updateCursor}
        playing={playing}
        playTick={playTick}
        onKeyPress={onKeyPress}
      />

      {/* Under keyboard toolbar */}
      <InsertControls
        nextLen={nextLen}
        setNextLen={setNextLen}
        nextDot={nextDot}
        setNextDot={setNextDot}
        insertRest={insertRest}
        clearAll={clearAll}
        keyboardMode={keyboardMode}
        setKeyboardMode={setKeyboardMode}
      />

      {/* Bottom panels */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <RTTTLControls
          rtttl={rtttl}
          setRtttl={setRtttl}
        />
        <MorseControls
          onAdd={(events)=>events.forEach(insertEvent)}
        />
      </div>
    </div>
  );
};

export default App;
