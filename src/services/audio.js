// Audio service built on expo-audio. One player per sound effect (re-triggered
// from the start instead of spawning overlapping copies) and two music loops
// (home / game) that cross-fade. Every native call is guarded: audio problems
// must never crash the game.
import { AppState } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Speech from "expo-speech";

const SFX_SOURCES = {
  tap: require("../../assets/audio/tap.wav"),
  pickup: require("../../assets/audio/pickup.wav"),
  place: require("../../assets/audio/place.wav"),
  invalid: require("../../assets/audio/invalid.wav"),
  clearRow: require("../../assets/audio/clear_row.wav"),
  clearCol: require("../../assets/audio/clear_col.wav"),
  combo: require("../../assets/audio/combo.wav"),
  gameover: require("../../assets/audio/gameover.wav"),
  fullclear: require("../../assets/audio/fullclear.wav"),
  combo2: require("../../assets/audio/combo_2.wav"),
  combo3: require("../../assets/audio/combo_3.wav"),
  combo4: require("../../assets/audio/combo_4.wav"),
  combo5: require("../../assets/audio/combo_5.wav"),
  clearMulti: require("../../assets/audio/clear_multi.wav"),
  blast: require("../../assets/audio/blast.wav"),
};

const MUSIC_SOURCES = {
  home: require("../../assets/audio/music_home.wav"),
  game: require("../../assets/audio/music_game.wav"),
};

// per-effect loudness trim
const GAIN = { tap: 0.6, pickup: 0.7 };
// minimum ms between two plays of the same effect
const MIN_GAP = { tap: 50 };

const settings = { music: true, sfx: true, musicVolume: 0.6, sfxVolume: 0.9 };
const sfx = {};
const music = {};
const lastPlayed = {};
const fades = {};
let currentTrack = null;
let pendingTrack = null; // requested before the players were ready
let ready = false;
let appActive = true;
let appStateSub = null;

function safe(fn) {
  try {
    return fn();
  } catch (e) {
    return undefined;
  }
}

export async function initAudio(initial) {
  if (initial) Object.assign(settings, initial);
  if (ready) return;
  await safe(() =>
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false })
  );
  safe(() => {
    for (const k of Object.keys(SFX_SOURCES)) sfx[k] = createAudioPlayer(SFX_SOURCES[k]);
    for (const k of Object.keys(MUSIC_SOURCES)) {
      const p = createAudioPlayer(MUSIC_SOURCES[k]);
      p.loop = true;
      p.volume = 0;
      music[k] = p;
    }
  });
  ready = true;
  if (pendingTrack) playMusic(pendingTrack);
  appStateSub = AppState.addEventListener("change", (s) => {
    const active = s === "active";
    if (active === appActive) return;
    appActive = active;
    const p = currentTrack && music[currentTrack];
    if (!p) return;
    if (!active) safe(() => p.pause());
    else if (settings.music) {
      safe(() => {
        p.volume = settings.musicVolume;
        p.play();
      });
    }
  });
}

function fade(name, to, ms, onDone) {
  const p = music[name];
  if (!p) return;
  clearInterval(fades[name]);
  const from = safe(() => p.volume) ?? 0;
  const steps = Math.max(1, Math.round(ms / 40));
  let i = 0;
  fades[name] = setInterval(() => {
    i += 1;
    safe(() => {
      p.volume = from + ((to - from) * i) / steps;
    });
    if (i >= steps) {
      clearInterval(fades[name]);
      fades[name] = null;
      onDone && onDone();
    }
  }, 40);
}

// Switches the background loop with a cross-fade. Safe to call repeatedly.
export function playMusic(name) {
  if (!ready) {
    pendingTrack = name;
    return;
  }
  if (!music[name]) return;
  const prev = currentTrack;
  currentTrack = name;
  if (prev && prev !== name && music[prev]) {
    fade(prev, 0, 450, () => safe(() => music[prev].pause()));
  }
  if (!settings.music || !appActive) return;
  const p = music[name];
  if (prev !== name) {
    safe(() => {
      p.volume = 0;
      p.seekTo(0);
    });
  }
  safe(() => p.play());
  fade(name, settings.musicVolume, prev && prev !== name ? 900 : 1400);
}

export function playSfx(name) {
  if (!ready || !settings.sfx || settings.sfxVolume <= 0) return;
  const p = sfx[name];
  if (!p) return;
  const now = Date.now();
  if (now - (lastPlayed[name] || 0) < (MIN_GAP[name] || 40)) return;
  lastPlayed[name] = now;
  safe(() => {
    p.volume = Math.min(1, settings.sfxVolume * (GAIN[name] || 1));
    p.seekTo(0);
    p.play();
  });
}

export function applyAudioSettings(next) {
  const musicWasOn = settings.music;
  Object.assign(settings, next);
  if (!ready || !currentTrack) return;
  const p = music[currentTrack];
  if (!p) return;
  if (!settings.music) {
    clearInterval(fades[currentTrack]);
    safe(() => p.pause());
  } else if (!musicWasOn) {
    playMusic(currentTrack);
  } else if (!fades[currentTrack]) {
    safe(() => {
      p.volume = settings.musicVolume;
    });
  }
}

export function releaseAudio() {
  if (appStateSub) appStateSub.remove();
  Object.values(fades).forEach((t) => clearInterval(t));
  [...Object.values(sfx), ...Object.values(music)].forEach((p) => safe(() => p.remove()));
  ready = false;
  currentTrack = null;
}

// Speaks a celebration word ("Excellent!") with the device voice, if sound is on.
export function speak(text) {
  if (!settings.sfx) return;
  safe(() => {
    Speech.stop();
    Speech.speak(text.replace(/[^A-Za-z ]/g, ""), { rate: 0.95, pitch: 1.25, volume: 1 });
  });
}
