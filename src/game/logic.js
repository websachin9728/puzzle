import { SHAPES, TIERS, cellCount } from "./shapes";

export const GRID = 8; // 8x8 board = 64 cells

// ---------- grid helpers ----------
export function emptyGrid() {
  return Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

// value 0 = empty, otherwise a color index (>=1) identifying the piece color
export function canPlace(grid, shape, row, col) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const gr = row + r;
      const gc = col + c;
      if (gr < 0 || gr >= GRID || gc < 0 || gc >= GRID) return false;
      if (grid[gr][gc] !== 0) return false;
    }
  }
  return true;
}

// Returns a NEW grid with the shape placed. Caller must have checked canPlace.
export function place(grid, shape, row, col, colorIndex) {
  const next = grid.map((r) => r.slice());
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) next[row + r][col + c] = colorIndex;
    }
  }
  return next;
}

// Find full rows & columns. Returns {rows:[], cols:[]} of indices.
export function fullLines(grid) {
  const rows = [];
  const cols = [];
  for (let r = 0; r < GRID; r++) {
    if (grid[r].every((v) => v !== 0)) rows.push(r);
  }
  for (let c = 0; c < GRID; c++) {
    let full = true;
    for (let r = 0; r < GRID; r++) {
      if (grid[r][c] === 0) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }
  return { rows, cols };
}

// Clear the given rows/cols. Returns {grid, clearedCells:[[r,c],...]}
export function clearLines(grid, rows, cols) {
  const next = grid.map((r) => r.slice());
  const cleared = [];
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (rowSet.has(r) || colSet.has(c)) {
        if (next[r][c] !== 0) cleared.push([r, c]);
        next[r][c] = 0;
      }
    }
  }
  return { grid: next, clearedCells: cleared };
}

export function isEmpty(grid) {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++) if (grid[r][c] !== 0) return false;
  return true;
}

// Can ANY of the remaining tray pieces be placed anywhere? If not -> game over.
export function anyMovePossible(grid, trayShapes) {
  for (const shape of trayShapes) {
    if (!shape) continue;
    for (let r = 0; r <= GRID - shape.length; r++) {
      for (let c = 0; c <= GRID - shape[0].length; c++) {
        if (canPlace(grid, shape, r, c)) return true;
      }
    }
  }
  return false;
}

