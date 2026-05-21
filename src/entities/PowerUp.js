import Phaser from 'phaser';
import { TILE_SIZE } from '../config/levelConfig.js';

const MOVE_SPEED = 100;

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const frame = type === 'super' ? 'mushroom_red' : 'mushroom_brown';
    super(scene, x, y, 'tiles', frame);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setData('type', type);
    this._direction = 1;

    // Emerge tween (pop up from block)
    this.setY(y);
    this.body.setAllowGravity(false);
    scene.tweens.add({
      targets: this,
      y: y - TILE_SIZE,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.body.setAllowGravity(true);
        this.body.setVelocityX(MOVE_SPEED * this._direction);
      },
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Reverse direction on wall collision
    if (this.body.blocked.left) {
      this._direction = 1;
      this.body.setVelocityX(MOVE_SPEED);
    } else if (this.body.blocked.right) {
      this._direction = -1;
      this.body.setVelocityX(-MOVE_SPEED);
    }
  }
}
