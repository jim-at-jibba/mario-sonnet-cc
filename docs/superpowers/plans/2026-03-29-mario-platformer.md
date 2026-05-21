# Mushroom Kingdom Platformer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-level Mario-style browser platformer using Phaser 3 with procedural level generation, enemy stomping, power-ups, HUD, and audio.

**Architecture:** Phaser 3 Arcade Physics with manual tile placement (no Tiled tilemap). Each column of the level is generated at runtime from a seeded PRNG config. Scenes communicate via Phaser's event emitter (Game → HUD). All pure logic (LevelGenerator) is unit-tested with Vitest; Phaser scenes are tested manually.

**Tech Stack:** Phaser 3.80.0, Vite 5.x, Vitest 1.x, Kenney New Platformer Pack (CC0 assets). Deploy: Netlify static site.

---

## Sprite/Asset Reference

All assets from `kenney_new-platformer-pack-1.1/`. Copy to `public/assets/` before running.

**Atlas keys and frame names used:**

| Atlas key | File pair | Key frames |
|---|---|---|
| `tiles` | `spritesheet-tiles-default.png/.xml` | `terrain_grass_block` (ground fill), `terrain_grass_block_top_left/top_right/top` (surface edges), `terrain_grass_horizontal_left/middle/right` (platforms), `terrain_grass_vertical_top/middle` (pipe subs), `block_coin` (? block active), `block_empty` (? block hit), `bricks_brown` (brick), `brick_brown` (alt brick), `coin_gold`, `mushroom_red` (super), `mushroom_brown` (1-up), `flag_green_a/b` (waving flag), `sign_exit` (level end) |
| `characters` | `spritesheet-characters-default.png/.xml` | `character_beige_idle`, `character_beige_walk_a`, `character_beige_walk_b`, `character_beige_jump` |
| `enemies` | `spritesheet-enemies-default.png/.xml` | `slime_normal_rest`, `slime_normal_walk_a`, `slime_normal_walk_b`, `slime_normal_flat` (stomped) |
| `backgrounds` | `spritesheet-backgrounds-default.png/.xml` | `background_solid_sky` (far layer 0.2x), `background_color_hills` (mid layer 0.5x) |

**Audio files** (copy `Sounds/` folder → `public/assets/sounds/`):
`sfx_jump.ogg`, `sfx_bump.ogg`, `sfx_coin.ogg`, `sfx_magic.ogg`, `sfx_hurt.ogg`, `sfx_disappear.ogg`, `sfx_gem.ogg`

**Sprite sizes:**
- Character frames: 128×128 → rendered at `setDisplaySize(64, 64)`
- Enemy (slime) frames: 64×64 → no scaling needed
- Tile frames: 64×64 → no scaling needed
- Background frames: 256×256 → tiled to fill viewport

---

## File Structure

```
mario-claude-sonnet-cc/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── public/
│   └── assets/
│       ├── spritesheet-tiles-default.png + .xml
│       ├── spritesheet-characters-default.png + .xml
│       ├── spritesheet-enemies-default.png + .xml
│       ├── spritesheet-backgrounds-default.png + .xml
│       └── sounds/
│           ├── sfx_jump.ogg  sfx_bump.ogg  sfx_coin.ogg
│           ├── sfx_magic.ogg  sfx_hurt.ogg  sfx_disappear.ogg
│           └── sfx_gem.ogg
├── src/
│   ├── index.js               Phaser.Game bootstrap — registers scenes, sets canvas size
│   ├── config/
│   │   └── levelConfig.js     TILE_SIZE, world dimensions, LEVEL_CONFIG knobs, GROUND_ROW
│   ├── level/
│   │   └── LevelGenerator.js  Pure-JS procedural generator — returns LevelData object
│   ├── scenes/
│   │   ├── Boot.js            Preloads all atlases and audio; transitions to Game
│   │   ├── Game.js            Main gameplay scene — builds world, runs physics loop
│   │   ├── HUD.js             Fixed overlay scene — score/coins/lives/timer/mute
│   │   ├── GameOver.js        Game over screen with restart button
│   │   └── LevelClear.js      Win screen with score tally and play-again button
│   └── entities/
│       ├── Player.js          Extends Arcade.Sprite — input, physics, coyote, states
│       ├── Goomba.js          Extends Arcade.Sprite — walk AI, stomp/side-hit hooks
│       ├── Coin.js            Extends Arcade.Sprite — static collectible, collect()
│       └── PowerUp.js         Extends Arcade.Sprite — emerges from block, moves, collect()
└── tests/
    └── level/
        └── LevelGenerator.test.js
```

