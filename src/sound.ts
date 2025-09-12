import unmute from 'unmute-ios-audio';

let audioCtx: AudioContext | undefined;

// Call once at module load to setup iOS audio unlock
unmute();

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTone(midi: number, dur = 0.15) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  osc.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.setValueAtTime(0.2, now + dur);
  gain.gain.linearRampToValueAtTime(0.0001, now + dur + 0.01);
  osc.stop(now + dur + 0.02);
}

export function playFreqs(freqs: number[], dur = 0.15) {
  const ctx = getAudioContext();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  freqs.forEach(f => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  });
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.setValueAtTime(0.2, now + dur);
  gain.gain.linearRampToValueAtTime(0.0001, now + dur + 0.01);
}
