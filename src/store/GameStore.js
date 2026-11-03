// Small persistent store: best score, settings, current theme and the game in
// progress. Saved to AsyncStorage (debounced, flushed when the app backgrounds).
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidSavedGame } from "../game/engine";
import { getTheme } from "../constants/themes";
import { applyAudioSettings } from "../services/audio";
import { setHapticsEnabled } from "../services/haptics";

const STORAGE_KEY = "blockpop.profile.v3";
const OLD_KEYS = ["blockpop.profile.v2", "blockpop.bestScore"];

export function defaultProfile() {
  return {
    version: 3,
    bestScore: 0,
    gamesPlayed: 0,
    theme: 0,
    adventureLevel: 1, // next Adventure level to play (all below it are completed)
    daily: { lastWinDay: null, streak: 0, best: 0 }, // consecutive days with a level win
    stats: { lines: 0, bestCombo: 0, perfects: 0 },
    settings: { sound: true, music: true, vibration: true },
    savedGame: null,
  };
}

function hydrate(saved) {
  const d = defaultProfile();
  const p = {
    ...d,
    ...saved,
    settings: { ...d.settings, ...(saved && saved.settings) },
    daily: { ...d.daily, ...(saved && saved.daily) },
    stats: { ...d.stats, ...(saved && saved.stats) },
  };
  if (!isValidSavedGame(p.savedGame)) p.savedGame = null;
  return p;
}

async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return hydrate(JSON.parse(raw));
    // carry the best score and sound settings over from older versions
    const p = defaultProfile();
    const v2 = await AsyncStorage.getItem(OLD_KEYS[0]);
    if (v2) {
      const o = JSON.parse(v2);
      p.bestScore = o.bestScore || 0;
      if (o.settings) p.settings = { sound: o.settings.sfx !== false, music: o.settings.music !== false, vibration: o.settings.vibration !== false };
    } else {
      p.bestScore = parseInt((await AsyncStorage.getItem(OLD_KEYS[1])) || "0", 10) || 0;
    }
    return p;
  } catch (e) {
    return defaultProfile();
  }
}

function applyDeviceSettings(s) {
  applyAudioSettings({ music: s.music, sfx: s.sound });
  setHapticsEnabled(s.vibration);
}

// local calendar day, e.g. "2026-10-31"
export function dayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// current consecutive-days streak (0 if the last win was before yesterday)
export function dailyStreak(profile) {
  const { lastWinDay, streak } = profile.daily;
  return lastWinDay === dayKey(0) || lastWinDay === dayKey(-1) ? streak : 0;
}

const StoreContext = createContext(null);

export function GameStoreProvider({ children }) {
  const [profile, setProfile] = useState(defaultProfile);
  const [ready, setReady] = useState(false);
  const ref = useRef(profile);
  const saveTimer = useRef(null);

  const flush = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = null;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ref.current)).catch(() => {});
  };
  const commit = (next) => {
    ref.current = next;
    setProfile(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, 400);
  };

  useEffect(() => {
    let alive = true;
    loadProfile().then((p) => {
      if (!alive) return;
      applyDeviceSettings(p.settings);
      commit(p);
      setReady(true);
    });
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active" && saveTimer.current) flush();
    });
    return () => {
      alive = false;
      sub.remove();
      if (saveTimer.current) flush();
    };
  }, []);

  const actions = useMemo(() => {
    const get = () => ref.current;
    return {
      get,
      setBest: (score) => {
        if (score > get().bestScore) commit({ ...get(), bestScore: score });
      },
      saveGame: (state) => commit({ ...get(), savedGame: state }),
      clearSavedGame: () => {
        if (get().savedGame) commit({ ...get(), savedGame: null });
      },
      finishGame: (score) => {
        const p = get();
        commit({ ...p, savedGame: null, gamesPlayed: p.gamesPlayed + 1, bestScore: Math.max(p.bestScore, score) });
        flush();
      },
      // stats used by achievements
      recordMove: (r) => {
        const p = get();
        if (!r.lines) return;
        commit({
          ...p,
          stats: {
            lines: p.stats.lines + r.lines,
            bestCombo: Math.max(p.stats.bestCombo, r.combo),
            perfects: p.stats.perfects + (r.perfect ? 1 : 0),
          },
        });
      },
      // an Adventure level was won: unlock the next one and count today's victory
      completeLevel: (n) => {
        const p = get();
        const today = dayKey(0);
        let daily = p.daily;
        if (daily.lastWinDay !== today) {
          const streak = daily.lastWinDay === dayKey(-1) ? daily.streak + 1 : 1;
          daily = { lastWinDay: today, streak, best: Math.max(daily.best, streak) };
        }
        commit({ ...p, adventureLevel: Math.max(p.adventureLevel, n + 1), daily });
        flush();
      },
      nextTheme: () => commit({ ...get(), theme: (get().theme + 1) % 1000 }),
      updateSettings: (partial) => {
        const settings = { ...get().settings, ...partial };
        applyDeviceSettings(settings);
        commit({ ...get(), settings });
      },
    };
  }, []);

  const value = useMemo(() => ({ profile, ready, ...actions }), [profile, ready, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export function useTheme() {
  return getTheme(useStore().profile.theme);
}
