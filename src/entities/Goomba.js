import Phaser from 'phaser';
import { TILE_SIZE } from '../config/levelConfig.js';

const WALK_SPEED = 80;

export class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemies', 'slime_normal_walk_a');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(48, 48);
    this.body.setOffset(8, 16);

    this._direction = -1; // -1 = left, 1 = right
    this.setData('stomped', false);

    this.play('goomba-walk');
    this.body.setVelocityX(WALK_SPEED * this._direction);
  }

  stomp() {
    if (this.getData('stomped')) return;
    this.setData('stomped', true);
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.play('goomba-stomped');
    this.scene.time.delayedCall(400, () => {
      if (this.active) this.destroy();
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.getData('stomped')) return;

    // Reverse on wall collision
    if (this.body.blocked.left) {
      this._direction = 1;
      this.setFlipX(true);
    } else if (this.body.blocked.right) {
      this._direction = -1;
      this.setFlipX(false);
    }

    // Reverse at platform/ground edges to avoid falling off
    if (this.body.blocked.down) {
      // Check if the tile one step ahead at ground level is empty
      const aheadX = this.x + this._direction * (TILE_SIZE * 0.6);
      const belowY = this.y + TILE_SIZE;
      const tileAhead = this.scene.physics.overlapRect(
        aheadX - 4, belowY - 4, 8, 8,
        false, true  // only static bodies
      );
      if (tileAhead.length === 0) {
        this._direction *= -1;
        this.setFlipX(this._direction > 0);
      }
    }

    this.body.setVelocityX(WALK_SPEED * this._direction);
  }
}
