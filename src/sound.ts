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

export function playTone(midi: number, dur = 0.3) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  osc.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gain.gain.linearRampToValueAtTime(0.001, now + dur);
  osc.stop(now + dur + 0.05);
}
