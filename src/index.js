import Phaser from 'phaser';
import { Boot }       from './scenes/Boot.js';
import { Game }       from './scenes/Game.js';
import { HUD }        from './scenes/HUD.js';
import { GameOver }   from './scenes/GameOver.js';
import { LevelClear } from './scenes/LevelClear.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from './config/levelConfig.js';

const config = {
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: '#5c94fc',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GRAVITY },
      debug: false,
    },
  },
  scene: [Boot, Game, HUD, GameOver, LevelClear],
};

new Phaser.Game(config);