---

## World Dimensions

```
TILE_SIZE        = 64 px
WORLD_WIDTH      = 60 × 64 = 3840 px
WORLD_HEIGHT     = 15 × 64 = 960 px
GROUND_ROW       = 11       (0-indexed from top; row 11 top = y 704)
GROUND_FILL_ROWS = 3        (rows 11-14 are solid ground)
Canvas viewport  = 768 × 576 px (12 × 9 tiles visible)
```

---

## Task 1: Project Setup & Asset Pipeline

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `netlify.toml`
- Create: `public/assets/` (copied from kenney pack)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "mushroom-kingdom",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "3.80.0"
  },
  "devDependencies": {
    "vite": "^5.1.0",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mushroom Kingdom</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/index.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 5: Copy assets from Kenney pack**

```bash
mkdir -p public/assets/sounds
# Copy all 4 spritesheet PNG+XML pairs
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-tiles-default.png public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-tiles-default.xml public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-characters-default.png public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-characters-default.xml public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-enemies-default.png public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-enemies-default.xml public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-backgrounds-default.png public/assets/
cp kenney_new-platformer-pack-1.1/Spritesheets/spritesheet-backgrounds-default.xml public/assets/
# Copy audio
cp kenney_new-platformer-pack-1.1/Sounds/sfx_jump.ogg public/assets/sounds/
cp kenney_new-platformer-pack-1.1/Sounds/sfx_bump.ogg public/assets/sounds/
cp kenney_new-platformer-pack-1.1/Sounds/sfx_coin.ogg public/assets/sounds/
cp kenney_new-platformer-pack-1.1/Sounds/sfx_magic.ogg public/assets/sounds/
cp kenney_new-platformer-pack-1.1/Sounds/sfx_hurt.ogg public/assets/sounds/
cp kenney_new-platformer-pack-1.1/Sounds/sfx_disappear.ogg public/assets/sounds/
cp kenney_new-platformer-pack-1.1/Sounds/sfx_gem.ogg public/assets/sounds/
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, phaser 3.80.0 installed.

- [ ] **Step 7: Verify dev server starts (no src/index.js yet — expect blank page, no crashes)**

```bash
npm run dev
```

Expected: Vite prints `Local: http://localhost:5173`. Browser shows blank black page. No console errors from npm.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.js index.html netlify.toml public/
git commit -m "feat: project scaffold with Vite, Phaser 3.80, and Kenney assets"
```

---

## Task 2: Level Config

**Files:**
- Create: `src/config/levelConfig.js`

- [ ] **Step 1: Create src/config/levelConfig.js**

```js
// Tile and world dimensions
export const TILE_SIZE = 64;
export const WORLD_WIDTH_TILES = 60;
export const WORLD_HEIGHT_TILES = 15;
export const WORLD_WIDTH = WORLD_WIDTH_TILES * TILE_SIZE;   // 3840
export const WORLD_HEIGHT = WORLD_HEIGHT_TILES * TILE_SIZE; // 960

// Ground configuration
// Row 0 = top of world. Ground surface is at row GROUND_ROW.
// Rows GROUND_ROW through GROUND_ROW+GROUND_FILL_ROWS are solid ground tiles.
export const GROUND_ROW = 11;
export const GROUND_FILL_ROWS = 3; // additional rows below surface for fill

// Canvas viewport (12x9 visible tiles)
export const CANVAS_WIDTH = 768;
export const CANVAS_HEIGHT = 576;

// Player physics constants
export const PLAYER_WALK_SPEED = 200;
export const PLAYER_RUN_SPEED = 340;
export const PLAYER_JUMP_VELOCITY = -620;
export const GRAVITY = 900;

// Player feel constants (milliseconds)
export const COYOTE_TIME_MS = 100;
export const JUMP_BUFFER_MS = 80;

// Scoring
export const SCORE_COIN = 10;
export const SCORE_STOMP = 100;

// Timer
export const LEVEL_TIME_START = 400;

// Procedural generation knobs
export const LEVEL_CONFIG = {
  seed: null,           // null = random; set a number to replay the same level
  widthTiles: WORLD_WIDTH_TILES,
  heightTiles: WORLD_HEIGHT_TILES,
  gapFrequency: 0.12,   // probability per tile column of a gap starting
  platformDensity: 0.3, // fraction of columns with a floating platform
  enemyDensity: 0.08,   // enemies per walkable tile column (scales by zone)
  powerUpRate: 0.4,     // fraction of ? blocks that contain a mushroom vs coin
};
```

- [ ] **Step 2: Commit**

```bash
git add src/config/levelConfig.js
git commit -m "feat: level config constants and generation knobs"
```

---

## Task 3: Level Generator (TDD)

**Files:**
- Create: `tests/level/LevelGenerator.test.js`
- Create: `src/level/LevelGenerator.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/level/LevelGenerator.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { LevelGenerator } from '../../src/level/LevelGenerator.js';
import {
  LEVEL_CONFIG,
  GROUND_ROW,
  WORLD_WIDTH_TILES,
} from '../../src/config/levelConfig.js';

const gen = new LevelGenerator();
const cfg = { ...LEVEL_CONFIG, seed: 42 };

describe('LevelGenerator', () => {
  it('returns the expected LevelData structure', () => {
    const data = gen.generate(cfg);
    expect(data).toHaveProperty('groundTiles');
    expect(data).toHaveProperty('platformTiles');
    expect(data).toHaveProperty('questionBlocks');
    expect(data).toHaveProperty('brickBlocks');
    expect(data).toHaveProperty('enemies');
    expect(data).toHaveProperty('coins');
    expect(data).toHaveProperty('endCol');
    expect(Array.isArray(data.groundTiles)).toBe(true);
    expect(Array.isArray(data.platformTiles)).toBe(true);
    expect(Array.isArray(data.enemies)).toBe(true);
  });

  it('ground surface (GROUND_ROW) tiles exist in all non-gap columns', () => {
    const data = gen.generate(cfg);
    const surfaceCols = new Set(
      data.groundTiles.filter(t => t.row === GROUND_ROW).map(t => t.col)
    );
    // Every column with ground fill rows must have a surface tile
    const fillCols = new Set(
      data.groundTiles.filter(t => t.row > GROUND_ROW).map(t => t.col)
    );
    fillCols.forEach(col => expect(surfaceCols.has(col)).toBe(true));
  });

  it('no gaps in the first 4 columns', () => {
    const data = gen.generate(cfg);
    const surfaceCols = new Set(
      data.groundTiles.filter(t => t.row === GROUND_ROW).map(t => t.col)
    );
    for (let col = 0; col < 4; col++) {
      expect(surfaceCols.has(col)).toBe(true);
    }
  });

  it('no gaps in the last 4 columns', () => {
    const data = gen.generate(cfg);
    const surfaceCols = new Set(
      data.groundTiles.filter(t => t.row === GROUND_ROW).map(t => t.col)
    );
    for (let col = cfg.widthTiles - 4; col < cfg.widthTiles; col++) {
      expect(surfaceCols.has(col)).toBe(true);
    }
  });

  it('gaps are at most 3 tiles wide', () => {
    const data = gen.generate(cfg);
    const surfaceCols = new Set(
      data.groundTiles.filter(t => t.row === GROUND_ROW).map(t => t.col)
    );
    let maxGap = 0;
    let currentGap = 0;
    for (let col = 0; col < cfg.widthTiles; col++) {
      if (!surfaceCols.has(col)) {
        currentGap++;
        maxGap = Math.max(maxGap, currentGap);
      } else {
        currentGap = 0;
      }
    }
    expect(maxGap).toBeLessThanOrEqual(3);
  });

  it('platforms are within valid row range (above ground, not at top)', () => {
    const data = gen.generate(cfg);
    data.platformTiles.forEach(p => {
      expect(p.row).toBeGreaterThanOrEqual(GROUND_ROW - 5);
      expect(p.row).toBeLessThan(GROUND_ROW);
    });
  });

  it('enemies only spawn in walkable (non-gap) columns', () => {
    const data = gen.generate(cfg);
    const surfaceCols = new Set(
      data.groundTiles.filter(t => t.row === GROUND_ROW).map(t => t.col)
    );
    data.enemies.forEach(e => {
      expect(surfaceCols.has(e.col)).toBe(true);
    });
  });

  it('endCol is at widthTiles - 2', () => {
    const data = gen.generate(cfg);
    expect(data.endCol).toBe(cfg.widthTiles - 2);
  });

  it('same seed produces identical output', () => {
    const d1 = gen.generate({ ...cfg, seed: 99 });
    const d2 = gen.generate({ ...cfg, seed: 99 });
    expect(d1.groundTiles).toEqual(d2.groundTiles);
    expect(d1.enemies).toEqual(d2.enemies);
    expect(d1.platformTiles).toEqual(d2.platformTiles);
  });

  it('different seeds produce different enemy layouts', () => {
    const d1 = gen.generate({ ...cfg, seed: 1 });
    const d2 = gen.generate({ ...cfg, seed: 2 });
    // It's astronomically unlikely that two different seeds produce identical enemy arrays
    expect(d1.enemies).not.toEqual(d2.enemies);
  });

  it('questionBlocks have a valid contains value', () => {
    const data = gen.generate(cfg);
    data.questionBlocks.forEach(b => {
      expect(['coin', 'mushroom']).toContain(b.contains);
    });
  });

  it('brickBlocks have a valid contains value', () => {
    const data = gen.generate(cfg);
    data.brickBlocks.forEach(b => {
      expect([null, 'oneup']).toContain(b.contains);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npm test
```

Expected: All tests FAIL with "Cannot find module '../../src/level/LevelGenerator.js'"

- [ ] **Step 3: Create src/level/LevelGenerator.js**

```js
/**
 * mulberry32 — fast seedable PRNG. Returns a function that yields [0, 1).
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class LevelGenerator {
  /**
   * generate(config) → LevelData
   *
   * LevelData shape:
   * {
   *   widthTiles, heightTiles,
   *   groundTiles:    [{ col, row }]           solid ground tile positions
   *   platformTiles:  [{ col, row }]           floating platform tile positions
   *   questionBlocks: [{ col, row, contains }] contains: 'coin' | 'mushroom'
   *   brickBlocks:    [{ col, row, contains }] contains: null | 'oneup'
   *   enemies:        [{ col, row }]           spawn positions (row = GROUND_ROW - 1)
   *   coins:          [{ col, row }]           floating coin positions
   *   endCol:         number                   column for the finish sign
   * }
   */
  generate(config) {
    const { widthTiles, heightTiles, gapFrequency, platformDensity, enemyDensity, powerUpRate } = config;
    const rng = mulberry32(config.seed ?? Date.now());

    const GROUND_ROW = heightTiles - 4; // row 11 for heightTiles=15
    const FILL_ROWS = 3;                // rows 12-14 also solid

    // ── Pass 1: determine gap columns ──────────────────────────────────────
    const gapSet = new Set();
    let skipUntil = 4; // no gaps before col 4
    for (let col = 4; col < widthTiles - 4; col++) {
      if (col <= skipUntil) continue;
      if (rng() < gapFrequency) {
        const gapWidth = 2 + Math.floor(rng() * 2); // 2 or 3 tiles
        for (let g = 0; g < gapWidth; g++) {
          if (col + g < widthTiles - 4) gapSet.add(col + g);
        }
        skipUntil = col + gapWidth + 3; // ensure at least 4 solid tiles between gaps
      }
    }

    // ── Pass 2: ground tiles ───────────────────────────────────────────────
    const groundTiles = [];
    for (let col = 0; col < widthTiles; col++) {
      if (gapSet.has(col)) continue;
      for (let r = 0; r <= FILL_ROWS; r++) {
        groundTiles.push({ col, row: GROUND_ROW + r });
      }
    }

    // ── Pass 3: floating platforms ─────────────────────────────────────────
    const platformTiles = [];
    const usedPlatformCols = new Set();
    for (let col = 4; col < widthTiles - 4; col++) {
      if (gapSet.has(col) || usedPlatformCols.has(col)) continue;
      if (rng() < platformDensity) {
        const width = 1 + Math.floor(rng() * 4); // 1–4 tiles wide
        const rowOffset = 3 + Math.floor(rng() * 3); // 3–5 above ground surface
        const row = GROUND_ROW - rowOffset;
        let canPlace = true;
        for (let w = 0; w < width; w++) {
          if (col + w >= widthTiles - 2 || gapSet.has(col + w)) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let w = 0; w < width; w++) {
            platformTiles.push({ col: col + w, row });
            usedPlatformCols.add(col + w);
          }
          col += width; // skip past this platform
        }
      }
    }

    // ── Pass 4: question blocks and brick blocks ───────────────────────────
    const questionBlocks = [];
    const brickBlocks = [];
    for (let col = 2; col < widthTiles - 3; col++) {
      if (gapSet.has(col)) continue;
      if (rng() < 0.10) {
        const contains = rng() < powerUpRate ? 'mushroom' : 'coin';
        questionBlocks.push({ col, row: GROUND_ROW - 2 });
      } else if (rng() < 0.05) {
        const contains = rng() < 0.1 ? 'oneup' : null;
        brickBlocks.push({ col, row: GROUND_ROW - 2, contains });
      }
    }

    // ── Pass 5: enemies (density scales by zone) ──────────────────────────
    const enemies = [];
    for (let col = 4; col < widthTiles - 5; col++) {
      if (gapSet.has(col)) continue;
      const zone = col / widthTiles; // 0→1 across level
      const scaledDensity = enemyDensity * (0.5 + zone * 1.5);
      if (rng() < scaledDensity) {
        enemies.push({ col, row: GROUND_ROW - 1 });
      }
    }

    // ── Pass 6: floating coins ─────────────────────────────────────────────
    const coins = [];
    for (let col = 2; col < widthTiles - 3; col++) {
      if (gapSet.has(col)) continue;
      if (rng() < 0.12) {
        coins.push({ col, row: GROUND_ROW - 2 });
      }
    }

    return {
      widthTiles,
      heightTiles,
      groundTiles,
      platformTiles,
      questionBlocks,
      brickBlocks,
      enemies,
      coins,
      endCol: widthTiles - 2,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests PASS. Output: `Tests 11 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/level/LevelGenerator.js tests/level/LevelGenerator.test.js
git commit -m "feat: procedural level generator with full test coverage"
```

---

## Task 4: Phaser Bootstrap

**Files:**
- Create: `src/index.js`
- Create: `src/scenes/Boot.js`
- Create: `src/scenes/Game.js` (skeleton only — enough to start)
- Create: `src/scenes/HUD.js` (skeleton)
- Create: `src/scenes/GameOver.js` (skeleton)
- Create: `src/scenes/LevelClear.js` (skeleton)

- [ ] **Step 1: Create src/scenes/Boot.js**

```js
export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Spritesheets (Starling/Sparrow XML format — supported natively in Phaser 3.60+)
    this.load.atlas('tiles',       'assets/spritesheet-tiles-default.png',       'assets/spritesheet-tiles-default.xml');
    this.load.atlas('characters',  'assets/spritesheet-characters-default.png',  'assets/spritesheet-characters-default.xml');
    this.load.atlas('enemies',     'assets/spritesheet-enemies-default.png',     'assets/spritesheet-enemies-default.xml');
    this.load.atlas('backgrounds', 'assets/spritesheet-backgrounds-default.png', 'assets/spritesheet-backgrounds-default.xml');

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
```

- [ ] **Step 2: Create src/scenes/Game.js (skeleton)**

```js
export class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    this.add.text(100, 100, 'Game scene loading...', { color: '#ffffff' });
    // Full implementation in Tasks 6-13
  }

  update(time, delta) {}
}
```

- [ ] **Step 3: Create src/scenes/HUD.js (skeleton)**

```js
export class HUD extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  create() {
    // Full implementation in Task 11
  }
}
```

- [ ] **Step 4: Create src/scenes/GameOver.js (skeleton)**

```js
export class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create() {
    // Full implementation in Task 12
  }
}
```

- [ ] **Step 5: Create src/scenes/LevelClear.js (skeleton)**

```js
export class LevelClear extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelClear' });
  }

  create() {
    // Full implementation in Task 12
  }
}
```

- [ ] **Step 6: Create src/index.js**

```js
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
```

- [ ] **Step 7: Verify in browser**

```bash
npm run dev
```

Expected: Canvas renders with "Game scene loading..." text. No console errors about missing assets (assets are in `public/assets/`).

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: Phaser bootstrap with Boot preload scene and scene skeletons"
```

---

## Task 5: Player Entity

**Files:**
- Create: `src/entities/Player.js`
- Modify: `src/scenes/Game.js` (add Player to the world temporarily for testing)

- [ ] **Step 1: Create src/entities/Player.js**

```js
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
```

- [ ] **Step 2: Update src/scenes/Game.js to place Player for visual testing**

```js
import { Player } from '../entities/Player.js';
import { TILE_SIZE, GROUND_ROW, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/levelConfig.js';

export class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Temporary flat ground for player testing
    const ground = this.physics.add.staticGroup();
    for (let col = 0; col < 15; col++) {
      ground.create(
        col * TILE_SIZE + TILE_SIZE / 2,
        GROUND_ROW * TILE_SIZE + TILE_SIZE / 2,
        'tiles', 'terrain_grass_block'
      );
    }
    ground.refresh();

    this.player = new Player(this, TILE_SIZE * 2, GROUND_ROW * TILE_SIZE - TILE_SIZE / 2);
    this.physics.add.collider(this.player, ground);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  update(time, delta) {
    this.player.update(time, delta);
  }
}
```

- [ ] **Step 3: Manual test in browser**

```bash
npm run dev
```

Expected:
- Player character appears on screen standing on flat ground tiles.
- Arrow keys / WASD move the player left and right.
- Space / Up / W jumps with a satisfying arc.
- Jump feels weighty (fast rise, slightly slower fall due to velocity cut).
- Holding Shift runs faster.
- Player faces left when moving left.

- [ ] **Step 4: Commit**

```bash
git add src/entities/Player.js src/scenes/Game.js
git commit -m "feat: Player entity with coyote time, jump buffering, and super/dead states"
```

---

## Task 6: Game Scene — Full World Construction

**Files:**
- Modify: `src/scenes/Game.js` (replace skeleton with full world-building implementation)

- [ ] **Step 1: Replace src/scenes/Game.js with full implementation**

```js
import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Goomba } from '../entities/Goomba.js';
import { Coin } from '../entities/Coin.js';
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

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Game state
    this.score    = 0;
    this.coins    = 0;
    this.lives    = 3;
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
    const colCounts = {}; // track platform width per starting col

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

    // Animated flag above sign
    this.flag = this.add.sprite(
      endCol * TILE_SIZE + TILE_SIZE / 2,
      GROUND_ROW * TILE_SIZE - TILE_SIZE * 1.5,
      'tiles', 'flag_green_a'
    );
    this.tweens.add({
      targets: this.flag,
      frame: { from: 0, to: 1 },
      duration: 400,
      repeat: -1,
      yoyo: true,
      onYoyo: () => this.flag.setTexture('tiles', 'flag_green_b'),
      onRepeat: () => this.flag.setTexture('tiles', 'flag_green_a'),
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
      const coin = this.coinGroup.create(
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
    // Only trigger when player hits from below
    if (player.body.velocity.y >= 0) return;
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
        this.scene.restart();
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
```

- [ ] **Step 2: Manual test (Goomba, Coin, PowerUp don't exist yet — Game.js will throw)**

The Game.js imports entities that don't exist yet. Create empty stubs so it doesn't crash:

Create `src/entities/Goomba.js` (stub):
```js
export class Goomba extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemies', 'slime_normal_rest');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('stomped', false);
  }
  stomp() {
    this.setData('stomped', true);
    this.play('goomba-stomped');
    this.scene.time.delayedCall(400, () => this.destroy());
  }
  preUpdate(time, delta) { super.preUpdate(time, delta); }
}
```

Create `src/entities/Coin.js` (stub):
```js
export class Coin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'tiles', 'coin_gold');
    scene.add.existing(this);
  }
}
```

Create `src/entities/PowerUp.js` (stub):
```js
export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const frame = type === 'super' ? 'mushroom_red' : 'mushroom_brown';
    super(scene, x, y, 'tiles', frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('type', type);
  }
  preUpdate(time, delta) { super.preUpdate(time, delta); }
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Expected:
- Full level rendered: ground tiles, platforms, question blocks, brick blocks, coins, enemies.
- Player placed at start, camera follows.
- Parallax background scrolls at different rates.
- End sign visible near the right edge of the level.
- Console shows no errors.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/Game.js src/entities/Goomba.js src/entities/Coin.js src/entities/PowerUp.js
git commit -m "feat: Game scene full world construction with all entity stubs"
```

---

## Task 7: Parallax Background (already included in Task 6 — verify only)

- [ ] **Step 1: Verify parallax in browser**

Run `npm run dev` and scroll to the right. Confirm:
- Far layer (`background_solid_sky`) scrolls slowly (0.2× camera speed).
- Mid layer (`background_color_hills`) scrolls faster (0.5× camera speed).
- No seams or gaps in the background tiles.

If parallax is not working: ensure `bgFar.setTilePosition(this.cameras.main.scrollX * 0.2)` is called in `update()`.

---

## Task 8: Goomba Enemy (Full Implementation)

**Files:**
- Modify: `src/entities/Goomba.js` (replace stub with full implementation)

- [ ] **Step 1: Replace src/entities/Goomba.js with full implementation**

```js
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
```

- [ ] **Step 2: Verify in browser**

Expected:
- Goombas walk left, reverse when hitting walls.
- Goombas reverse at platform edges (don't walk off).
- Player can stomp a Goomba: land on top → Goomba squashes and disappears.
- Player side-touching Goomba → player flashes (invincibility period visible).
- Score increases by 100 on stomp.

- [ ] **Step 3: Commit**

```bash
git add src/entities/Goomba.js
git commit -m "feat: Goomba walk AI with edge reversal, stomp kill, and side damage"
```

---

## Task 9: Coin Collection (Full Implementation)

The static coin group is already set up in Game.js via `this.coinGroup`. The overlap handler `_onCollectCoin` is already wired. The stub `Coin.js` entity is not used by the static group (staticGroup.create returns plain GameObjects). Verify collectibles work.

- [ ] **Step 1: Verify coin collection in browser**

Expected:
- Walking through a floating `coin_gold` sprite destroys it and increments score/coins in the HUD (HUD is a stub at this point, so check via `console.log` in `_onCollectCoin` if needed).
- Block hits that spawn coins: jump into a `?` block from below → coin pops up and disappears after 600ms → coins counter increments.

If coins are not being collected: check that `this.coinGroup.refresh()` is called after creation in `_buildCoins()`.

- [ ] **Step 2: Remove src/entities/Coin.js (unused stub)**

```bash
rm src/entities/Coin.js
```

Update `src/scenes/Game.js` import — remove the `Coin` import line:
```js
// Remove: import { Coin } from '../entities/Coin.js';
```

- [ ] **Step 3: Commit**

```bash
git add src/scenes/Game.js
git rm src/entities/Coin.js
git commit -m "feat: coin collection working; remove unused Coin.js stub"
```

---

## Task 10: PowerUp System (Full Implementation)

**Files:**
- Modify: `src/entities/PowerUp.js` (replace stub)

- [ ] **Step 1: Replace src/entities/PowerUp.js**

```js
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
```

- [ ] **Step 2: Verify in browser**

Expected:
- Jumping into a `?` block that contains 'mushroom': mushroom pops up smoothly, then rolls along the ground, reversing at walls.
- Player walking into mushroom → player grows (scale tween), score +1000.
- Jumping into a brick block with 'oneup': brown mushroom pops up. Collecting it → lives +1.

- [ ] **Step 3: Commit**

```bash
git add src/entities/PowerUp.js
git commit -m "feat: PowerUp entity with emerge tween and directional rolling"
```

---

## Task 11: HUD Scene

**Files:**
- Modify: `src/scenes/HUD.js` (replace skeleton with full implementation)

- [ ] **Step 1: Replace src/scenes/HUD.js**

```js
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
```

- [ ] **Step 2: Verify in browser**

Expected:
- HUD appears at top of screen as a fixed overlay (doesn't scroll with camera).
- SCORE, COINS, LIVES, TIME all display correctly.
- Collecting coins updates the COINS and SCORE counters in real time.
- TIME counts down each second.
- Clicking `[S]` mutes all game audio; shows `[M]`. Clicking again unmutes.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/HUD.js
git commit -m "feat: HUD overlay with score, coins, lives, timer, and mute toggle"
```

---

## Task 12: GameOver + LevelClear Screens

**Files:**
- Modify: `src/scenes/GameOver.js`
- Modify: `src/scenes/LevelClear.js`

- [ ] **Step 1: Replace src/scenes/GameOver.js**

```js
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
```

- [ ] **Step 2: Replace src/scenes/LevelClear.js**

```js
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
```

- [ ] **Step 3: Verify both screens in browser**

Test GameOver: Let timer reach 0, or walk into a gap. Expected:
- "GAME OVER" screen appears with current score.
- PLAY AGAIN button restarts the game.
- Button highlights on hover.

Test LevelClear: Reach the end sign. Expected:
- sfx_gem plays.
- "LEVEL CLEAR!" screen with score counting up from 0.
- COINS shown. PLAY AGAIN works.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameOver.js src/scenes/LevelClear.js
git commit -m "feat: GameOver and LevelClear screens with score tally"
```

---

## Task 13: Audio Integration

Audio is already wired throughout Game.js (sfx calls in collision handlers). This task verifies coverage and ensures all events have sound.

- [ ] **Step 1: Verify audio events in browser**

Walk through each event and confirm the correct sound plays:

| Action | Expected sound |
|---|---|
| Press jump | `sfx_jump` (boing) |
| Collect floating coin | `sfx_coin` |
| Coin pops from ? block | `sfx_coin` |
| Hit ? block (bump) | `sfx_bump` |
| Collect mushroom | `sfx_magic` |
| Player takes damage | `sfx_hurt` |
| Stomp enemy | `sfx_disappear` |
| Reach end sign | `sfx_gem` |

- [ ] **Step 2: Add sfx_hurt on player death in Player.js (already included) — verify**

In `Player.js`, `die()` already calls `this.scene.sound.play('sfx_hurt')`. Confirm the death sound fires when the player falls into a gap.

- [ ] **Step 3: Verify mute toggle works for all sounds**

Click `[S]` in HUD → all game sounds stop. Click again → sounds resume. Confirm `game.sound.setMute()` affects all channels.

- [ ] **Step 4: Commit (only if any audio fixes were needed)**

```bash
git add src/
git commit -m "fix: verify and confirm full audio coverage for all game events"
```

---

## Task 14: Final Polish & Integration Test

**Files:**
- Modify: `src/config/levelConfig.js` (set physics debug to false — already is)
- Verify: `netlify.toml`

- [ ] **Step 1: Full game loop test**

Run through the complete game loop manually:

1. Start: Player spawns at left, full level generated, HUD shows SCORE:000000 COINS:x00 LIVES:x3 TIME:400.
2. Collect 3 coins → SCORE: 000030, COINS: x03.
3. Jump into ? block → coin pops up → SCORE: 000040, COINS: x04.
4. Jump into mushroom ? block → mushroom rolls out → collect → player grows (scale tween), SCORE: 001040.
5. Walk into Goomba while Super → shrink back to small, player flashes for 2 seconds.
6. Stomp Goomba → squash anim, +100 pts.
7. Walk into gap → fall off → death sound → lives drop to 2 → scene restarts.
8. Let timer reach 0 → player dies → lives drop → restart.
9. Reach end sign → sfx_gem → LevelClear screen with correct score tally.
10. 0 lives → GameOver screen → PLAY AGAIN restarts cleanly.

Expected: All 10 scenarios work without errors in the browser console.

- [ ] **Step 2: Verify no-backtrack camera**

Walk right for a few screens, then try walking left. Expected: player cannot push the camera to scroll left past the furthest-left position the camera has reached.

- [ ] **Step 3: Run unit tests one final time**

```bash
npm test
```

Expected: 11 tests pass (LevelGenerator tests). Zero failures.

- [ ] **Step 4: Production build check**

```bash
npm run build
```

Expected: `dist/` folder created. No build errors. Check `dist/` contains `index.html` and `assets/` folder with hashed JS/CSS files plus unhashed assets from `public/`.

- [ ] **Step 5: Preview production build**

```bash
npm run preview
```

Open `http://localhost:4173`. Confirm the production build plays identically to dev.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete Mushroom Kingdom platformer v1 — all game systems integrated"
```

---

## Self-Review Checklist

### Spec Coverage

| PRD Section | Task |
|---|---|
| Player controls (arrows, WASD, space, shift) | Task 5 |
| Jump arc (coyote time 100ms, jump buffer 80ms) | Task 5 |
| Linear left-to-right level ~60 tiles | Task 3, 6 |
| Opening/mid/climax/end zones (enemy density scales) | Task 3 |
| Ground, platforms, brick, question blocks | Tasks 3, 6 |
| Parallax background (2 layers, 0.2× and 0.5×) | Task 6, 7 |
| Goomba: walk, reverse, stomp, side-hit | Task 8 |
| Coin: floating + from ? block, +10 pts | Tasks 6, 9 |
| Super Mushroom: grows player, 1-hit buffer | Tasks 6, 10 |
| 1-Up Mushroom: +1 life | Tasks 6, 10 |
| Camera follow + no-backtrack | Task 6 (update()) |
| HUD: SCORE, COINS, LIVES, TIME | Task 11 |
| Timer countdown, 0 → death | Tasks 6, 11 |
| GameOver: 0 lives → screen + restart | Tasks 6, 12 |
| LevelClear: flag touch → screen + score tally | Tasks 6, 12 |
| Audio: all 7 events | Task 13 |
| Mute toggle | Tasks 11, 13 |
| Vite build + netlify.toml | Tasks 1, 14 |
| Procedural generation knobs in levelConfig | Task 2, 3 |
| Seeded PRNG for reproducible levels | Task 3 |

All PRD requirements are covered.

### Known Deviations from PRD

- **Pipes**: No pipe sprites in Kenney pack. The generator was simplified to exclude pipes; use platforms and vertical terrain for visual variety instead.
- **Fire Flower / fireball**: Marked stretch goal in PRD (v1.1). Not implemented.
- **Koopa**: Marked stretch goal in PRD (v1.1). Not implemented.
- **BGM (background music)**: PRD lists a looping overworld BGM but the Kenney Sounds pack does not include a music track. SFX only for v1; add BGM separately if a `.ogg` music file is sourced.

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-03-29-mario-platformer.md`.**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, with checkpoints.

Which approach?
