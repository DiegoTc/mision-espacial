import { afterEach, describe, expect, it, vi } from 'vitest';
import { LEVEL_PRAISE, SpeechService, missionPraise, selectSpanishVoice } from '../src/systems/SpeechService';
class Utterance {
  lang = ''; volume = 1; rate = 1; pitch = 1; voice?: SpeechSynthesisVoice;
  onend: (() => void) | null = null; onerror: (() => void) | null = null; onstart: (() => void) | null = null;
  constructor(public text: string) {}
}
const voice = (lang: string, localService = true) => ({ lang, localService }) as SpeechSynthesisVoice;
function mockSpeech(voices = [voice('es-MX')]) {
  const synth = { getVoices: vi.fn(() => voices), cancel: vi.fn(), resume: vi.fn(), speak: vi.fn((u: Utterance) => u.onstart?.()) };
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance); vi.stubGlobal('speechSynthesis', synth); return synth;
}
afterEach(() => vi.unstubAllGlobals());
describe('personalized Spanish speech', () => {
  it('uses the exact spoken name for the first praise and never the display name', () => {
    const synth = mockSpeech(); const service = new SpeechService(() => false); service.speak(missionPraise(0));
    const u = synth.speak.mock.calls[0][0]; expect(u.text).toBe('Fran Santiago Fin, lo lograste.'); expect(u.lang).toBe('es-MX'); expect(u.volume).toBe(0.65);
    expect(service.lastSpokenText).toBe(u.text);
    for (let i = 0; i < 6; i++) { expect(missionPraise(i)).toContain('Fran Santiago Fin'); expect(missionPraise(i)).not.toContain('FsantigoEV'); }
    expect(new Set(Array.from({ length: 5 }, (_, i) => missionPraise(i))).size).toBe(5);
  });
  it('prefers es-HN and falls back through Spanish languages', () => {
    expect(selectSpanishVoice([voice('en-US'), voice('es-ES'), voice('es-MX'), voice('es-HN')])?.lang).toBe('es-HN');
    expect(selectSpanishVoice([voice('es-ES'), voice('es-US')])?.lang).toBe('es-ES');
    expect(selectSpanishVoice([voice('es-AR')])?.lang).toBe('es-AR'); expect(selectSpanishVoice([voice('en-US')])).toBeUndefined();
  });
  it('cancels previous speech and its remaining sequence when a new phrase begins', () => {
    const synth = mockSpeech(); const service = new SpeechService(() => false); service.speakSequence(LEVEL_PRAISE);
    const oldEnd = synth.speak.mock.calls[0][0].onend!; service.speak('Muy bien, Fran Santiago Fin.'); oldEnd();
    expect(synth.cancel).toHaveBeenCalledTimes(2); expect(synth.speak).toHaveBeenCalledTimes(2);
  });
  it('speaks the final phrases sequentially and respects mute', () => {
    const synth = mockSpeech(); let muted = false; const service = new SpeechService(() => muted); service.speakSequence(LEVEL_PRAISE);
    expect(synth.speak).toHaveBeenCalledTimes(1); synth.speak.mock.calls[0][0].onend?.();
    expect(synth.speak.mock.calls[1][0].text).toBe('Tu próxima aventura te espera en la Luna.');
    muted = true; service.cancel(); service.speak('No debe sonar'); expect(synth.speak).toHaveBeenCalledTimes(2);
  });
  it('loads voices again for later phrases and safely handles missing browser support', () => {
    const synth = mockSpeech([]); const service = new SpeechService(() => false); service.speak('Uno'); expect(synth.speak.mock.calls[0][0].lang).toBe('es-HN');
    synth.getVoices.mockReturnValue([voice('es-HN')]); service.speak('Dos'); expect(synth.speak.mock.calls[1][0].voice?.lang).toBe('es-HN');
    vi.stubGlobal('speechSynthesis', undefined); expect(() => service.speak('Tres')).not.toThrow();
  });
});
