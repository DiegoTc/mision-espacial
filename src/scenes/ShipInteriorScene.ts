import Phaser from 'phaser';
import { AdventureScene } from './AdventureScene';
import { progress } from '../systems/ProgressManager';
import { getShipMission, type TaskStep } from '../data/shipMissions';
import { sound } from '../systems/SoundManager';
export class ShipInteriorScene extends AdventureScene {
  constructor() { super('Ship'); }
  private step!: TaskStep;
  private waiting = false;
  private seated = false;
  create() {
    if (!progress.data.currentTrip) { this.scene.start('SolarSystem'); return; }
    this.waiting = false; this.seated = false;
    this.add.rectangle(640, 360, 1280, 720, 0x16243e);
    const g = this.add.graphics(); g.fillStyle(0x2a4260); g.fillRoundedRect(45, 220, 1190, 365, 24); g.lineStyle(10, 0x7f9faf); g.strokeRoundedRect(60, 238, 1160, 340, 18);
    for (let x = 100; x < 1200; x += 180) { g.fillStyle(0x0c1833); g.fillRoundedRect(x, 270, 120, 95, 15); g.fillStyle(0xa6e6dc); g.fillRect(x + 15, 285, 5, 5); g.fillRect(x + 70, 310, 4, 4); }
    this.setup('MI NAVE', 1280, 100, 570); this.physics.world.gravity.y = 850;
    this.object('card-red', 185, 570, 'card-red', undefined, 'ROJA');
    this.object('card-blue', 290, 570, 'card-blue', undefined, 'AZUL');
    this.object('console', 445, 515, 'console', undefined, 'CONSOLA');
    this.object('battery', 445, 576, 'battery');
    this.object('energy-panel', 680, 550, 'energy-panel', undefined, 'PANEL');
    this.object('cable-red', 250, 575, 'cable-red', undefined, 'ROJO');
    this.object('cable-blue', 350, 575, 'cable-blue', undefined, 'AZUL');
    this.object('cable-yellow', 150, 575, 'cable-yellow', undefined, 'AMARILLO');
    this.object('socket', 620, 548, 'box-red', undefined, 'CONEXIÓN');
    this.object('button-green', 810, 565, 'button', undefined, 'VERDE');
    this.object('light-switch', 810, 565, 'switch-yellow', undefined, 'LUZ ☀');
    this.object('wrong-switch', 570, 565, 'switch-red', undefined, 'RADIO');
    this.object('seat', 1080, 562, 'seat', undefined, 'ASIENTO');
    this.showStep(); progress.resume();
  }
  private showStep() {
    const trip = progress.data.currentTrip!; const mission = getShipMission(trip.missionIds[trip.missionIndex]);
    const base = mission.steps[trip.step]; this.step = { ...base };
    const variant = mission.variants?.find(v => v.step === trip.step && (progress.data.reading.words[v.practiceWord]?.helpUsed ?? 0) > 0);
    if (variant) Object.assign(this.step, { instruction: variant.instruction, targetWords: variant.targetWords, hint: variant.hint });
    this.inventory = trip.inventory[0] ?? '';
    this.seated = mission.id === 'seat' && trip.step >= 2;
    (this.player.body as Phaser.Physics.Arcade.Body).allowGravity = !this.seated;
    if (this.seated) this.player.setPosition(1080, 535).setVelocity(0);
    const allowed: Record<string, string[]> = { 'activate-engine': ['card-red', 'card-blue', 'console', 'button-green'], battery: ['battery', 'console', 'energy-panel'], cable: ['cable-red', 'cable-blue', 'cable-yellow', 'socket'], seat: ['seat'], lights: ['light-switch', 'wrong-switch'] };
    for (const [id, obj] of this.objects) { obj.setVisible((allowed[mission.id] ?? []).includes(id) && !trip.inventory.includes(id) && !(mission.id === 'activate-engine' && id === 'card-blue' && trip.step > 0) && !(mission.id === 'battery' && id === 'battery' && trip.step > 0) && !(mission.id === 'cable' && id === 'cable-red' && trip.step > 0)); (obj.getData('label') as Phaser.GameObjects.Text | undefined)?.setVisible(obj.visible); }
    this.carryImage.setTexture(this.inventory || 'battery').clearTint();
    this.setTask(this.step.instruction.replace('{destination}', 'la Luna'), this.step.targetWords, this.step.hint, `${trip.id}:${mission.id}:${trip.step}`, `MI NAVE · ${mission.name}`);
    if (progress.data.reading.tasks[this.taskId]?.completed) { this.waiting = true; this.box.set(mission.feedback, '¡Lo lograste, FsantigoEV!'); this.box.feedback('Presiona Enter para seguir.'); }
  }
  update() {
    if (!this.player || !progress.data.currentTrip) return;
    this.frame(); if (this.seated) this.player.setPosition(1080, 535).setVelocity(0); if (this.paused) return;
    if (this.waiting) { if (this.enterQueued) { this.enterQueued = false; this.nextMission(); } this.useQueued = false; return; }
    const used = this.useQueued; this.useQueued = false;
    const confirmed = this.enterQueued; this.enterQueued = false;
    if ((this.step.action === 'approach' && this.near(this.step.target)) || (this.step.action === 'confirm' && confirmed && this.near(this.step.target)) || (this.step.action === 'use' && used && this.near(this.step.target))) this.completeStep();
    else if (used) this.wrong();
  }
  private completeStep() {
    const trip = progress.data.currentTrip!; const mission = getShipMission(trip.missionIds[trip.missionIndex]);
    if (this.step.consume && !trip.inventory.includes(this.step.consume)) { this.wrong(); return; }
    progress.taskAttempt(this.taskId, true); sound.play('pickup');
    if (this.step.pickup) trip.inventory.push(this.step.pickup);
    if (this.step.consume) trip.inventory = trip.inventory.filter(id => id !== this.step.consume);
    if (trip.step + 1 < mission.steps.length) { trip.step++; progress.save(); this.showStep(); this.box.feedback('¡Muy bien!'); }
    else {
      progress.reward(`${trip.id}:${mission.id}`, mission.reward.stars);
      if (!progress.data.completedShipMissions.includes(mission.id)) progress.data.completedShipMissions.push(mission.id);
      if (progress.current) progress.current.missionsCompleted = trip.missionIndex + 1;
      this.inventory = ''; this.carryImage.setVisible(false);
      if (mission.id === 'battery') this.add.image(680, 530, 'battery').setDepth(5);
      if (mission.id === 'cable') this.add.rectangle(620, 548, 48, 8, 0xff657b).setDepth(5);
      if (mission.id === 'seat') this.player.setPosition(1080, 530);
      this.celebrate(); this.box.set(mission.feedback, '¡Lo lograste, FsantigoEV!');
      this.add.rectangle(640, 245, 1100, 7, 0x9fffd8).setDepth(9);
      this.box.feedback('⭐ +1 · Presiona Enter para seguir.'); this.waiting = true; progress.save();
    }
  }
  private nextMission() {
    const trip = progress.data.currentTrip!;
    if (trip.missionIndex + 1 < trip.missionIds.length) { trip.missionIndex++; trip.step = 0; trip.inventory = []; this.waiting = false; progress.save(); this.showStep(); }
    else { trip.stage = 'flying'; progress.data.scene = 'Travel'; progress.save(); this.scene.start('Travel'); }
  }
  protected savePosition() { progress.save(); }
}
