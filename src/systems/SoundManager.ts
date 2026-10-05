import { speech } from './SpeechService';
import { progress } from './ProgressManager';
type Sound = 'jump' | 'pickup' | 'mission' | 'door' | 'launch';
class SoundManager {
  private context?: AudioContext;
  unlock() { this.context ??= new AudioContext(); void this.context.resume().catch(() => undefined); }
  toggle() { progress.data.settings.muted = !progress.data.settings.muted; progress.save(); if (progress.data.settings.muted) speech.cancel(); if (!progress.data.settings.muted) this.unlock(); }
  play(kind: Sound) {
    if (progress.data.settings.muted) return;
    this.unlock();
    const ctx = this.context!;
    const notes: Record<Sound, number[]> = { jump: [280, 480], pickup: [620, 830], mission: [523, 659, 784], door: [160, 220, 330], launch: [80, 100, 140, 220, 330, 440] };
    notes[kind].forEach((frequency, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = kind === 'launch' ? 'sawtooth' : 'sine'; osc.frequency.value = frequency;
      const time = ctx.currentTime + i * (kind === 'launch' ? 0.18 : 0.075);
      gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(kind === 'launch' ? 0.05 : 0.09, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(time); osc.stop(time + 0.24);
    });
  }
}
export const sound = new SoundManager();
