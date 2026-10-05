import Phaser from 'phaser';
import { sound } from '../systems/SoundManager';
export class Player extends Phaser.Physics.Arcade.Sprite {
  private arrows: Phaser.Types.Input.Keyboard.CursorKeys;
  private jumpQueued = false;
  private carried: Phaser.GameObjects.Image;
  jumpVelocity = 440;
  hasMoved = false;
  hasJumped = false;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player'); scene.add.existing(this); scene.physics.add.existing(this);
    this.setDepth(4).setCollideWorldBounds(true).setMaxVelocity(260, 650);
    this.body!.setSize(27, 55).setOffset(8, 3);
    this.arrows = scene.input.keyboard!.createCursorKeys();
    const jump = scene.input.keyboard!.addKey('S');
    const queueJump = () => { this.jumpQueued = true; };
    jump.on('down', queueJump);
    scene.events.once('shutdown', () => jump.off('down', queueJump));
    this.carried = scene.add.image(x, y, 'engine').setScale(0.62).setDepth(5).setVisible(false);
    scene.events.once('shutdown', () => this.carried.destroy());
  }
  tick(enabled: boolean, carrying: boolean) {
    if (!enabled) { this.setVelocityX(0); this.jumpQueued = false; return; }
    const dir = (this.arrows.right.isDown ? 1 : 0) - (this.arrows.left.isDown ? 1 : 0);
    this.setVelocityX(dir * (carrying ? 190 : 245));
    if (dir) { this.setFlipX(dir < 0); this.hasMoved = true; }
    if (this.jumpQueued && (this.body as Phaser.Physics.Arcade.Body).blocked.down) {
      this.setVelocityY(-this.jumpVelocity); this.hasJumped = true; sound.play('jump');
    }
    this.jumpQueued = false;
    const grounded = (this.body as Phaser.Physics.Arcade.Body).blocked.down;
    this.setAngle(dir && grounded ? Math.sin(this.scene.time.now / 80) * 3 : 0);
    this.carried.setVisible(carrying).setPosition(this.x + (this.flipX ? -23 : 23), this.y + 5);
  }
}
