// 12345 -> "12,345"
export function formatNumber(n) {
  return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
