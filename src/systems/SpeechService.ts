import { PLAYER_SPOKEN_NAME } from '../data/player';
import { progress } from './ProgressManager';
const LANGUAGE_PRIORITY = ['es-HN', 'es-MX', 'es-ES', 'es-US'];
export function selectSpanishVoice(voices: SpeechSynthesisVoice[]) {
  const spanish = voices.filter(v => /^es(?:[-_]|$)/i.test(v.lang));
  for (const lang of LANGUAGE_PRIORITY) {
    const matches = spanish.filter(v => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
    if (matches.length) return matches.find(v => v.localService) ?? matches[0];
  }
  return spanish.find(v => v.localService) ?? spanish[0];
}
export function missionPraise(completedBefore: number) {
  const variants = [`${PLAYER_SPOKEN_NAME}, lo lograste.`, `Muy bien, ${PLAYER_SPOKEN_NAME}.`,
    `Excelente trabajo, ${PLAYER_SPOKEN_NAME}.`, `Misión completada, ${PLAYER_SPOKEN_NAME}.`, `${PLAYER_SPOKEN_NAME}, sigue así.`];
  return variants[completedBefore % variants.length];
}
export const LEVEL_PRAISE = [`${PLAYER_SPOKEN_NAME}, completaste tu primera misión espacial.`, 'Tu próxima aventura te espera en la Luna.'];
/** One utterance at a time. Starting any new phrase/sequence cancels the old sequence. */
export class SpeechService {
  private utterance?: SpeechSynthesisUtterance;
  private generation = 0;
  lastSpokenText = '';
  constructor(private isMuted: () => boolean = () => progress.data.settings.muted) {}
  get supported() { return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'; }
  cancel() {
    this.generation++;
    if (this.utterance) { this.utterance.onstart = null; this.utterance.onend = null; this.utterance.onerror = null; }
    this.utterance = undefined;
    if (this.supported) speechSynthesis.cancel();
  }
  speak(text: string, onStarted?: () => void) { this.speakSequence([text], onStarted); }
  speakSequence(phrases: string[], onStarted?: () => void) {
    this.cancel(); if (!this.supported || this.isMuted()) return;
    const generation = this.generation;
    const play = (index: number) => {
      if (generation !== this.generation || this.isMuted() || index >= phrases.length) return;
      const utterance = new SpeechSynthesisUtterance(phrases[index]); this.utterance = utterance;
      const voice = selectSpanishVoice(speechSynthesis.getVoices());
      utterance.lang = voice?.lang ?? 'es-HN'; if (voice) utterance.voice = voice;
      utterance.volume = 0.65; utterance.rate = 0.95; utterance.pitch = 1;
      utterance.onstart = () => { if (generation === this.generation) { this.lastSpokenText = utterance.text; if (onStarted) onStarted(); else progress.audioUsed(); } };
      utterance.onend = () => { if (generation !== this.generation) return; this.utterance = undefined; play(index + 1); };
      utterance.onerror = () => { if (generation === this.generation) this.utterance = undefined; }; // A missing voice must never stop gameplay.
      speechSynthesis.resume(); speechSynthesis.speak(utterance);
    };
    // getVoices is queried for every utterance, including after the browser loads voices asynchronously.
    play(0);
  }
}
export const speech = new SpeechService();
