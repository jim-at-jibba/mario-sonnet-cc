import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Spritesheets — Kenney ships Starling/Sparrow XML atlases; load via atlasXML
    this.load.atlasXML('tiles',       'assets/spritesheet-tiles-default.png',       'assets/spritesheet-tiles-default.xml');
    this.load.atlasXML('characters',  'assets/spritesheet-characters-default.png',  'assets/spritesheet-characters-default.xml');
    this.load.atlasXML('enemies',     'assets/spritesheet-enemies-default.png',     'assets/spritesheet-enemies-default.xml');
    this.load.atlasXML('backgrounds', 'assets/spritesheet-backgrounds-default.png', 'assets/spritesheet-backgrounds-default.xml');

    // Audio
    this.load.audio('sfx_jump',       'assets/sounds/sfx_jump.ogg');
    this.load.audio('sfx_bump',       'assets/sounds/sfx_bump.ogg');
    this.load.audio('sfx_coin',       'assets/sounds/sfx_coin.ogg');
    this.load.audio('sfx_magic',      'assets/sounds/sfx_magic.ogg');
    this.load.audio('sfx_hurt',       'assets/sounds/sfx_hurt.ogg');
    this.load.audio('sfx_disappear',  'assets/sounds/sfx_disappear.ogg');
    this.load.audio('sfx_gem',        'assets/sounds/sfx_gem.ogg');

    // Simple loading bar
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 4, 28, 0xffffff);
    this.load.on('progress', v => bar.setScale(v * (width / 4), 1));
  }

  create() {
    // Register shared animations here (available across all scenes)
    this._createPlayerAnims();
    this._createEnemyAnims();
    this.scene.start('Game');
  }

  _createPlayerAnims() {
    this.anims.create({
      key: 'player-walk',
      frames: [
        { key: 'characters', frame: 'character_beige_walk_a' },
        { key: 'characters', frame: 'character_beige_walk_b' },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'characters', frame: 'character_beige_idle' }],
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-jump',
      frames: [{ key: 'characters', frame: 'character_beige_jump' }],
      frameRate: 1,
      repeat: 0,
    });
  }

  _createEnemyAnims() {
    this.anims.create({
      key: 'goomba-walk',
      frames: [
        { key: 'enemies', frame: 'slime_normal_walk_a' },
        { key: 'enemies', frame: 'slime_normal_walk_b' },
      ],
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'goomba-stomped',
      frames: [{ key: 'enemies', frame: 'slime_normal_flat' }],
      frameRate: 1,
      repeat: 0,
    });
  }
}
