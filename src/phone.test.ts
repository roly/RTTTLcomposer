import { describe, it, expect } from 'vitest';
import {
  dtmfToEvents,
  blueBoxToEvents,
  redBoxCoinToEvents,
  tone2600ToEvents,
  modemNoiseToEvents,
  MODEM_TEMPO,
} from './phone';

describe('phone tone helpers', () => {
  it('produces two notes for a single DTMF key', () => {
    const events = dtmfToEvents('1');
    expect(events).toHaveLength(2);
    expect(events[0].isRest).toBe(false);
    expect(events[1].isRest).toBe(false);
  });

  it('inserts a rest between DTMF keys', () => {
    const events = dtmfToEvents('12');
    expect(events).toHaveLength(5);
    expect(events[2].isRest).toBe(true);
  });

  it('handles blue box tokens', () => {
    const events = blueBoxToEvents('KP1ST');
    // three tokens -> 3 pairs of notes + two rests
    expect(events).toHaveLength(8);
  });

  it('creates bursts for red box coin values', () => {
    const events = redBoxCoinToEvents(10);
    // 10c -> two bursts -> pair + rest + pair
    expect(events).toHaveLength(5);
    expect(events[2].isRest).toBe(true);
  });

  it('generates single event for 2600 Hz tone', () => {
    const events = tone2600ToEvents();
    expect(events).toHaveLength(1);
    expect(events[0].isRest).toBe(false);
  });

  it('generates modem noise events', () => {
    const events = modemNoiseToEvents();
    const expected = Math.round((MODEM_TEMPO * 5) / 7.5);
    expect(events.length).toBeGreaterThan(expected - 5);
    expect(events.every(e => !e.isRest)).toBe(true);
  });
});

