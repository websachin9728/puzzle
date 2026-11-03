// Block shapes (polyominoes). Each shape is a matrix of 0/1.
// Grouped by difficulty tier so higher levels can bias toward bigger pieces.

export const SHAPES = {
  // --- Tier 0: tiny ---
  single: [[1]],
  domino_h: [[1, 1]],
  domino_v: [[1], [1]],

  // --- Tier 1: small ---
  tri_h: [[1, 1, 1]],
  tri_v: [[1], [1], [1]],
  corner_sm: [
    [1, 0],
    [1, 1],
  ],
  corner_sm2: [
    [0, 1],
    [1, 1],
  ],
  corner_sm3: [
    [1, 1],
    [1, 0],
  ],
  corner_sm4: [
    [1, 1],
    [0, 1],
  ],
  square2: [
    [1, 1],
    [1, 1],
  ],

  // --- Tier 2: medium ---
  line4_h: [[1, 1, 1, 1]],
  line4_v: [[1], [1], [1], [1]],
  L3a: [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  L3b: [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  L3c: [
    [1, 1],
    [1, 0],
    [1, 0],
  ],
  L3d: [
    [1, 1],
    [0, 1],
    [0, 1],
  ],
  T: [
    [1, 1, 1],
    [0, 1, 0],
  ],
  T2: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],

  // --- Tier 3: large ---
  line5_h: [[1, 1, 1, 1, 1]],
  line5_v: [[1], [1], [1], [1], [1]],
  bigL_a: [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1],
  ],
  bigL_b: [
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  bigL_c: [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0],
  ],
  bigL_d: [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  square3: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  plus: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  rect23: [
    [1, 1, 1],
    [1, 1, 1],
  ],
};

export const TIERS = {
  0: ["single", "domino_h", "domino_v"],
  1: [
    "tri_h",
    "tri_v",
    "corner_sm",
    "corner_sm2",
    "corner_sm3",
    "corner_sm4",
    "square2",
  ],
  2: ["line4_h", "line4_v", "L3a", "L3b", "L3c", "L3d", "T", "T2", "S", "Z"],
  3: [
    "line5_h",
    "line5_v",
    "bigL_a",
    "bigL_b",
    "bigL_c",
    "bigL_d",
    "square3",
    "plus",
    "rect23",
  ],
};

// cells = number of filled cells in a shape
export function cellCount(matrix) {
  let n = 0;
  for (const row of matrix) for (const v of row) if (v) n += 1;
  return n;
}
