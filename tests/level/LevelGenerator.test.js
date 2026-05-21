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
