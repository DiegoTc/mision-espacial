import { progress } from '../systems/ProgressManager';
import { sound } from '../systems/SoundManager';
export const ui = document.querySelector<HTMLDivElement>('#ui')!;
export function escapeHtml(text: string) { return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }
export function muteButton() {
  const btn = ui.querySelector<HTMLButtonElement>('#mute');
  if (!btn) return;
  const render = () => { btn.textContent = progress.data.settings.muted ? '♪ Sonido: no' : '♪ Sonido: sí'; btn.setAttribute('aria-pressed', String(progress.data.settings.muted)); };
  render(); btn.onclick = () => { sound.toggle(); render(); btn.blur(); };
}
export function footer() { return '<footer><span><kbd>←</kbd> <kbd>→</kbd> Mover <kbd>S</kbd> Saltar <kbd>A</kbd> Usar</span><span><kbd>H</kbd> Ayuda <kbd>Esc</kbd> Pausa</span></footer>'; }
export function brand() { return '<div class="brand"><span class="brand-icon">✦</span> MISIÓN COHETE</div>'; }
