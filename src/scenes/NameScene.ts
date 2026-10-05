import Phaser from 'phaser';
import { progress } from '../systems/ProgressManager';
import { sound } from '../systems/SoundManager';
import { speech } from '../systems/SpeechService';
import { PLAYER_DISPLAY_NAME } from '../data/player';
import { ui, brand, muteButton } from '../ui/Overlay';
import { drawSky, drawBase } from './WorldArt';
export class NameScene extends Phaser.Scene {
  constructor() { super('Name'); }
  create() {
    speech.cancel(); drawSky(this); drawBase(this, 780, 440, 360);
    for (let x = 0; x < 1280; x += 48) this.add.image(x, 638, 'ground').setOrigin(0);
    this.add.image(986, 538, 'rocket').setScale(1.5); this.add.image(855, 609, 'player').setScale(1.8);
    this.add.text(958, 365, 'BASE 01', { fontFamily: 'monospace', fontSize: '15px', color: '#a5d7d2', letterSpacing: 3 });
    const returning = progress.hasProgress;
    ui.innerHTML = `<div class="topbar">${brand()}<button id="mute" class="quiet-button"></button></div>
      <section class="welcome journey-welcome"><div class="eyebrow">UNA PEQUEÑA GRAN AVENTURA</div><h1>${returning ? 'Tu viaje<br>continúa.' : 'Tu misión.<br>Las estrellas.'}</h1>
      <p class="player-greeting">¡Hola, ${PLAYER_DISPLAY_NAME}!</p><p>Un cohete por reparar.<br>Un universo por descubrir.</p>
      ${returning ? `<div class="journey-stats">★ ${progress.data.player.stars} estrellas · ${progress.data.player.coins} monedas</div><button id="continue" class="primary">CONTINUAR VIAJE <span>↵</span></button><button id="new-game" class="secondary">NUEVA PARTIDA</button>` : '<button id="begin" class="primary">COMENZAR <span>↵</span></button>'}
      <div class="welcome-note">Para exploradores con teclado <span>✦</span> Nivel 01</div></section><div class="planet-tag">DESTINO<br><strong>La Luna</strong></div><div id="modal-root"></div>`;
    muteButton();
    const start = (continueJourney: boolean) => { speech.cancel(); sound.unlock(); if (!continueJourney) progress.start(); this.scene.start(continueJourney ? progress.continueCampaign() : 'Game'); };
    if (returning) {
      ui.querySelector<HTMLButtonElement>('#continue')!.onclick = () => start(true);
      ui.querySelector<HTMLButtonElement>('#new-game')!.onclick = () => this.confirmNewGame();
      ui.querySelector<HTMLButtonElement>('#continue')!.focus();
    } else { ui.querySelector<HTMLButtonElement>('#begin')!.onclick = () => start(false); ui.querySelector<HTMLButtonElement>('#begin')!.focus(); }
  }
  private confirmNewGame() {
    speech.cancel();
    ui.querySelector('#modal-root')!.innerHTML = `<div class="scrim"><section class="pause-card" role="dialog" aria-modal="true" aria-labelledby="reset-title"><span class="eyebrow">UN NUEVO COMIENZO</span><h2 id="reset-title">¿Empezar de nuevo?</h2><p>Se borrarán tu viaje, estrellas,<br>monedas y estadísticas.</p><button id="keep" class="primary">SEGUIR MI VIAJE</button><button id="reset" class="secondary">BORRAR Y COMENZAR</button></section></div>`;
    const root = ui.querySelector<HTMLElement>('#modal-root')!;
    const keep = () => { root.onkeydown = null; root.innerHTML = ''; ui.querySelector<HTMLButtonElement>('#new-game')!.focus(); };
    ui.querySelector<HTMLButtonElement>('#keep')!.onclick = keep;
    ui.querySelector<HTMLButtonElement>('#reset')!.onclick = () => { progress.newGame(); sound.unlock(); this.scene.start('Game'); };
    ui.querySelector<HTMLButtonElement>('#keep')!.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); keep(); }
      if (event.key === 'Tab') { event.preventDefault(); const next = document.activeElement?.id === 'keep' ? '#reset' : '#keep'; ui.querySelector<HTMLButtonElement>(next)?.focus(); }
    };
    root.onkeydown = trap;
    const cleanup = () => { root.onkeydown = null; };
    ui.querySelector<HTMLButtonElement>('#keep')!.addEventListener('click', cleanup, { once: true });
    this.events.once('shutdown', cleanup);
  }
}
