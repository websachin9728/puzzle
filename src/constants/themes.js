// Colour themes. The game rotates to the next theme every time the board is
// cleared completely. Each theme: vivid background gradient, deep board with a
// bright frame, and the 8-colour block palette.

const PALETTE = ["#ffd21f", "#ff8a1f", "#ff3d4f", "#2fd65a", "#1fd5ff", "#2f7bff", "#a64dff", "#ff4fb4"];

export const THEMES = [
  { id: "ocean", bg: ["#3a8dff", "#4b53e6", "#6a35d6"], board: "#1b1f5e", cell: "#262d7e", frame: "#8fc2ff", accent: "#ffd21f", palette: PALETTE },
  { id: "sunset", bg: ["#ffa23c", "#ff5e62", "#c13584"], board: "#3a1030", cell: "#4f1a42", frame: "#ffd27a", accent: "#fff27a", palette: PALETTE },
  { id: "grape", bg: ["#c04cff", "#7b2ff7", "#4a1fb8"], board: "#24104f", cell: "#331b6b", frame: "#e3a6ff", accent: "#ffd21f", palette: PALETTE },
  { id: "lagoon", bg: ["#14d6c3", "#1593d6", "#2a52c9"], board: "#0d2e4f", cell: "#143f68", frame: "#8ff5ea", accent: "#ffe14a", palette: PALETTE },
  { id: "candy", bg: ["#ff7eb3", "#e8458a", "#9b2fae"], board: "#3d0f35", cell: "#531a49", frame: "#ffc2dd", accent: "#fff27a", palette: PALETTE },
  { id: "forest", bg: ["#4be38f", "#17a884", "#0f6e86"], board: "#0b3236", cell: "#114649", frame: "#a8ffd0", accent: "#ffe14a", palette: PALETTE },
];

export function getTheme(index) {
  return THEMES[((index % THEMES.length) + THEMES.length) % THEMES.length];
}
