import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { progress } from '../systems/ProgressManager';
import { speech, missionPraise } from '../systems/SpeechService';
import { sound } from '../systems/SoundManager';
import { ui, brand, footer, muteButton } from '../ui/Overlay';
import { InstructionBox } from '../ui/InstructionBox';
export abstract class AdventureScene extends Phaser.Scene {
  protected player!: Player;
  protected box = new InstructionBox();
  protected objects = new Map<string, Phaser.GameObjects.Image>();
  protected paused = false;
  protected instruction = '';
  protected hint = '';
  protected taskId = '';
  protected inventory = '';
  protected useQueued = false;
  protected enterQueued = false;
  protected savedX = 100;
  protected savedY = 570;
  protected carryImage!: Phaser.GameObjects.Image;
  protected setup(title: string, width: number, x: number, y: number) {
    this.paused = false; this.objects.clear(); this.useQueued = false; this.enterQueued = false;
    this.physics.world.setBounds(0, 0, width, 720); this.cameras.main.setBounds(0, 0, width, 720);
    const ground = this.physics.add.staticGroup();
    for (let px = 0; px < width; px += 48) ground.create(px, 600, 'ground').setOrigin(0).setTint(this.scene.key === 'Moon' ? 0xc6c4e7 : 0xffffff).refreshBody();
    this.player = new Player(this, x, y); this.savedX = x; this.savedY = y;
    this.physics.add.collider(this.player, ground); this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.carryImage = this.add.image(x, y, 'battery').setDepth(8).setVisible(false);
    ui.innerHTML = `<div class="topbar">${brand()}<button id="mute" class="quiet-button"></button></div><div class="hud"><section class="mission-card"><div id="mission-label" class="eyebrow">${title}</div><h2 id="instruction"></h2><div id="feedback" aria-live="polite"></div></section><div class="inventory" id="inventory"></div></div>${footer()}<div id="modal-root"></div>`;
    muteButton(); this.updateInventory();
    const keyboard = this.input.keyboard!;
    const use = () => { this.useQueued = true; };
    const enter = () => { this.enterQueued = true; if (this.paused) this.togglePause(); };
    const help = () => { if (this.paused) return; const n = progress.taskHelp(this.taskId); this.box.help(); this.box.feedback(n < 2 ? this.hint : 'Escucha y vuelve a leer.'); if (n >= 2) speech.speak(this.instruction, () => progress.audioUsed(this.taskId)); };
    const pause = () => this.togglePause();
    keyboard.on('keydown-A', use); keyboard.on('keydown-ENTER', enter); keyboard.on('keydown-H', help); keyboard.on('keydown-ESC', pause);
    const leave = () => { this.savePosition(); progress.pause(); speech.cancel(); };
    const blur = () => { if (!this.paused) this.togglePause(); };
    window.addEventListener('pagehide', leave); window.addEventListener('blur', blur);
    this.time.addEvent({ delay: 3000, loop: true, callback: () => { this.savePosition(); progress.save(); } });
    this.events.once('shutdown', () => { leave(); keyboard.off('keydown-A', use); keyboard.off('keydown-ENTER', enter); keyboard.off('keydown-H', help); keyboard.off('keydown-ESC', pause); window.removeEventListener('pagehide', leave); window.removeEventListener('blur', blur); });
  }
  protected updateInventory() { const el = ui.querySelector('#inventory'); if (el) el.textContent = `${this.inventory ? 'Llevas una pieza · ' : ''}⭐ ${progress.data.player.stars}  🪙 ${progress.data.player.coins}`; }
  protected setTask(instruction: string, words: string[], hint: string, id: string, label: string) {
    this.instruction = instruction; this.hint = hint; this.taskId = id;
    progress.taskSeen(id, words); this.box.set(instruction, label, words.slice(-2).join(' ')); this.box.feedback(''); this.updateInventory();
  }
  protected object(id: string, x: number, y: number, texture: string, tint?: number, label?: string) {
    const image = this.add.image(x, y, texture).setDepth(2); if (tint !== undefined) image.setTint(tint);
    this.objects.set(id, image);
    if (label) image.setData('label', this.add.text(x, y - image.displayHeight / 2 - 25, label, { fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', backgroundColor: '#17233c', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(2));
    return image;
  }
  protected near(id: string) { const obj = this.objects.get(id); return !!obj && obj.visible && Math.abs(this.player.x - obj.x) < 75 && Math.abs(this.player.y - obj.y) < 105; }
  protected platform(x: number, y: number, tiles: number) {
    const group = this.physics.add.staticGroup(); for (let n = 0; n < tiles; n++) group.create(x + n * 48, y, 'platform').setOrigin(0).refreshBody(); this.physics.add.collider(this.player, group);
  }
  protected wrong() { progress.taskAttempt(this.taskId, false); this.box.feedback('Ese no es. Sigue buscando.'); }
  protected celebrate(text = '¡Lo lograste, FsantigoEV!') { sound.play('mission'); this.box.feedback(`${text}  ⭐ +1`); this.updateInventory(); speech.speak(missionPraise(progress.data.trips.reduce((n, t) => n + (t.completed ? t.missionIds.length : t.missionIndex), 0))); }
  protected togglePause() {
    this.paused = !this.paused;
    const modal = ui.querySelector('#modal-root'); if (!modal) return;
    if (this.paused) { this.physics.pause(); this.savePosition(); progress.pause(); speech.cancel(); modal.innerHTML = '<div class="scrim"><section class="pause-card"><h2>Tu nave te espera.</h2><p>Presiona Enter para seguir.</p><button class="primary" id="resume">CONTINUAR</button></section></div>'; ui.querySelector<HTMLButtonElement>('#resume')!.onclick = () => this.togglePause(); }
    else { modal.innerHTML = ''; this.physics.resume(); progress.resume(); this.useQueued = false; this.enterQueued = false; }
  }
  protected frame() {
    this.player.tick(!this.paused, false);
    this.carryImage.setVisible(!!this.inventory).setPosition(this.player.x + 25, this.player.y + 4);
    if ((this.player.body as Phaser.Physics.Arcade.Body).blocked.down) { this.savedX = this.player.x; this.savedY = this.player.y; }
  }
  protected abstract savePosition(): void;
}
