// Small hex color helpers used to derive 3D block shading from a base color.
function parse(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// amount > 0 lightens toward white, < 0 darkens toward black (range -1..1)
export function shade(hex, amount) {
  const [r, g, b] = parse(hex);
  if (amount >= 0) return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  const k = 1 + amount;
  return toHex(r * k, g * k, b * k);
}

export function alpha(hex, a) {
  const [r, g, b] = parse(hex);
  return `rgba(${r},${g},${b},${a})`;
}
