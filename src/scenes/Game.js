import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Goomba } from '../entities/Goomba.js';
import { PowerUp } from '../entities/PowerUp.js';
import { LevelGenerator } from '../level/LevelGenerator.js';
import {
  TILE_SIZE, GROUND_ROW, WORLD_WIDTH, WORLD_HEIGHT,
  CANVAS_WIDTH, CANVAS_HEIGHT,
  LEVEL_CONFIG, SCORE_COIN, SCORE_STOMP, LEVEL_TIME_START,
} from '../config/levelConfig.js';

export class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create(data = {}) {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Game state — score/coins/lives carry across a respawn (passed via
    // scene.restart data). A fresh start (Play Again) passes none → defaults.
    this.score    = data.score ?? 0;
    this.coins    = data.coins ?? 0;
    this.lives    = data.lives ?? 3;
    this.timeLeft = LEVEL_TIME_START;
    this._timerAccum = 0;
    this._muted = false;

    // Generate level
    const generator = new LevelGenerator();
    this.levelData  = generator.generate(LEVEL_CONFIG);

    // Build world
    this._buildBackground();
    this._buildGround();
    this._buildPlatforms();
    this._buildBlocks();
    this._buildDecorations();
    this._buildEnemies();
    this._buildCoins();
    this._buildEndTrigger();
    this._buildPlayer();
    this._setupColliders();
    this._setupCamera();

    // Start HUD
    this.scene.launch('HUD');
    this._emitHUD();

    // Death zone (fallen off world)
    this._playerRespawnPending = false;
  }

  // ── World builders ────────────────────────────────────────────────────────

  _buildBackground() {
    // Layer 1 (far, 0.2× scroll): solid sky
    this.bgFar = this.add.tileSprite(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'backgrounds', 'background_solid_sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-10);

    // Layer 2 (mid, 0.5× scroll): rolling hills
    this.bgMid = this.add.tileSprite(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2, 'backgrounds', 'background_color_hills')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-9);
  }

  _buildGround() {
    this.groundGroup = this.physics.add.staticGroup();
    this.levelData.groundTiles.forEach(({ col, row }) => {
      const frame = row === GROUND_ROW ? 'terrain_grass_block' : 'terrain_grass_block_center';
      this.groundGroup.create(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        'tiles', frame
      );
    });
    this.groundGroup.refresh();
  }

  _buildPlatforms() {
    this.platformGroup = this.physics.add.staticGroup();
    const platData = this.levelData.platformTiles;

    platData.forEach(({ col, row }) => {
      // Determine frame: leftmost, middle, rightmost
      const hasLeft  = platData.some(p => p.row === row && p.col === col - 1);
      const hasRight = platData.some(p => p.row === row && p.col === col + 1);
      let frame;
      if (!hasLeft && !hasRight) frame = 'terrain_grass_horizontal_left';
      else if (!hasLeft)         frame = 'terrain_grass_horizontal_left';
      else if (!hasRight)        frame = 'terrain_grass_horizontal_right';
      else                       frame = 'terrain_grass_horizontal_middle';

      this.platformGroup.create(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        'tiles', frame
      );
    });
    this.platformGroup.refresh();
  }

  _buildBlocks() {
    // Question blocks — dynamic so they can change frame on hit
    this.questionBlocks = this.physics.add.staticGroup();
    this.levelData.questionBlocks.forEach(({ col, row, contains }) => {
      const sprite = this.questionBlocks.create(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        'tiles', 'block_coin'
      );
      sprite.setData('contains', contains);
      sprite.setData('hit', false);
    });

    // Brick blocks
    this.brickGroup = this.physics.add.staticGroup();
    this.levelData.brickBlocks.forEach(({ col, row, contains }) => {
      const sprite = this.brickGroup.create(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        'tiles', contains === 'oneup' ? 'block_strong_coin' : 'bricks_brown'
      );
      sprite.setData('contains', contains);
      sprite.setData('hit', false);
    });

    this.questionBlocks.refresh();
    this.brickGroup.refresh();
  }

