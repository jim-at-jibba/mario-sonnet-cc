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
        questionBlocks.push({ col, row: GROUND_ROW - 2, contains });
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
