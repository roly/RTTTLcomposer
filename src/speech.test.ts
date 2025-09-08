import { describe, it, expect } from 'vitest';
import { syllabify, vowelTier, speechToEvents } from './speech';
import { generateRTTTL } from './rtttl';

describe('syllabify', () => {
  it('splits words', () => {
    expect(syllabify('pineapple')).toEqual(['pi','nea','pple']);
  });
  it('handles no vowels', () => {
    expect(syllabify('brrr')).toEqual(['brrr']);
  });
});

describe('vowelTier', () => {
  it('maps vowels to tiers', () => {
    expect(vowelTier('u')).toBe(0);
    expect(vowelTier('o')).toBe(1);
    expect(vowelTier('a')).toBe(2);
    expect(vowelTier('e')).toBe(3);
    expect(vowelTier('i')).toBe(4);
    expect(vowelTier('y')).toBe(4);
    expect(vowelTier('x')).toBe(2);
  });
});

describe('speech to RTTTL', () => {
  const baseMidi = 69; // A4
  const phrases = [
    'Hak5 WiFi Pineapple',
    'Trust your technolust',
    'Hack the planet'
  ];
  const tempos = [120, 180];
  phrases.forEach(phrase => {
    tempos.forEach(bpm => {
      it(`${phrase} tempo ${bpm}`, () => {
        const events = speechToEvents(phrase, {baseMidi});
        const rtttl = generateRTTTL('Test',8,5,bpm,events);
        expect(rtttl).toMatchSnapshot();
      });
    });
  });
});
