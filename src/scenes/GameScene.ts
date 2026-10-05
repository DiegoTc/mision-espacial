import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { MissionManager, type ObjectKind } from '../systems/MissionManager';
import { progress } from '../systems/ProgressManager';
import { sound } from '../systems/SoundManager';
import { PLAYER_DISPLAY_NAME } from '../data/player';
import { speech, missionPraise } from '../systems/SpeechService';
import { missions } from '../data/missions';
import { InstructionBox } from '../ui/InstructionBox';
import { brand, footer, ui, escapeHtml, muteButton } from '../ui/Overlay';
import { drawSky, drawBase } from './WorldArt';
interface Interactive { id: string; kind: ObjectKind; sprite: Phaser.GameObjects.Image; active: boolean }
const WORLD_WIDTH = 3480;
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private objects: Interactive[] = [];
  private rules!: MissionManager;
  private instruction = new InstructionBox();
  private tutorial = 0;
  private pressed = new Set<string>();
  private paused = false;
  private launching = false;
  private doorBody?: Phaser.Physics.Arcade.Sprite;
  private proximity!: Phaser.GameObjects.Text;
  private rocketPiece!: Phaser.GameObjects.Rectangle;
  private rocketEngine!: Phaser.GameObjects.Image;
  private nearest?: Interactive;
  private feedbackUntil = 0;
  private safeX = 150;
  private safeY = 570;
  constructor() { super('Game'); }
  create() {
    this.pressed.clear(); this.rules = new MissionManager(); this.objects = []; this.tutorial = 0; this.paused = false; this.launching = false; this.feedbackUntil = 0;
    const checkpoint = progress.data.checkpoint;
    if (checkpoint) { this.rules = MissionManager.restore(checkpoint.rules) ?? this.rules; this.tutorial = checkpoint.tutorial; }
    this.safeX = checkpoint?.playerX ?? 150; this.safeY = checkpoint?.playerY ?? 570;
    drawSky(this);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 650);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 720);
    this.ground = this.physics.add.staticGroup(); this.obstacles = this.physics.add.staticGroup();
    for (let x = 0; x < WORLD_WIDTH; x += 48) {
      this.ground.create(x + 24, 624, 'ground'); this.add.image(x + 24, 672, 'ground');
    }
    drawBase(this, 50, 440, 400); drawBase(this, 570, 450, 300); drawBase(this, 1380, 393, 210); drawBase(this, 2450, 460, 300);
    this.add.text(77, 463, 'ESTACIÓN AURORA', { fontFamily: 'monospace', fontSize: '15px', color: '#9dc6c8', letterSpacing: 2 });
    this.sign(405, 'ALMACÉN →'); this.sign(1550, 'ZONA DE ENERGÍA →'); this.sign(2800, 'PLATAFORMA →');
    this.addObject('tutorial', 'tutorial-box', 'box-yellow', 320, 578);
    this.addObject('blue', 'box', 'box-blue', 610, 578);
    this.addObject('red', 'red-box', 'box-red', 735, 578);
    this.addObject('yellow', 'box', 'box-yellow', 860, 578);
    this.obstacles.create(1030, 562, 'stone');
    this.addObject('key', 'key', 'key', 1120, 523);
    this.addPlatform(1096, 554, 2);
    this.doorBody = this.obstacles.create(1470, 521, 'door') as Phaser.Physics.Arcade.Sprite;
    this.addObject('door', 'door', 'door', 1470, 521).sprite.setVisible(false);
    this.addObject('b1', 'battery', 'battery', 1700, 578);
    this.addPlatform(1840, 513, 3); this.addObject('b2', 'battery', 'battery', 1912, 482);
    this.addPlatform(2070, 440, 3); this.addObject('b3', 'battery', 'battery', 2142, 409);
    this.addPlatform(2220, 527, 2);
    this.addObject('engine', 'engine', 'engine', 2580, 578);
    const pad = this.add.graphics().setDepth(-1);
    pad.fillStyle(0x869da5).fillRect(2930, 588, 400, 12); pad.fillStyle(0xc8ad67).fillRect(2930, 588, 400, 4);
    for (let i = 0; i < 12; i++) pad.fillStyle(0x23364c).fillRect(2942 + i * 32, 592, 16, 8);
    this.addObject('rocket', 'rocket', 'rocket', 3110, 488);
    this.rocketPiece = this.add.rectangle(3110, 501, 48, 10, 0xf2bc5f).setVisible(false).setDepth(2);
    this.rocketEngine = this.add.image(3110, 526, 'engine').setScale(0.48).setVisible(false).setDepth(2);
    this.addObject('button', 'button', 'button', 3280, 562).sprite.setVisible(false);
    this.add.text(3018, 620, 'AURORA · 01', { fontFamily: 'monospace', fontSize: '15px', color: '#b8c4cb', letterSpacing: 4 });
    this.player = new Player(this, this.safeX, this.safeY);
    this.physics.add.collider(this.player, this.ground); this.physics.add.collider(this.player, this.obstacles);
    this.cameras.main.startFollow(this.player, true, 0.08, 1, -200, 0);
    for (const key of ['A', 'ENTER', 'H', 'ESC']) this.input.keyboard!.addKey(key).on('down', () => this.pressed.add(key));
    this.proximity = this.add.text(0, 0, 'A', { fontFamily: 'Arial', fontSize: '17px', fontStyle: 'bold', color: '#17283b', backgroundColor: '#ffdf83', padding: { x: 10, y: 5 } }).setOrigin(0.5).setDepth(10).setVisible(false);
    ui.innerHTML = `<div class="topbar">${brand()}<div class="top-right"><span class="level-tag">BASE ESPACIAL <b>01</b></span><button id="mute" class="quiet-button"></button></div></div>
      <div class="hud"><div class="mission-card"><div class="mission-top"><span id="mission-label"></span><div id="steps" class="steps">${missions.map((_, i) => `<i data-step="${i}"></i>`).join('')}</div></div><h2 id="instruction" aria-live="polite"></h2><div id="feedback" aria-live="polite">¡${escapeHtml(PLAYER_DISPLAY_NAME)}! Necesitamos reparar el cohete.</div></div><aside class="inventory"><span class="eyebrow">TU MOCHILA</span><div id="inventory">Lista para explorar</div><div id="batteries">Baterías: 0 / 3</div></aside></div>${footer()}<div id="modal-root"></div>`;
    this.restoreWorld(); muteButton(); this.showInstruction();
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.saveCheckpoint() });
    const save = () => { this.saveCheckpoint(); progress.pause(); speech.cancel(); }; window.addEventListener('pagehide', save);
    const blur = () => { if (!this.paused && !this.launching) this.togglePause(); };
    window.addEventListener('blur', blur);
    this.events.once('shutdown', () => { window.removeEventListener('pagehide', save); window.removeEventListener('blur', blur); this.input.keyboard?.removeAllKeys(true); });
  }
  private restoreWorld() {
    for (const obj of this.objects) {
      const collected = (obj.kind === 'key' && this.rules.key) || (obj.kind === 'battery' && this.rules.batteries.has(obj.id)) ||
        (obj.kind === 'engine' && (this.rules.carryingEngine || this.rules.installed || this.rules.index === 5));
      if (collected) { obj.active = false; obj.sprite.setVisible(false); }
      if (obj.kind === 'red-box' && this.rules.piece) { obj.active = false; obj.sprite.setTint(0xa7bdc5); }
      if (obj.kind === 'door' && this.rules.doorOpen) { obj.active = false; this.doorBody?.disableBody(true, true); }
      if (obj.kind === 'button') obj.sprite.setVisible(this.rules.installed);
      if (obj.kind === 'rocket' && this.rules.installed) obj.active = false;
    }
    this.rocketPiece.setVisible(this.rules.piece); this.rocketEngine.setVisible(this.rules.installed);
  }
  private saveCheckpoint() { progress.checkpoint(this.tutorial, Phaser.Math.Clamp(this.safeX, 25, 3450), this.safeY, this.rules); }
  private sign(x: number, text: string) {
    this.add.rectangle(x, 568, 5, 63, 0x657887);
    this.add.text(x, 528, text, { fontFamily: 'monospace', fontSize: '12px', color: '#cde7df', backgroundColor: '#29445a', padding: { x: 10, y: 9 } }).setOrigin(0.5);
  }
  private addPlatform(x: number, y: number, blocks: number) { for (let i = 0; i < blocks; i++) this.ground.create(x + i * 48 + 24, y + 12, 'platform'); }
  private addObject(id: string, kind: ObjectKind, texture: string, x: number, y: number) {
    const item = { id, kind, sprite: this.add.image(x, y, texture).setDepth(1), active: true }; this.objects.push(item); return item;
  }
  private showInstruction() {
    const tutorials = ['Usa las flechas para caminar.', 'Presiona S para saltar.', 'Acércate a la caja y presiona A.', '¡Muy bien! Ya estás listo para la misión.'];
    if (this.tutorial < 4) {
      this.instruction.set(tutorials[this.tutorial], 'ENTRENAMIENTO', ['flechas', 'S', 'caja', 'listo'][this.tutorial]);
      if (this.tutorial === 3) this.instruction.feedback('Presiona Enter para comenzar.');
    } else {
      progress.missionSeen(this.rules.index);
      const m = missions[this.rules.index]; this.instruction.set(m.instruction, `MISIÓN ${this.rules.index + 1} DE 6 · ${m.shortName.toUpperCase()}`, m.keyword);
    }
    ui.querySelectorAll<HTMLElement>('[data-step]').forEach((el, i) => { el.className = i < this.rules.completedCount ? 'done' : this.tutorial === 4 && i === this.rules.index ? 'current' : ''; });
    const bag = [this.rules.piece ? '◆ Pieza' : '', this.rules.key && !this.rules.doorOpen ? '⚿ Llave' : '', this.rules.carryingEngine ? '▣ Motor' : ''].filter(Boolean);
    ui.querySelector('#inventory')!.textContent = `${bag.join('   ') || 'Lista para explorar'} · ⭐ ${progress.data.player.stars} 🪙 ${progress.data.player.coins}`;
    ui.querySelector('#batteries')!.textContent = `Baterías: ${this.rules.batteries.size} / 3`;
  }
  private consume(key: string) { const has = this.pressed.has(key); this.pressed.delete(key); return has; }
  update() {
    if (this.consume('ESC') && !this.launching) this.togglePause();
    if (this.paused) { if (this.consume('ENTER')) this.togglePause(); return; }
    if (this.launching) return;
    if ((this.player.body as Phaser.Physics.Arcade.Body).blocked.down) { this.safeX = this.player.x; this.safeY = this.player.y; }
    this.player.tick(this.tutorial !== 3, this.rules.carryingEngine);
    if (this.tutorial === 0 && this.player.hasMoved) { this.tutorial = 1; this.saveCheckpoint(); this.showInstruction(); }
    if (this.tutorial === 1 && this.player.hasJumped) { this.tutorial = 2; this.saveCheckpoint(); this.showInstruction(); }
    if (this.tutorial === 3 && this.consume('ENTER')) { this.tutorial = 4; this.saveCheckpoint(); this.showInstruction(); this.positive('¡Continúa!'); }
    if (this.consume('H')) { progress.help(this.tutorial === 4 ? this.rules.index : undefined); this.instruction.help(); }
    this.nearest = this.objects.filter(o => o.active && (o.kind !== 'button' || this.rules.installed))
      .filter(o => Math.abs(o.sprite.x - this.player.x) < (o.kind === 'rocket' ? 100 : o.kind === 'door' ? 88 : 64) && Math.abs((o.kind === 'rocket' || o.kind === 'door' ? 565 : o.sprite.y) - this.player.y) < 75)
      .sort((a, b) => Math.abs(a.sprite.x - this.player.x) - Math.abs(b.sprite.x - this.player.x))[0];
    this.proximity.setVisible(!!this.nearest && this.tutorial >= 2 && this.tutorial !== 3);
    if (this.nearest) this.proximity.setPosition(this.nearest.sprite.x, this.nearest.kind === 'rocket' ? 364 : this.nearest.sprite.y - this.nearest.sprite.height / 2 - 25);
    if (this.consume('A')) this.interact();
    if (this.feedbackUntil && this.time.now > this.feedbackUntil) { this.instruction.feedback('Lee tu misión. Explora a tu ritmo.'); this.feedbackUntil = 0; }
  }
  private interact() {
    if (this.tutorial < 2 || this.tutorial === 3) return;
    const obj = this.nearest;
    if (!obj) { this.positive('Acércate a un objeto para usar A.'); return; }
    if (this.tutorial === 2) {
      if (obj.kind === 'tutorial-box') { this.tutorial = 3; sound.play('mission'); this.burst(obj.sprite.x, obj.sprite.y, 0xffdf83); this.saveCheckpoint(); this.showInstruction(); }
      else this.positive('Busca la caja que está cerca del inicio.');
      return;
    }
    const missionIndex = this.rules.index;
    const result = this.rules.interact(obj.kind, obj.id);
    if (result === 'completed') progress.completeMission(missionIndex);
    if (result === 'wrong' || result === 'locked') progress.wrongInteraction();
    this.saveCheckpoint();
    if (result === 'wrong' || result === 'locked') { this.positive(result === 'locked' ? 'Necesitas la llave. Sigue buscando.' : 'Ese no es. Sigue buscando.'); return; }
    if (['key', 'battery', 'engine'].includes(obj.kind)) { obj.active = false; obj.sprite.setVisible(false); }
    if (obj.kind === 'red-box') { obj.active = false; obj.sprite.setTint(0xa7bdc5); this.rocketPiece.setVisible(true); }
    if (obj.kind === 'door') {
      obj.active = false; this.doorBody?.disableBody(true, false);
      this.tweens.add({ targets: this.doorBody, alpha: 0.2, y: 365, duration: 700 }); sound.play('door');
    } else sound.play(result === 'completed' ? 'mission' : 'pickup');
    this.burst(obj.sprite.x, obj.sprite.y, 0x90f2c1);
    if (result === 'installed') {
      obj.active = false; this.rocketEngine.setVisible(true); this.objects.find(o => o.kind === 'button')!.sprite.setVisible(true); this.positive('¡Gran trabajo! Ahora presiona el botón verde.');
    } else this.positive(result === 'completed' ? ['¡Lo encontraste!', '¡Muy bien!', '¡Excelente!', '¡Gran trabajo!', '¡Llegaste!'][Math.min(this.rules.index - 1, 4)] : obj.kind === 'engine' ? '¡Lo encontraste! Lleva el motor al cohete.' : '¡Muy bien! Sigue buscando.');
    if (result === 'completed') { this.positive(`¡Lo lograste, ${PLAYER_DISPLAY_NAME}! ⭐ +1`); speech.speak(missionPraise(missionIndex)); }
    if (this.rules.won) { progress.completeLevel(); this.launch(); return; }
    this.showInstruction();
  }
  private positive(text: string) { this.instruction.feedback(text); this.feedbackUntil = this.time.now + 4500; }
  private burst(x: number, y: number, tint: number) {
    const emitter = this.add.particles(x, y, 'spark', { speed: { min: 35, max: 110 }, lifespan: 700, quantity: 14, scale: { start: 1, end: 0 }, tint, gravityY: 80, emitting: false }).setDepth(8);
    emitter.explode(14); this.time.delayedCall(900, () => emitter.destroy());
  }
  private togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause(); this.player.setVelocityX(0); this.saveCheckpoint(); progress.pause(); speech.cancel();
      ui.querySelector('#modal-root')!.innerHTML = '<div class="scrim"><section class="pause-card"><span class="eyebrow">TÓMATE UN RESPIRO</span><h2>Juego en pausa</h2><p>Tu cohete te espera.</p><button id="resume" class="primary">CONTINUAR <span>↵</span></button><small>Presiona Enter o Escape</small></section></div>';
      ui.querySelector<HTMLButtonElement>('#resume')!.onclick = () => this.togglePause();
    } else { this.physics.resume(); progress.resume(); ui.querySelector('#modal-root')!.innerHTML = ''; this.input.keyboard!.resetKeys(); this.pressed.clear(); }
  }
  private launch() {
    this.launching = true; this.player.setVelocityX(0); this.proximity.setVisible(false); progress.pause();
    this.instruction.set('¡El cohete está listo para despegar!', 'MISIÓN COMPLETA'); this.instruction.feedback('3… 2… 1… ¡A las estrellas!');
    ui.querySelectorAll('[data-step]').forEach(el => el.className = 'done');
    this.cameras.main.stopFollow(); this.cameras.main.pan(3030, 360, 500);
    this.time.delayedCall(1400, () => { progress.beginTrip('earth', 'earth', 'launch'); this.scene.start('Ship'); });
  }
}
