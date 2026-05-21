import Phaser from 'phaser';
import {
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_JUMP_VELOCITY,
  COYOTE_TIME_MS,
  JUMP_BUFFER_MS,
  TILE_SIZE,
  GROUND_ROW,
} from '../config/levelConfig.js';

// Player states
export const STATE_SMALL = 'small';
export const STATE_SUPER = 'super';
export const STATE_DEAD  = 'dead';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'characters', 'character_beige_idle');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Render at 64x64 (frames are 128x128)
    this.setDisplaySize(TILE_SIZE, TILE_SIZE);
    // Physics body: narrower than sprite for tighter feel
    this.body.setSize(36, 52);
    this.body.setOffset(14, 38); // offset in original-frame pixels (128px frame)
    this.body.setMaxVelocityX(PLAYER_RUN_SPEED);

    this.state = STATE_SMALL;
    this._coyoteTimer = 0;
    this._jumpBuffer  = 0;
    this._jumpHeld    = false;
    this._invincible  = 0; // ms of invincibility after being hit

    // Input
    this._cursors = scene.input.keyboard.createCursorKeys();
    this._keys = scene.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump:  Phaser.Input.Keyboard.KeyCodes.W,
      run:   Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });
  }

  /** Call from Game.update every frame */
  update(time, delta) {
    if (this.state === STATE_DEAD) return;

    const onGround = this.body.blocked.down;

    // Coyote time: refresh when on ground, count down when airborne
    if (onGround) {
      this._coyoteTimer = COYOTE_TIME_MS;
    } else {
      this._coyoteTimer = Math.max(0, this._coyoteTimer - delta);
    }

    // Consume jump buffer when we (re)land
    this._jumpBuffer = Math.max(0, this._jumpBuffer - delta);
    if (this._jumpBuffer > 0 && onGround) {
      this._doJump();
      this._jumpBuffer = 0;
    }

    // Horizontal movement
    const left  = this._cursors.left.isDown  || this._keys.left.isDown;
    const right = this._cursors.right.isDown || this._keys.right.isDown;
    const run   = this._cursors.shift?.isDown || this._keys.run.isDown;
    const speed = run ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;

    if (left)       this.body.setVelocityX(-speed);
    else if (right) this.body.setVelocityX(speed);
    else            this.body.setVelocityX(0);

    if (left)  this.setFlipX(true);
    if (right) this.setFlipX(false);

    // Jump input
    const jumpDown = this._cursors.up.isDown || this._cursors.space?.isDown || this._keys.jump.isDown;
    if (jumpDown && !this._jumpHeld) {
      if (this._coyoteTimer > 0) {
        this._doJump();
        this._coyoteTimer = 0;
      } else {
        this._jumpBuffer = JUMP_BUFFER_MS;
      }
      this._jumpHeld = true;
    }
    if (!jumpDown) {
      this._jumpHeld = false;
      // Variable jump height: cut velocity if key released early
      if (this.body.velocity.y < -100) {
        this.body.setVelocityY(this.body.velocity.y * 0.85);
      }
    }

    // Animation
    if (!onGround) {
      this.play('player-jump', true);
    } else if (left || right) {
      this.play('player-walk', true);
    } else {
      this.play('player-idle', true);
    }

    // Invincibility timer (flash effect after damage)
    if (this._invincible > 0) {
      this._invincible -= delta;
      this.setAlpha(Math.sin(this._invincible * 0.05) > 0 ? 1 : 0.4);
    } else {
      this.setAlpha(1);
    }
  }

  _doJump() {
    this.body.setVelocityY(PLAYER_JUMP_VELOCITY);
    this.scene.sound.play('sfx_jump', { volume: 0.6 });
  }

  /** Called when player lands on top of an enemy */
  bounceOffEnemy() {
    this.body.setVelocityY(PLAYER_JUMP_VELOCITY * 0.6);
  }

  /**
   * Called when player touches an enemy from the side.
   * Returns true if damage was applied; false if invincible.
   */
  takeDamage() {
    if (this._invincible > 0) return false;
    if (this.state === STATE_SUPER) {
      this.state = STATE_SMALL;
      this._invincible = 2000; // 2 seconds of invincibility
      this.scene.sound.play('sfx_hurt', { volume: 0.7 });
      return true;
    }
    // Already small — die
    this.die();
    return true;
  }

  /** Collect a Super Mushroom */
  grow() {
    if (this.state === STATE_SMALL) {
      this.state = STATE_SUPER;
      // Grow tween: briefly scale up then back to normal
      this.scene.tweens.add({
        targets: this,
        scaleX: { from: 1, to: 1.4 },
        scaleY: { from: 1, to: 1.4 },
        duration: 120,
        yoyo: true,
        repeat: 2,
      });
    }
  }

  die() {
    if (this.state === STATE_DEAD) return;
    this.state = STATE_DEAD;
    this.body.setVelocityY(PLAYER_JUMP_VELOCITY * 0.8);
    this.body.setAllowGravity(false); // briefly float then fall handled by scene
    this.scene.sound.play('sfx_hurt', { volume: 0.8 });
    this.scene.time.delayedCall(200, () => {
      this.body.setAllowGravity(true);
    });
    this.scene.events.emit('player-died');
  }
}
