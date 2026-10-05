import Phaser from 'phaser';
import { REWARDS } from '../data/worlds';
import { ui, brand, muteButton } from '../ui/Overlay';
import { progress } from '../systems/ProgressManager';
import { sound } from '../systems/SoundManager';
import { PLAYER_DISPLAY_NAME } from '../data/player';
import { speech } from '../systems/SpeechService';
import { drawSky } from './WorldArt';
export class WinScene extends Phaser.Scene {
  constructor() { super('Win'); }
  create(data: { world?: string }) {
    const lunar = data.world === 'moon'; drawSky(this); progress.pause();
    this.add.particles(640, 240, 'spark', { x: { min: -470, max: 470 }, y: { min: -200, max: 200 }, speedY: { min: 20, max: 65 }, lifespan: 3000, frequency: 170, tint: [0xf3ca78, 0x9be4ce], scale: { start: 1.1, end: 0 } });
    ui.innerHTML = `<div class="topbar">${brand()}<button id="mute" class="quiet-button"></button></div><section class="win-card"><div class="medal">✦</div><div class="eyebrow">${lunar ? 'LA LUNA' : 'BASE TERRESTRE'} · COMPLETADA</div><h1>${lunar ? '¡MISIÓN LUNAR<br>COMPLETADA!' : '¡LO LOGRASTE!'}</h1><p>${PLAYER_DISPLAY_NAME} completó la misión.</p><p class="reward-toast">🪙 +${REWARDS.levelCoins}</p><div class="next-mission"><span class="moon-icon">${lunar ? '🚀' : '🌙'}</span><div><span class="eyebrow">${lunar ? 'TU NAVE TE ESPERA' : '¡NUEVO DESTINO DESBLOQUEADO!'}</span><h3>${lunar ? 'Regresa a la nave' : 'LA LUNA'}</h3></div></div><button id="next" class="primary">${lunar ? 'REGRESAR A LA NAVE' : 'VER EL SISTEMA SOLAR'} <span>↵</span></button></section>`;
    muteButton(); speech.speakSequence(lunar ? ['Fran Santiago Fin, lo lograste.', 'Completaste tu misión en la Luna.'] : ['Fran Santiago Fin, completaste tu primera misión espacial.', 'Fran Santiago Fin, desbloqueaste la Luna.', 'Tu próxima aventura te espera en la Luna.']);
    let leaving = false;
    const next = () => { if (leaving) return; leaving = true; speech.cancel(); sound.unlock(); if (lunar) { progress.beginTrip('moon', 'earth', 'return'); this.scene.start('Ship'); } else this.scene.start('SolarSystem'); };
    ui.querySelector<HTMLButtonElement>('#next')!.onclick = next;
    this.input.keyboard!.once('keydown-ENTER', next);
    this.events.once('shutdown', () => this.input.keyboard!.off('keydown-ENTER', next));
  }
}
