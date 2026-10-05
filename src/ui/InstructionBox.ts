import { escapeHtml, ui } from './Overlay';
export class InstructionBox {
  set(text: string, label: string, keyword = '') {
    const title = ui.querySelector('#instruction');
    if (title) { title.textContent = text; title.setAttribute('data-keyword', keyword); }
    const tag = ui.querySelector('#mission-label'); if (tag) tag.textContent = label;
  }
  help() {
    const title = ui.querySelector('#instruction'); if (!title) return;
    const text = title.textContent || ''; const key = title.getAttribute('data-keyword') || text;
    title.innerHTML = escapeHtml(text).replace(escapeHtml(key), `<mark>${escapeHtml(key)}</mark>`);
    title.closest('.mission-card')?.classList.remove('help-pulse');
    requestAnimationFrame(() => title.closest('.mission-card')?.classList.add('help-pulse'));
    window.setTimeout(() => { if (title.isConnected && title.textContent === text) title.textContent = text; }, 3500);
  }
  feedback(text: string) { const el = ui.querySelector('#feedback'); if (el) el.textContent = text; }
}
