import Phaser from 'phaser';
import { AdventureScene } from './AdventureScene';
import { REWARDS } from '../data/worlds';
import { lunarMissions } from '../data/lunarMissions';
import { progress } from '../systems/ProgressManager';
import { sound } from '../systems/SoundManager';
import { drawSky } from './WorldArt';
export class MoonScene extends AdventureScene {
  constructor() { super('Moon'); }
  create() {
    if (!progress.data.moonCheckpoint) progress.startMoon();
    const cp = progress.data.moonCheckpoint!;
    drawSky(this); this.add.circle(1100, 290, 100, 0x67b4cf).setScrollFactor(0.2);
    this.setup('LA LUNA', 1600, cp.x, cp.y); this.physics.world.gravity.y = 590;
    this.player.jumpVelocity = 445;
    for (let x = 0; x < 1600; x += 95) this.add.ellipse(x, 649, 62, 15, 0x7e8aab);
    const rock = this.object('rock', 320, 562, 'stone', undefined, 'ROCA GRANDE');
    this.physics.add.existing(rock, true); this.physics.add.collider(this.player, rock);
    this.object('small-rock', 180, 582, 'stone').setScale(0.45);
    this.platform(510, 510, 3); this.platform(800, 425, 3); this.platform(1020, 510, 3);
    this.object('battery', 585, 575, 'battery');
    this.object('rover', 1320, 553, 'engine', undefined, 'VEHÍCULO LUNAR').setScale(1.7);
    this.add.circle(1285, 590, 13, 0x14223e); this.add.circle(1355, 590, 13, 0x14223e);
    this.add.text(832, 384, 'ARRIBA', { fontSize: '20px', color: '#b9ffe2', fontFamily: 'monospace' });
    this.showMission(); progress.resume();
  }
  private showMission() {
    const cp = progress.data.moonCheckpoint!; const mission = lunarMissions[cp.index];
    this.inventory = cp.carrying ? 'battery' : ''; this.carryImage.setTexture('battery').clearTint();
    this.objects.get('battery')!.setVisible(cp.index < 3);
    this.player.hasJumped = false;
    this.setTask(mission.instruction, mission.words, mission.hint, `${progress.current!.id}:moon:${cp.index}`, `LA LUNA · MISIÓN ${cp.index + 1} / 5`);
  }
  update() {
    const cp = progress.data.moonCheckpoint; if (!cp || !this.player) return;
    this.frame(); if (this.paused) return;
    const used = this.useQueued; this.useQueued = false; this.enterQueued = false;
    const mission = lunarMissions[cp.index];
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const landedAbove = body.blocked.down && this.player.x >= 800 && this.player.x <= 944 && Math.abs(body.bottom - 425) < 4;
    if ((mission.action === 'use' && used && this.near(mission.target)) || (mission.action === 'cross' && this.player.hasJumped && this.player.x > 390) || (mission.action === 'land' && landedAbove)) this.complete();
    else if (used) this.wrong();
  }
  private complete() {
    const cp = progress.data.moonCheckpoint!;
    progress.taskAttempt(this.taskId, true); progress.reward(`${progress.current!.id}:moon:${cp.index}`, REWARDS.mainMissionStars); sound.play('pickup');
    if (cp.index === 2) cp.carrying = true;
    if (cp.index === 3) { cp.carrying = false; this.add.image(1320, 520, 'battery'); }
    progress.current!.missionsCompleted = cp.index + 1;
    if (cp.index === 4) { progress.completeLevel('moon'); this.scene.start('Win', { world: 'moon' }); return; }
    cp.index++; this.savePosition(); this.showMission(); this.celebrate();
  }
  protected savePosition() { const cp = progress.data.moonCheckpoint; if (cp) { cp.x = this.savedX; cp.y = this.savedY; } progress.save(); }
}
