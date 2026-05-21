import Phaser from 'phaser';
import { CANVAS_WIDTH, LEVEL_TIME_START } from '../config/levelConfig.js';

export class HUD extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  create() {
    const textStyle = {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    };

    this.scoreText = this.add.text(16,  12, 'SCORE: 000000', textStyle);
    this.coinsText = this.add.text(220, 12, 'COINS: x00',    textStyle);
    this.livesText = this.add.text(400, 12, 'LIVES: x3',     textStyle);
    this.timeText  = this.add.text(570, 12, 'TIME: 400',     textStyle);

    // Mute toggle button
    this.muteText = this.add.text(CANVAS_WIDTH - 48, 12, '[S]', {
      ...textStyle,
      color: '#ffff00',
    }).setInteractive({ useHandCursor: true });
    this.muteText.on('pointerdown', () => {
      const game = this.scene.get('Game');
      if (game) {
        game._muted = !game._muted;
        game.sound.setMute(game._muted);
        this.muteText.setText(game._muted ? '[M]' : '[S]');
      }
    });

    // Listen for updates from Game scene
    const gameScene = this.scene.get('Game');
    if (gameScene) {
      gameScene.events.on('hud-update', this._onHUDUpdate, this);
    }
  }

  _onHUDUpdate({ score, coins, lives, timeLeft }) {
    this.scoreText.setText(`SCORE: ${String(score).padStart(6, '0')}`);
    this.coinsText.setText(`COINS: x${String(coins).padStart(2, '0')}`);
    this.livesText.setText(`LIVES: x${lives}`);
    this.timeText.setText(`TIME: ${timeLeft}`);

    // Flash time red when low
    this.timeText.setColor(timeLeft <= 100 ? '#ff4444' : '#ffffff');
  }
}
