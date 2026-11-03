// Achievements are unlocked automatically from the player's stats — nothing to claim.
const s = (k) => (p) => p.stats[k] || 0;

export const ACHIEVEMENTS = [
  { id: "score1", icon: "⭐", title: "Rising Star", desc: "Score 5,000 in Classic", value: (p) => p.bestScore, target: 5000 },
  { id: "score2", icon: "🌟", title: "High Scorer", desc: "Score 20,000 in Classic", value: (p) => p.bestScore, target: 20000 },
  { id: "score3", icon: "🏆", title: "Legend", desc: "Score 50,000 in Classic", value: (p) => p.bestScore, target: 50000 },
  { id: "combo1", icon: "🔥", title: "Combo Starter", desc: "Reach a combo of 5", value: s("bestCombo"), target: 5 },
  { id: "combo2", icon: "☄️", title: "Combo King", desc: "Reach a combo of 15", value: s("bestCombo"), target: 15 },
  { id: "lines1", icon: "📏", title: "Line Cleaner", desc: "Clear 100 lines", value: s("lines"), target: 100 },
  { id: "lines2", icon: "🧱", title: "Line Master", desc: "Clear 1,000 lines", value: s("lines"), target: 1000 },
  { id: "perfect", icon: "✨", title: "Clean Sweep", desc: "Clear the whole board", value: s("perfects"), target: 1 },
  { id: "adv1", icon: "🗺️", title: "Explorer", desc: "Complete 10 Adventure levels", value: (p) => p.adventureLevel - 1, target: 10 },
  { id: "adv2", icon: "🧭", title: "Adventurer", desc: "Complete 50 Adventure levels", value: (p) => p.adventureLevel - 1, target: 50 },
  { id: "adv3", icon: "👑", title: "Champion", desc: "Complete all 100 levels", value: (p) => p.adventureLevel - 1, target: 100 },
  { id: "daily1", icon: "📅", title: "On a Roll", desc: "Win 3 days in a row", value: (p) => p.daily.best, target: 3 },
  { id: "daily2", icon: "🗓️", title: "Unstoppable", desc: "Win 7 days in a row", value: (p) => p.daily.best, target: 7 },
];

export function achievementList(profile) {
  return ACHIEVEMENTS.map((a) => {
    const progress = Math.min(a.target, Math.max(0, a.value(profile)));
    return { ...a, progress, done: progress >= a.target };
  });
}
