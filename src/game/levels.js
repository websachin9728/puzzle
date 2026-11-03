// Adventure levels. Each level starts with a partly filled board (generated
// deterministically from the level number, so it's the same every time) and a
// target score; reaching the target wins the level.
import { GRID, emptyGrid, fullLines } from "./logic";

export const LEVEL_COUNT = 100;

// small seeded PRNG (mulberry32)
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function levelTarget(n) {
  return 1000 + (n - 1) * 300;
}

export function levelGrid(n) {
  const rnd = seeded(n * 9973 + 17);
  const density = Math.min(0.42, 0.14 + n * 0.003);
  const g = emptyGrid();
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (rnd() < density) g[r][c] = 1 + Math.floor(rnd() * 8);
  // a starting board must not contain complete lines
  for (;;) {
    const { rows, cols } = fullLines(g);
    if (!rows.length && !cols.length) break;
    rows.forEach((r) => (g[r][Math.floor(rnd() * GRID)] = 0));
    cols.forEach((c) => (g[Math.floor(rnd() * GRID)][c] = 0));
  }
  return g;
}
