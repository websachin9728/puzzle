// Pure gameplay engine: no React, no audio. A game state is plain JSON so it can
// be saved and resumed. applyMove() returns the next state plus a description of
// what happened (lines cleared, combo, game over...) for the UI to animate.
import { GRID, emptyGrid, canPlace, place, fullLines, clearLines, isEmpty, anyMovePossible } from "./logic";
import { SHAPES, TIERS, cellCount } from "./shapes";

export const PERFECT_BONUS = 1000;
// The combo survives this many placements without a clear, so a player who
// keeps clearing at least once per set of pieces keeps building the streak.
export const COMBO_GRACE_MOVES = 3;
export const COLOR_COUNT = 8;

// ---------- scoring ----------
export function scoreForPlacement(shape) {
  return cellCount(shape) * 10;
}

// 1 line = 100, 2 = 250, 3 = 450, 4 = 700 … (+100 when rows AND columns clear
// together), multiplied by the current combo streak.
export function scoreForClear(lines, crossed, combo) {
  if (lines <= 0) return 0;
  const base = 100 * lines + 25 * lines * (lines - 1) + (crossed ? 100 : 0);
  return base * Math.max(1, combo);
}

// difficulty rises slowly with the score
function levelFor(score) {
  return Math.min(5, Math.floor(score / 5000) + 1);
}

// ---------- piece generation ----------
function tierWeights(level) {
  if (level <= 1) return [2, 5, 3, 1];
  if (level === 2) return [1, 4, 4, 2];
  if (level === 3) return [1, 3, 4, 3];
  if (level === 4) return [1, 2, 4, 4];
  return [1, 2, 3, 5];
}

let rng = Math.random;
export function setRng(fn) {
  rng = fn;
}

function pickTier(level) {
  const w = tierWeights(level);
  let x = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) {
    if (x < w[i]) return i;
    x -= w[i];
  }
  return 0;
}

function makePiece(name, i) {
  return {
    shape: SHAPES[name].map((r) => r.slice()),
    color: 1 + Math.floor(rng() * COLOR_COUNT),
    id: `${Date.now().toString(36)}_${i}_${Math.floor(rng() * 1e9).toString(36)}`,
  };
}

function randomPiece(level, i) {
  const names = TIERS[pickTier(level)];
  return makePiece(names[Math.floor(rng() * names.length)], i);
}

function fits(grid, shape) {
  return anyMovePossible(grid, [shape]);
}

// Three new pieces. Guarantees at least one of them fits the board whenever any
// shape at all could fit, so the game never deals an unfair hand.
export function newTray(level, grid = emptyGrid()) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const tray = [0, 1, 2].map((i) => randomPiece(level, i));
    if (tray.some((p) => fits(grid, p.shape))) return tray;
  }
  const tray = [0, 1, 2].map((i) => randomPiece(level, i));
  const smallToLarge = [...TIERS[0], ...TIERS[1], ...TIERS[2], ...TIERS[3]];
  const name = smallToLarge.find((nm) => fits(grid, SHAPES[nm]));
  if (name) tray[0] = makePiece(name, 0);
  return tray;
}

// ---------- game state ----------
// options.grid: a starting board (Adventure levels begin partly filled)
export function newGame(options = {}) {
  const grid = options.grid ? options.grid.map((r) => r.slice()) : emptyGrid();
  return { grid, tray: newTray(1, grid), score: 0, combo: 0, movesSinceClear: 0, maxCombo: 0, lines: 0, placed: 0 };
}

export function isValidSavedGame(s) {
  return (
    !!s &&
    Array.isArray(s.grid) &&
    s.grid.length === GRID &&
    s.grid.every((r) => Array.isArray(r) && r.length === GRID) &&
    Array.isArray(s.tray) &&
    s.tray.length === 3 &&
    typeof s.score === "number"
  );
}

export function canPieceFit(grid, piece) {
  return !!piece && fits(grid, piece.shape);
}

export function hasMoves(state) {
  return anyMovePossible(state.grid, state.tray.filter(Boolean).map((p) => p.shape));
}

// Simulate a placement for the drag preview: which rows/cols would clear.
export function previewClears(grid, shape, row, col) {
  if (!canPlace(grid, shape, row, col)) return null;
  return fullLines(place(grid, shape, row, col, 1));
}

export function applyMove(state, idx, row, col) {
  const piece = state.tray[idx];
  if (!piece || !canPlace(state.grid, piece.shape, row, col)) return null;

  let grid = place(state.grid, piece.shape, row, col, piece.color);
  const placedCells = [];
  piece.shape.forEach((r, ri) => r.forEach((v, ci) => v && placedCells.push([row + ri, col + ci])));

  const { rows, cols } = fullLines(grid);
  const lines = rows.length + cols.length;
  let combo = state.combo;
  let movesSinceClear = state.movesSinceClear;
  let gained = scoreForPlacement(piece.shape);
  let clearedCells = [];

  if (lines > 0) {
    combo += 1;
    movesSinceClear = 0;
    const before = grid;
    const res = clearLines(grid, rows, cols);
    clearedCells = res.clearedCells.map(([r, c]) => [r, c, before[r][c]]);
    grid = res.grid;
    gained += scoreForClear(lines, rows.length > 0 && cols.length > 0, combo);
  } else {
    movesSinceClear += 1;
    if (movesSinceClear >= COMBO_GRACE_MOVES) combo = 0;
  }

  const perfect = lines > 0 && isEmpty(grid);
  if (perfect) gained += PERFECT_BONUS;

  const score = state.score + gained;
  let tray = state.tray.slice();
  tray[idx] = null;
  if (tray.every((p) => p == null)) tray = newTray(levelFor(score), grid);

  const next = {
    grid,
    tray,
    score,
    combo,
    movesSinceClear,
    maxCombo: Math.max(state.maxCombo, combo),
    lines: state.lines + lines,
    placed: state.placed + 1,
  };

  return {
    state: next,
    result: { piece, placedCells, rows, cols, lines, clearedCells, combo, gained, perfect, gameOver: !hasMoves(next) },
  };
}
