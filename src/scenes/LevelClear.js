import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/levelConfig.js';

export class LevelClear extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelClear' });
  }

  create({ score = 0, coins = 0 } = {}) {
    const cx = CANVAS_WIDTH  / 2;
    const cy = CANVAS_HEIGHT / 2;

    this.add.rectangle(cx, cy, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.65);

    this.add.text(cx, cy - 100, 'LEVEL CLEAR!', {
      fontFamily: 'monospace',
      fontSize: '42px',
      color: '#44ff44',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Score tally (animate counting up)
    const finalScore = score;
    let displayed = 0;
    const scoreText = this.add.text(cx, cy - 20, 'SCORE: 000000', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 30, `COINS: x${String(coins).padStart(2, '0')}`, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Count-up tween for score
    this.tweens.addCounter({
      from: 0,
      to: finalScore,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        displayed = Math.floor(tween.getValue());
        scoreText.setText(`SCORE: ${String(displayed).padStart(6, '0')}`);
      },
    });

    const btn = this.add.text(cx, cy + 100, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setScale(1.1));
    btn.on('pointerout',   () => btn.setScale(1.0));
    btn.on('pointerdown',  () => {
      this.scene.stop('LevelClear');
      this.scene.start('Game');
    });
  }
}