  _buildDecorations() {
    // End-level sign
    const { endCol } = this.levelData;
    this.endSign = this.add.image(
      endCol * TILE_SIZE + TILE_SIZE / 2,
      GROUND_ROW * TILE_SIZE - TILE_SIZE / 2,
      'tiles', 'sign_exit'
    ).setDepth(1);

    // Animated flag above sign — alternate frame on a timed loop
    this.flag = this.add.sprite(
      endCol * TILE_SIZE + TILE_SIZE / 2,
      GROUND_ROW * TILE_SIZE - TILE_SIZE * 1.5,
      'tiles', 'flag_green_a'
    );
    this._flagFrameA = true;
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this._flagFrameA = !this._flagFrameA;
        this.flag.setTexture('tiles', this._flagFrameA ? 'flag_green_a' : 'flag_green_b');
      },
    });
  }

  _buildEnemies() {
    this.goombaGroup = this.physics.add.group({ classType: Goomba, runChildUpdate: true });
    this.levelData.enemies.forEach(({ col, row }) => {
      const goomba = new Goomba(
        this,
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2
      );
      this.goombaGroup.add(goomba, true);
    });
  }

  _buildCoins() {
    this.coinGroup = this.physics.add.staticGroup();
    this.levelData.coins.forEach(({ col, row }) => {
      this.coinGroup.create(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        'tiles', 'coin_gold'
      );
    });
    this.coinGroup.refresh();

    // Separate dynamic group for coins that pop from blocks
    this.poppedCoinGroup = this.physics.add.group();
    this.powerUpGroup    = this.physics.add.group({ classType: PowerUp, runChildUpdate: true });
  }

  _buildEndTrigger() {
    const { endCol } = this.levelData;
    this.endZone = this.add.zone(
      endCol * TILE_SIZE + TILE_SIZE / 2,
      GROUND_ROW * TILE_SIZE - TILE_SIZE / 2,
      TILE_SIZE, TILE_SIZE * 2
    );
    this.physics.world.enable(this.endZone, Phaser.Physics.Arcade.STATIC_BODY);
  }

  _buildPlayer() {
    this.player = new Player(
      this,
      2 * TILE_SIZE + TILE_SIZE / 2,
      (GROUND_ROW - 1) * TILE_SIZE + TILE_SIZE / 2
    );
  }

  // ── Colliders & overlaps ──────────────────────────────────────────────────

  _setupColliders() {
    const { player, groundGroup, platformGroup, questionBlocks, brickGroup, goombaGroup, coinGroup, poppedCoinGroup, powerUpGroup, endZone } = this;

    // Player <> terrain
    this.physics.add.collider(player, groundGroup);
    this.physics.add.collider(player, platformGroup);
    this.physics.add.collider(player, questionBlocks, this._onPlayerHitBlock, null, this);
    this.physics.add.collider(player, brickGroup,     this._onPlayerHitBlock, null, this);

    // Enemies <> terrain
    this.physics.add.collider(goombaGroup, groundGroup);
    this.physics.add.collider(goombaGroup, platformGroup);

    // Player <> enemies
    this.physics.add.overlap(player, goombaGroup, this._onPlayerEnemyOverlap, null, this);

    // Player <> collectibles
    this.physics.add.overlap(player, coinGroup,        this._onCollectCoin,   null, this);
    this.physics.add.overlap(player, poppedCoinGroup,  this._onCollectCoin,   null, this);
    this.physics.add.overlap(player, powerUpGroup,     this._onCollectPowerUp, null, this);

    // Player <> end zone
    this.physics.add.overlap(player, endZone, this._onLevelClear, null, this);

    // Power-ups <> terrain (so they roll on ground)
    this.physics.add.collider(powerUpGroup, groundGroup);
    this.physics.add.collider(powerUpGroup, platformGroup);
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  _setupCamera() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this._maxCamScrollX = 0;
  }

  // ── Collision handlers ────────────────────────────────────────────────────

  _onPlayerHitBlock(player, block) {
    if (block.getData('hit')) return;
    // Only trigger on a head-bump from below. Arcade zeroes velocity during
    // separation (before this callback), so check blocked.up, not velocity.
    if (!player.body.blocked.up) return;
    if (player.y < block.y) return; // player above block, skip

    block.setData('hit', true);
    block.setTexture('tiles', 'block_empty');
    block.refreshBody();

    this.sound.play('sfx_bump', { volume: 0.6 });

    // Block bump tween
    this.tweens.add({
      targets: block,
      y: block.y - 8,
      duration: 80,
      yoyo: true,
      onComplete: () => block.refreshBody(),
    });

    const contains = block.getData('contains');
    if (contains === 'coin') {
      this._spawnCoinFromBlock(block.x, block.y);
    } else if (contains === 'mushroom') {
      this._spawnPowerUp(block.x, block.y, 'super');
    } else if (contains === 'oneup') {
      this._spawnPowerUp(block.x, block.y, 'oneup');
    }
  }

  _spawnCoinFromBlock(x, y) {
    this.sound.play('sfx_coin', { volume: 0.7 });
    const coin = this.poppedCoinGroup.create(x, y - TILE_SIZE, 'tiles', 'coin_gold');
    coin.setData('fromBlock', true);
    this.physics.add.existing(coin);
    coin.body.setVelocityY(-400);
    coin.body.setGravityY(-TILE_SIZE * 4);
    // Auto-collect after animation
    this.time.delayedCall(600, () => {
      if (coin.active) {
        this._addCoins(1);
        coin.destroy();
      }
    });
  }

  _spawnPowerUp(x, y, type) {
    const pu = new PowerUp(this, x, y - TILE_SIZE / 2, type);
    this.powerUpGroup.add(pu, true);
    this.sound.play('sfx_magic', { volume: 0.7 });
  }

  _onPlayerEnemyOverlap(player, goomba) {
    if (!goomba.active || goomba.getData('stomped')) return;
    if (player.body.velocity.y > 0 && player.y < goomba.y - goomba.displayHeight * 0.25) {
      // Stomp
      goomba.stomp();
      player.bounceOffEnemy();
      this._addScore(SCORE_STOMP);
      this.sound.play('sfx_disappear', { volume: 0.7 });
    } else {
      // Side hit
      const damaged = player.takeDamage();
      if (!damaged) return;
      // Knockback
      const dir = player.x < goomba.x ? -1 : 1;
      player.body.setVelocityX(dir * 250);
    }
  }

  _onCollectCoin(player, coin) {
    coin.destroy();
    this._addCoins(1);
    this.sound.play('sfx_coin', { volume: 0.7 });
  }

  _onCollectPowerUp(player, powerUp) {
    const type = powerUp.getData('type');
    powerUp.destroy();
    if (type === 'super') {
      player.grow();
      this._addScore(1000);
    } else if (type === 'oneup') {
      this.lives += 1;
    }
    this.sound.play('sfx_magic', { volume: 0.7 });
    this._emitHUD();
  }

  _onLevelClear() {
    if (this._levelCleared) return;
    this._levelCleared = true;
    this.sound.play('sfx_gem', { volume: 0.8 });
    this.player.body.setVelocity(0, 0);
    this.player.setActive(false);
    this.scene.stop('HUD');
    this.time.delayedCall(1200, () => {
      this.scene.start('LevelClear', { score: this.score, coins: this.coins });
    });
  }

  // ── Scoring helpers ───────────────────────────────────────────────────────

  _addScore(pts) {
    this.score += pts;
    this._emitHUD();
  }

  _addCoins(n) {
    this.coins += n;
    this._addScore(SCORE_COIN * n);
    this._emitHUD();
  }

  _emitHUD() {
    this.events.emit('hud-update', {
      score:    this.score,
      coins:    this.coins,
      lives:    this.lives,
      timeLeft: Math.ceil(this.timeLeft),
    });
  }

  // ── Death / respawn ───────────────────────────────────────────────────────

  _handlePlayerDeath() {
    if (this._playerRespawnPending) return;
    this._playerRespawnPending = true;
    this.lives -= 1;
    this._emitHUD();
    this.time.delayedCall(2000, () => {
      if (this.lives <= 0) {
        this.scene.stop('HUD');
        this.scene.start('GameOver', { score: this.score });
      } else {
        this.scene.restart({ lives: this.lives, score: this.score, coins: this.coins });
      }
    });
  }

  // ── Main update loop ──────────────────────────────────────────────────────

  update(time, delta) {
    if (!this.player) return;

    this.player.update(time, delta);

    // Parallax scroll
    this.bgFar.setTilePosition(this.cameras.main.scrollX * 0.2);
    this.bgMid.setTilePosition(this.cameras.main.scrollX * 0.5);

    // No-backtrack camera: clamp player to camera left edge
    const camLeft = this.cameras.main.scrollX;
    const minX = camLeft + this.player.displayWidth / 2;
    if (this.player.x < minX) {
      this.player.setX(minX);
      if (this.player.body.velocity.x < 0) this.player.body.setVelocityX(0);
    }
    this._maxCamScrollX = Math.max(this._maxCamScrollX, camLeft);

    // Death by falling
    if (this.player.y > WORLD_HEIGHT + 100 && !this._playerRespawnPending) {
      this.player.die();
    }

    // Listen for player-died event (only set up once)
    if (!this._deathListenerSet) {
      this._deathListenerSet = true;
      this.events.on('player-died', () => this._handlePlayerDeath(), this);
    }

    // Countdown timer
    if (!this._levelCleared && !this._playerRespawnPending) {
      this._timerAccum += delta;
      if (this._timerAccum >= 1000) {
        this._timerAccum -= 1000;
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        this._emitHUD();
        if (this.timeLeft <= 0) {
          this.player.die();
        }
      }
    }
  }
}
