import Phaser from 'phaser';
import { progress } from '../systems/ProgressManager';
import { sound } from '../systems/SoundManager';
import { speech } from '../systems/SpeechService';
import { ui, brand, muteButton } from '../ui/Overlay';
import { drawSky } from './WorldArt';
export class TravelScene extends Phaser.Scene {
  constructor() { super('Travel'); }
  create() {
    if (!progress.data.currentTrip) { this.scene.start('SolarSystem'); return; }
    drawSky(this); speech.cancel(); progress.resume(); sound.play('launch');
    const trip = progress.data.currentTrip;
    ui.innerHTML = `<div class="topbar">${brand()}<button id="mute" class="quiet-button"></button></div><div class="travel-title">${trip.kind === 'outbound' ? '¡Rumbo a la Luna!' : trip.kind === 'launch' ? '¡Despegamos!' : 'Volvemos a nuestra ruta.'}</div>`; muteButton();
    const rocket = this.add.image(640, 570, 'rocket');
    this.add.particles(640, 660, 'spark', { speedX: { min: -80, max: 80 }, speedY: { min: 30, max: 150 }, lifespan: 800, frequency: 35, tint: [0xffde89, 0xe7eef7], scale: { start: 2.5, end: 0 } });
    this.tweens.add({ targets: rocket, y: -200, duration: 2800, ease: 'Cubic.easeIn', onComplete: () => { const next = progress.finishTrip(); this.scene.start(next, { world: 'earth' }); } });
  }
}
