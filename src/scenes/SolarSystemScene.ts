import Phaser from 'phaser';
import { worlds, worldStatus } from '../data/worlds';
import { progress } from '../systems/ProgressManager';
import { speech } from '../systems/SpeechService';
import { sound } from '../systems/SoundManager';
import { ui, brand, muteButton } from '../ui/Overlay';
import { drawSky } from './WorldArt';
export class SolarSystemScene extends Phaser.Scene {
  constructor() { super('SolarSystem'); }
  create() {
    speech.cancel(); progress.pause(); progress.data.scene = 'SolarSystem'; progress.save(); drawSky(this);
    ui.innerHTML = `<div class="topbar">${brand()}<button id="mute" class="quiet-button"></button></div><section class="solar-map"><div class="eyebrow">TU NAVE · TU AVENTURA</div><h1>El Sistema Solar</h1><p>Lee. Explora. Sigue las estrellas.</p><div class="map-rewards">⭐ ${progress.data.player.stars} · 🪙 ${progress.data.player.coins}</div><div class="world-grid">${worlds.map(w => {
      const status = worldStatus(w.id, progress.data.progress.completedWorlds, progress.data.progress.unlockedWorlds);
      return `<button class="world-card ${status}" data-world="${w.id}" aria-label="${w.name}: ${status === 'completed' ? 'Completado' : status === 'available' ? 'Disponible' : 'Bloqueado'}"><span class="world-planet" style="--planet:${w.color}">${w.icon}</span><strong>${w.id === 'asteroids' ? 'Cinturón de<br>Asteroides' : w.name}</strong><small>${status === 'completed' ? '✅ Completado' : status === 'available' ? '🚀 Disponible' : '🔒 Bloqueado'}</small></button>`;
    }).join('')}<div class="world-card secret"><span class="world-planet">?</span><strong>Mundo secreto</strong><small>🔒 Bloqueado</small></div></div><div id="map-hint" aria-live="polite">Elige un mundo para viajar.</div></section><footer><span>← → Elegir · Enter Viajar</span><span>Esc Inicio</span></footer>`;
    muteButton(); const cards = Array.from(ui.querySelectorAll<HTMLButtonElement>('[data-world]'));
    let selected = progress.data.progress.unlockedWorlds.includes('moon') ? 1 : 0;
    const focus = () => { cards.forEach((card, i) => card.classList.toggle('selected', i === selected)); cards[selected].focus(); };
    const travel = (index: number) => {
      const world = worlds[index]; selected = index; focus(); sound.unlock();
      if (!world.implemented || !progress.data.progress.unlockedWorlds.includes(world.id)) { ui.querySelector('#map-hint')!.textContent = 'Ese destino espera una próxima aventura.'; return; }
      if (world.id === 'earth') { progress.start(); this.scene.start('Game'); }
      else { progress.beginTrip('earth', 'moon', 'outbound'); this.scene.start('Ship'); }
    };
    cards.forEach((card, i) => { card.onclick = () => travel(i); }); focus();
    const right = (e: KeyboardEvent) => { e.preventDefault(); selected = (selected + 1) % cards.length; focus(); };
    const left = (e: KeyboardEvent) => { e.preventDefault(); selected = (selected + cards.length - 1) % cards.length; focus(); };
    const enter = (e: KeyboardEvent) => { e.preventDefault(); travel(selected); };
    const back = () => this.scene.start('Name');
    const keyboard = this.input.keyboard!; keyboard.on('keydown-RIGHT', right); keyboard.on('keydown-LEFT', left); keyboard.on('keydown-ENTER', enter); keyboard.on('keydown-ESC', back);
    this.events.once('shutdown', () => { keyboard.off('keydown-RIGHT', right); keyboard.off('keydown-LEFT', left); keyboard.off('keydown-ENTER', enter); keyboard.off('keydown-ESC', back); });
  }
}
