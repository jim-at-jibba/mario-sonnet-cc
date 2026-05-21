import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/levelConfig.js';

export class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create({ score = 0 } = {}) {
    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;

    // Semi-transparent overlay
    this.add.rectangle(cx, cy, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.65);

    this.add.text(cx, cy - 80, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, `SCORE: ${String(score).padStart(6, '0')}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 60, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setScale(1.1));
    btn.on('pointerout',   () => btn.setScale(1.0));
    btn.on('pointerdown',  () => {
      this.scene.stop('GameOver');
      this.scene.start('Game');
    });
  }
}
