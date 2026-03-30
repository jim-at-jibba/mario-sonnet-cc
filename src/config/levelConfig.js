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
