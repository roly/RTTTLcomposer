import React, { useState, useEffect, useRef, useCallback } from 'react';

import { Den, NoteEvent, KeyDef, KEYS, TICKS_PER_QUARTER, DUR_STATES, ticksFromDen } from "./music";
import { playTone, getAudioContext } from "./sound";
import TopControls from "./components/TopControls";
import PianoRoll from "./components/PianoRoll";
import InsertControls from "./components/InsertControls";
import RTTTLControls from "./components/RTTTLControls";
import MorseControls from "./components/MorseControls";
import MorseDecodeControls from "./components/MorseDecodeControls";
import SpeechControls from "./components/SpeechControls";
import InterleaveControls from "./components/InterleaveControls";
import PhoneControls from "./components/PhoneControls";
import { parseRTTTL, generateRTTTL } from "./rtttl";


const App:React.FC = () => {
  // Theme
  const [dark,setDark] = useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(()=>{
    document.documentElement.classList.toggle('dark',dark);
  },[dark]);

  // State
  const [name,setName] = useState('Tune');
  const [bpm,setBpm] = useState(170);
  const [defDen,setDefDen] = useState<Den>(8);
  const [defOct,setDefOct] = useState(5);
  const [notes,setNotes] = useState<NoteEvent[]>([]);
  const [selected,setSelected] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<NoteEvent | null>(null);
  const [clipboard,setClipboard] = useState<Omit<NoteEvent,'id'>[]>([]);
  const [cursorTick,setCursorTick] = useState(0);
  const cursorRef = useRef(0);
  useEffect(()=>{ cursorRef.current = cursorTick; },[cursorTick]);
  const pressedKeyRef = useRef<KeyDef | null>(null);
  const updateCursor = (tick:number) => { cursorRef.current = tick; setCursorTick(tick); };
  const [nextLen,setNextLen] = useState<Den>(8);
  const [nextDot,setNextDot] = useState(false);
  const [keyboardMode,setKeyboardMode] = useState(false);
  const [realtime,setRealtime] = useState(false);
  const [playing,setPlaying] = useState(false);
  const [playTick,setPlayTick] = useState(0);
  const [loop,setLoop] = useState(false);
  const [rtttl,setRtttl] = useState('Tune:d=8,o=5,b=170:');
  const skipParseRef = useRef(false);
  const [extraTab, setExtraTab] = useState<'morse'|'speech'|'interleave'|'decode'|'phone'>('morse');

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
    setRtttl(generateRTTTL(name,defDen,defOct,bpm,notes));
  },[name,defDen,defOct,bpm,notes]);

  useEffect(()=>{
    if(skipParseRef.current){ skipParseRef.current=false; return; }
    try{
      const song = parseRTTTL(rtttl, defDen, defOct, bpm);
      clearTimers();
      setPlaying(false);
      setName(song.name); setDefDen(song.defDen); setDefOct(song.defOct); setBpm(song.bpm); setNotes(song.notes);
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
    if(realtime){
      playTone(k.midi,0.2);
      pressedKeyRef.current = k;
    } else {
      insertEvent({id:crypto.randomUUID(),isRest:false,keyIndex:k.index,note:k.name,octave:k.octave,durationDen:nextLen,dotted:nextDot});
      playTone(k.midi,0.2);
    }
  }

  // Pause insert
  function insertRest(){
    insertEvent({id:crypto.randomUUID(),isRest:true,durationDen:nextLen,dotted:nextDot});
  }

  useEffect(()=>{
    if(!keyboardMode){
      setRealtime(false);
      pressedKeyRef.current = null;
    }
  },[keyboardMode]);

  useEffect(()=>{
    if(!realtime || !keyboardMode){
      pressedKeyRef.current = null;
      return;
    }
    const intervalMs = ticksFromDen(nextLen,nextDot) * tickSec * 1000;
    const id = window.setInterval(()=>{
      const k = pressedKeyRef.current;
      if(k){
        insertEvent({id:crypto.randomUUID(),isRest:false,keyIndex:k.index,note:k.name,octave:k.octave,durationDen:nextLen,dotted:nextDot});
        pressedKeyRef.current = null;
      }else{
        insertRest();
      }
    }, intervalMs);
    return ()=>clearInterval(id);
  },[realtime,keyboardMode,nextLen,nextDot,tickSec]);

  // Clear
  function clearAll(){
    setNotes([]);
    setSelected(new Set());
    setLastSelected(null);
    cursorRef.current = 0;
    setCursorTick(0);
    setPlayTick(0);
  }

  // Selection toggle
  function toggleSelect(id:string){
    const s = new Set(selected);
    let last = lastSelected;
    if(s.has(id)){
      s.delete(id);
      if(lastSelected?.id === id){
        last = s.size ? notes.find(n => s.has(n.id)) ?? null : null;
      }
    } else {
      s.add(id);
      last = notes.find(n => n.id === id) ?? null;
    }
    setSelected(s);
    setLastSelected(last);
  }

  function setSelection(ids:string[]){
    const s = new Set(ids);
    setSelected(s);
    let last: NoteEvent | null = null;
    for(let i=notes.length-1;i>=0;i--){
      const n = notes[i];
      if(s.has(n.id)){ last = n; break; }
    }
    setLastSelected(last);
  }

  function selectAll(){
    setSelection(notes.map(n=>n.id));
  }

  function deselectAll(){
    setSelection([]);
  }

  // Copy/Cut/Paste/Delete
  function copySel(){
    const items = notes.filter((n: NoteEvent)=>selected.has(n.id)).map(({id,...rest}: NoteEvent & {id: string})=>rest);
    setClipboard(items);
  }
  function cutSel(){ copySel(); delSel(); }
  function delSel(){
    setNotes(notes.filter((n: NoteEvent)=>!selected.has(n.id)));
    setSelected(new Set());
    setLastSelected(null);
  }
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

  const moveSelectedPitch = useCallback((d:number)=>{
    setNotes(prev => {
      const newNotes = prev.map((n: NoteEvent)=>{
        if(!selected.has(n.id) || n.isRest) return n;
        const ni = n.keyIndex! + d;
        if(ni<0 || ni>=KEYS.length) return n;
        return {...n,keyIndex:ni,note:KEYS[ni].name,octave:KEYS[ni].octave};
      });
      return newNotes.every((n,i)=>!selected.has(prev[i].id) || prev[i].isRest || n.keyIndex!==prev[i].keyIndex) ? newNotes : prev;
    });
  },[selected]);

  const adjustSelectedDuration = useCallback((dir:number)=>{
    setNotes(prev => {
      const newNotes = prev.map((n: NoteEvent)=>{
        if(!selected.has(n.id)) return n;
        const idx = DUR_STATES.findIndex(d=>d.den===n.durationDen && !!d.dotted===!!n.dotted);
        const ni = idx + dir;
        if(ni<0 || ni>=DUR_STATES.length) return n;
        const st = DUR_STATES[ni];
        return {...n,durationDen:st.den as Den,dotted:st.dotted};
      });
      return newNotes.every((n,i)=>!selected.has(prev[i].id) || n.durationDen!==prev[i].durationDen || n.dotted!==prev[i].dotted) ? newNotes : prev;
    });
  },[selected]);

  function reverseNotes(){
    setNotes(prev => {
      if(selected.size){
        const sel = prev.filter(n => selected.has(n.id)).reverse();
        return prev.map(n => selected.has(n.id) ? sel.shift()! : n);
      }
      return [...prev].reverse();
    });
    if(!selected.size){
      setSelected(new Set());
      setLastSelected(null);
    }
  }

  function flipHorizontal(){
    setNotes(prev => prev.map(n => {
      if(selected.size && !selected.has(n.id)) return n;
      if(n.isRest) return n;
      const ni = KEYS.length - 1 - n.keyIndex!;
      return {...n,keyIndex:ni,note:KEYS[ni].name,octave:KEYS[ni].octave};
    }));
    if(!selected.size){
      setSelected(new Set());
      setLastSelected(null);
    }
  }

  function squashRests(){
    setNotes(prev => {
      const res: NoteEvent[] = [];
      for(let i=0;i<prev.length;i++){
        const n = prev[i];
        if(!n.isRest){ res.push(n); continue; }
        // sum ticks for consecutive rests
        let totalTicks = 0;
        let j = i;
        while(j<prev.length && prev[j].isRest){
          totalTicks += ticksFromDen(prev[j].durationDen, prev[j].dotted);
          j++;
        }
        // convert summed ticks back into note durations
        const states = [...DUR_STATES]
          .map(s => ({...s, ticks: ticksFromDen(s.den as Den, s.dotted)}))
          .sort((a,b) => b.ticks - a.ticks);
        const memo = new Map<number, {den:Den,dotted?:boolean}[] | null>();
        function build(rem:number): {den:Den,dotted?:boolean}[] | null {
          if(rem===0) return [];
          if(memo.has(rem)) return memo.get(rem)!;
          for(const st of states){
            if(st.ticks <= rem){
              const tail = build(rem - st.ticks);
              if(tail){
                const resArr = [{den:st.den as Den, dotted:st.dotted}, ...tail];
                memo.set(rem,resArr);
                return resArr;
              }
            }
          }
          memo.set(rem,null);
          return null;
        }
        const combo = build(totalTicks) ?? [];
        if(combo.length){
          combo.forEach(c => res.push({id:crypto.randomUUID(), isRest:true, durationDen:c.den, dotted:c.dotted}));
        }else{
          // fallback: keep original rests if conversion fails
          for(let k=i;k<j;k++) res.push(prev[k]);
        }
        i = j-1;
      }
      return res;
    });
    setSelected(new Set());
    setLastSelected(null);
  }

  // Arrow key etc
  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if(e.key===' ' && keyboardMode){
        e.preventDefault();
        if(realtime){
          pressedKeyRef.current = null;
        }else{
          insertRest();
        }
      }
      if(keyboardMode){
        const map = 'qwertyuiop[]';
        const idx = map.indexOf(e.key.toLowerCase());
        if(idx>=0){
          e.preventDefault();
          const base = KEYS.findIndex(k=>k.name==='C' && k.octave===5);
          const key = KEYS[base+idx];
          if(key) onKeyPress(key);
        }
      }
      if(e.key==='Enter' && e.shiftKey){ e.preventDefault(); togglePlay(); }
      if((e.key==='a'||e.key==='A') && (e.metaKey||e.ctrlKey)){
        e.preventDefault();
        if(e.shiftKey){ deselectAll(); } else { selectAll(); }
      }
      if(e.key==='Escape'){ deselectAll(); }
      if(selected.size){
        if(e.key==='ArrowLeft'){ moveSelectedPitch(-1); }
        if(e.key==='ArrowRight'){ moveSelectedPitch(1); }
        if(e.key==='ArrowUp' && e.shiftKey){ adjustSelectedDuration(1); }
        if(e.key==='ArrowDown' && e.shiftKey){ adjustSelectedDuration(-1); }
        if(e.key==='Delete' || e.key==='Backspace'){ delSel(); }
        if((e.key==='c'||e.key==='C') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); copySel(); }
        if((e.key==='x'||e.key==='X') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); cutSel(); }
        if((e.key==='v'||e.key==='V') && (e.metaKey||e.ctrlKey)){ e.preventDefault(); pasteClip(); }
      } else {
        if(e.key==='ArrowUp'){ e.preventDefault(); const base = cursorRef.current ?? 0; const nt = Math.max(0,base-ticksFromDen(nextLen,nextDot)); cursorRef.current = nt; setCursorTick(nt); }
        if(e.key==='ArrowDown'){ e.preventDefault(); const base = cursorRef.current ?? 0; const nt = Math.min(base+ticksFromDen(nextLen,nextDot),totalTicks); cursorRef.current = nt; setCursorTick(nt); }
      }
    }
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
  },[selected,notes,cursorTick,nextLen,nextDot,keyboardMode,realtime,clipboard,noteWithTiming,totalTicks,selectAll,deselectAll,moveSelectedPitch,adjustSelectedDuration]);

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

  function interleaveRTTTL(txt:string){
    try{
      const song = parseRTTTL(txt, defDen, defOct, bpm);
      setNotes(prev => {
        const result: NoteEvent[] = [];
        const max = Math.max(prev.length, song.notes.length);
        for(let i=0;i<max;i++){
          if(i<prev.length) result.push(prev[i]);
          if(i<song.notes.length) result.push(song.notes[i]);
        }
        return result;
      });
      setSelected(new Set());
      setLastSelected(null);
    }catch(err){
      // ignore parse errors
    }
  }

  // Dev self-test
  useEffect(()=>{
    console.assert(DUR_STATES.length===12,'duration states length');
    const rt = `${name}:d=${defDen},o=${defOct},b=${bpm}:`;
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
          defOct={defOct}
          setDefOct={setDefOct}
          notesLength={notes.length}
          totalTicks={totalTicks}
          lengthSec={totalTicks*tickSec}
          selectedSize={selected.size}
          selectAll={selectAll}
          deselectAll={deselectAll}
          copySel={copySel}
          cutSel={cutSel}
          pasteClip={pasteClip}
          delSel={delSel}
          clearAll={clearAll}
          clipboardLength={clipboard.length}
          dark={dark}
          setDark={setDark}
          lastSelected={lastSelected}
          reverseNotes={reverseNotes}
          flipHorizontal={flipHorizontal}
          squashRests={squashRests}
        />

      {/* Piano roll */}
      <PianoRoll
        keys={KEYS}
        noteWithTiming={noteWithTiming}
        totalTicks={totalTicks}
        selected={selected}
        toggleSelect={toggleSelect}
        selectRange={setSelection}
        cursorTick={cursorTick}
        setCursorTick={updateCursor}
        playing={playing}
        playTick={playTick}
        onKeyPress={onKeyPress}
        insertRest={insertRest}
      />

      {/* Under keyboard toolbar */}
      <InsertControls
        nextLen={nextLen}
        setNextLen={setNextLen}
        nextDot={nextDot}
        setNextDot={setNextDot}
        goToStart={goToStart}
        togglePlay={togglePlay}
        goToEnd={goToEnd}
        loop={loop}
        setLoop={setLoop}
        playing={playing}
        keyboardMode={keyboardMode}
        setKeyboardMode={setKeyboardMode}
        realtime={realtime}
        setRealtime={setRealtime}
        selectedSize={selected.size}
        moveSelectedPitch={moveSelectedPitch}
        adjustSelectedDuration={adjustSelectedDuration}
      />

      {/* Bottom panels */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <RTTTLControls
          rtttl={rtttl}
          setRtttl={setRtttl}
        />
        <div className="flex-1 md:w-1/2 flex flex-col md:border-l mt-2 md:mt-0">
          <div className="flex gap-2 border-b px-2">
            <button
              className={`px-2 ${extraTab==='morse' ? 'font-bold border-b-2' : ''}`}
              onClick={()=>setExtraTab('morse')}
            >Morse</button>
            <button
              className={`px-2 ${extraTab==='speech' ? 'font-bold border-b-2' : ''}`}
              onClick={()=>setExtraTab('speech')}
            >Speech</button>
            <button
              className={`px-2 ${extraTab==='interleave' ? 'font-bold border-b-2' : ''}`}
              onClick={()=>setExtraTab('interleave')}
            >Interleave</button>
            <button
              className={`px-2 ${extraTab==='decode' ? 'font-bold border-b-2' : ''}`}
              onClick={()=>setExtraTab('decode')}
            >Morse Decode</button>
            <button
              className={`px-2 ${extraTab==='phone' ? 'font-bold border-b-2' : ''}`}
              onClick={()=>setExtraTab('phone')}
            >Phone</button>
          </div>
          <div className="p-2 flex-1 overflow-auto">
            {extraTab==='morse' && (
              <MorseControls onAdd={(events)=>events.forEach(insertEvent)} />
            )}
            {extraTab==='speech' && (
              <SpeechControls onAdd={(events)=>events.forEach(insertEvent)} />
            )}
            {extraTab==='interleave' && (
              <InterleaveControls onInterleave={interleaveRTTTL} />
            )}
            {extraTab==='decode' && (
              <MorseDecodeControls />
            )}
            {extraTab==='phone' && (
              <PhoneControls onAdd={(events)=>events.forEach(insertEvent)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
