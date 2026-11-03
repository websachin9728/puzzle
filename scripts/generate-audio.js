// Generates every sound effect and music loop used by the game.
// All audio is synthesized from scratch here (oscillators + envelopes), so it is
// 100% original and copyright-free. Re-run with:  node scripts/generate-audio.js
const fs = require("fs");
const path = require("path");

const SR = 22050;
const OUT = path.join(__dirname, "..", "assets", "audio");

// ---------- primitives ----------
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// "A4", "C#5", "Bb3" -> midi
function n(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  let v = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return v + (parseInt(m[3], 10) + 1) * 12;
}

function wave(type, ph) {
  const x = ph * 2 * Math.PI;
  switch (type) {
    case "sine":
      return Math.sin(x);
    case "tri":
      return (2 / Math.PI) * Math.asin(Math.sin(x));
    case "saw": {
      // soft additive saw (few harmonics, no harsh aliasing)
      let s = 0;
      for (let k = 1; k <= 6; k++) s += Math.sin(k * x) / k;
      return s * 0.55;
    }
    case "square": {
      let s = 0;
      for (let k = 1; k <= 7; k += 2) s += Math.sin(k * x) / k;
      return s * 0.8;
    }
    case "bell":
      return Math.sin(x) * 0.7 + Math.sin(2.76 * x) * 0.2 + Math.sin(5.4 * x) * 0.1;
    default:
      return Math.sin(x);
  }
}

function makeBuf(seconds) {
  return new Float32Array(Math.round(seconds * SR));
}

// Adds one note into buf. With wrap=true writes past the end wrap to the start,
// which makes music loops perfectly seamless (tails continue into bar 1).
function tone(buf, t0, dur, freq, o = {}) {
  const {
    type = "sine",
    vol = 0.3,
    a = 0.005,
    d = 0.1,
    s = 0.6,
    r = 0.1,
    glideTo = null,
    lp = 1, // one-pole lowpass coefficient (1 = off)
    vib = 0,
    vibRate = 5,
    detune = 0,
    wrap = false,
  } = o;
  const total = dur + r;
  const N = Math.round(total * SR);
  const start = Math.round(t0 * SR);
  let ph = 0;
  let ph2 = 0;
  let y = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let env;
    if (t < a) env = t / a;
    else if (t < a + d) env = 1 - (1 - s) * ((t - a) / d);
    else if (t < dur) env = s;
    else env = s * Math.max(0, 1 - (t - dur) / r);
    let f = glideTo ? freq + (glideTo - freq) * Math.min(1, t / dur) : freq;
    if (vib) f *= 1 + vib * Math.sin(2 * Math.PI * vibRate * t);
    ph += f / SR;
    let x = wave(type, ph);
    if (detune) {
      ph2 += (f * (1 + detune)) / SR;
      x = (x + wave(type, ph2)) * 0.5;
    }
    y += lp * (x - y);
    let idx = start + i;
    if (idx >= buf.length) {
      if (!wrap) break;
      idx %= buf.length;
    }
    buf[idx] += y * env * vol;
  }
}

let seed = 1234567;
function rnd() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function noise(buf, t0, dur, o = {}) {
  const { vol = 0.1, decay = 30, hp = true, lp = 1, wrap = false } = o;
  const N = Math.round(dur * SR);
  const start = Math.round(t0 * SR);
  let low = 0;
  let y = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const w = rnd() * 2 - 1;
    low += 0.15 * (w - low);
    let x = hp ? w - low : w;
    y += lp * (x - y);
    let idx = start + i;
    if (idx >= buf.length) {
      if (!wrap) break;
      idx %= buf.length;
    }
    buf[idx] += y * Math.exp(-decay * t) * vol;
  }
}

function kick(buf, t0, vol = 0.5, wrap = false) {
  const N = Math.round(0.32 * SR);
  const start = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const f = 45 + 85 * Math.exp(-t * 28);
    ph += f / SR;
    let idx = start + i;
    if (idx >= buf.length) {
      if (!wrap) break;
      idx %= buf.length;
    }
    buf[idx] += Math.sin(ph * 2 * Math.PI) * Math.exp(-t * 9) * vol;
  }
}

// circular feedback delay (keeps loops seamless)
function delay(buf, seconds, feedback, mix) {
  const D = Math.round(seconds * SR);
  const out = Float32Array.from(buf);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < out.length; i++) {
      const j = (i - D + out.length) % out.length;
      out[i] = buf[i] + out[j] * feedback;
    }
  }
  for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - mix) + out[i] * mix;
}

function mixInto(dst, src, gain = 1) {
  for (let i = 0; i < dst.length; i++) dst[i] += src[i] * gain;
}

function finalize(buf, peak = 0.85) {
  let m = 0;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  const g = m > 0 ? peak / m : 1;
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * g * 1.1) / Math.tanh(1.1);
  return buf;
}

function fadeEdges(buf, ms = 4) {
  const N = Math.round((ms / 1000) * SR);
  for (let i = 0; i < N && i < buf.length; i++) {
    buf[i] *= i / N;
    buf[buf.length - 1 - i] *= i / N;
  }
  return buf;
}

function writeWav(name, buf) {
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, name), Buffer.concat([h, data]));
  console.log(`${name}  ${(buf.length / SR).toFixed(2)}s  ${((44 + data.length) / 1024).toFixed(0)} KB`);
}

// ---------- sound effects ----------
function sfx() {
  let b;

  b = makeBuf(0.09);
  tone(b, 0, 0.03, 1250, { glideTo: 900, vol: 0.5, d: 0.03, s: 0.2, r: 0.04 });
  noise(b, 0, 0.02, { vol: 0.15, decay: 200 });
  writeWav("tap.wav", fadeEdges(finalize(b, 0.6)));

  b = makeBuf(0.14);
  tone(b, 0, 0.08, 520, { glideTo: 920, type: "tri", vol: 0.5, s: 0.5, r: 0.05 });
  writeWav("pickup.wav", fadeEdges(finalize(b, 0.6)));

  b = makeBuf(0.16);
  tone(b, 0, 0.08, 190, { glideTo: 110, vol: 0.7, d: 0.06, s: 0.3, r: 0.06 });
  tone(b, 0, 0.03, 700, { type: "tri", vol: 0.25, d: 0.03, s: 0.1, r: 0.03 });
  noise(b, 0, 0.04, { vol: 0.12, decay: 90, lp: 0.4 });
  writeWav("place.wav", fadeEdges(finalize(b, 0.75)));

  b = makeBuf(0.26);
  tone(b, 0, 0.07, 196, { type: "square", vol: 0.4, lp: 0.25, s: 0.8, r: 0.03 });
  tone(b, 0.11, 0.08, 165, { type: "square", vol: 0.4, lp: 0.25, s: 0.8, r: 0.04 });
  writeWav("invalid.wav", fadeEdges(finalize(b, 0.55)));

  b = makeBuf(0.55);
  ["C6", "E6", "G6", "C7"].forEach((x, i) =>
    tone(b, i * 0.045, 0.08, mtof(n(x)), { type: "bell", vol: 0.35, d: 0.1, s: 0.3, r: 0.25 })
  );
  noise(b, 0, 0.35, { vol: 0.05, decay: 9 });
  writeWav("clear_row.wav", fadeEdges(finalize(b)));

  b = makeBuf(0.55);
  ["G5", "B5", "D6", "G6"].forEach((x, i) =>
    tone(b, i * 0.045, 0.08, mtof(n(x)), { type: "bell", vol: 0.35, d: 0.1, s: 0.3, r: 0.25 })
  );
  noise(b, 0, 0.35, { vol: 0.05, decay: 9 });
  writeWav("clear_col.wav", fadeEdges(finalize(b)));

  b = makeBuf(0.8);
  ["C6", "D6", "E6", "G6", "A6", "C7", "E7"].forEach((x, i) =>
    tone(b, i * 0.04, 0.07, mtof(n(x)), { type: "bell", vol: 0.32, d: 0.08, s: 0.35, r: 0.3 })
  );
  tone(b, 0.28, 0.2, mtof(n("C7")), { type: "sine", vol: 0.2, vib: 0.01, r: 0.3 });
  noise(b, 0.05, 0.5, { vol: 0.06, decay: 6 });
  writeWav("combo.wav", fadeEdges(finalize(b)));

  b = makeBuf(0.06);
  tone(b, 0, 0.02, 1600, { vol: 0.4, d: 0.02, s: 0.2, r: 0.03 });
  writeWav("score.wav", fadeEdges(finalize(b, 0.45)));

  b = makeBuf(0.42);
  tone(b, 0, 0.07, mtof(n("B5")), { type: "square", vol: 0.3, lp: 0.5, s: 0.7, r: 0.02 });
  tone(b, 0.07, 0.12, mtof(n("E6")), { type: "square", vol: 0.3, lp: 0.5, s: 0.6, r: 0.2 });
  writeWav("coin.wav", fadeEdges(finalize(b, 0.6)));

  b = makeBuf(1.1);
  ["C5", "E5", "G5", "C6", "E6"].forEach((x, i) =>
    tone(b, i * 0.06, 0.35, mtof(n(x)), { type: "bell", vol: 0.25, d: 0.2, s: 0.4, r: 0.45 })
  );
  noise(b, 0.1, 0.8, { vol: 0.05, decay: 4 });
  writeWav("reward.wav", fadeEdges(finalize(b)));

  b = makeBuf(1.3);
  tone(b, 0, 0.45, 300, { glideTo: 1200, type: "tri", vol: 0.3, vib: 0.02, vibRate: 9, s: 0.7, r: 0.1 });
  ["C6", "E6", "G6", "B6"].forEach((x) =>
    tone(b, 0.45, 0.3, mtof(n(x)), { type: "bell", vol: 0.22, d: 0.2, s: 0.5, r: 0.5 })
  );
  noise(b, 0.45, 0.7, { vol: 0.07, decay: 5 });
  writeWav("unlock.wav", fadeEdges(finalize(b)));

  b = makeBuf(1.4);
  ["G4", "C5", "E5", "G5"].forEach((x, i) =>
    tone(b, i * 0.1, 0.09, mtof(n(x)), { type: "tri", vol: 0.35, s: 0.7, r: 0.06 })
  );
  ["C5", "E5", "G5", "C6"].forEach((x) =>
    tone(b, 0.42, 0.5, mtof(n(x)), { type: "saw", vol: 0.15, lp: 0.3, a: 0.02, s: 0.6, r: 0.4, detune: 0.004 })
  );
  tone(b, 0.42, 0.5, mtof(n("C7")), { type: "bell", vol: 0.15, r: 0.4 });
  writeWav("levelup.wav", fadeEdges(finalize(b)));

  b = makeBuf(1.6);
  ["E5", "C5", "A4", "F4"].forEach((x, i) =>
    tone(b, i * 0.22, 0.2, mtof(n(x)), { type: "tri", vol: 0.35, lp: 0.4, s: 0.6, r: 0.35 })
  );
  tone(b, 0.88, 0.4, mtof(n("F3")), { type: "sine", vol: 0.3, r: 0.3 });
  writeWav("gameover.wav", fadeEdges(finalize(b, 0.75)));

  b = makeBuf(1.3);
  ["C5", "E5", "G5", "C6", "E6", "G6", "C7"].forEach((x, i) =>
    tone(b, i * 0.05, 0.12, mtof(n(x)), { type: "bell", vol: 0.28, s: 0.4, r: 0.4 })
  );
  ["C6", "E6", "G6"].forEach((x) =>
    tone(b, 0.38, 0.4, mtof(n(x)), { type: "saw", vol: 0.1, lp: 0.25, a: 0.03, r: 0.4, detune: 0.005 })
  );
  noise(b, 0.3, 0.9, { vol: 0.08, decay: 3.5 });
  writeWav("fullclear.wav", fadeEdges(finalize(b)));

  // escalating combo stingers: higher, longer and heavier per tier
  const comboScale = ["C6", "D6", "E6", "G6", "A6", "C7", "D7", "E7", "G7"];
  [2, 3, 4, 5].forEach((tier) => {
    b = makeBuf(0.7 + tier * 0.12);
    const shift = (tier - 2) * 2;
    const notes = comboScale.slice(0, 3 + tier);
    notes.forEach((x, i) =>
      tone(b, i * 0.038, 0.07, mtof(n(x) + shift), { type: "bell", vol: 0.3, d: 0.08, s: 0.35, r: 0.28 })
    );
    const end = notes.length * 0.038;
    tone(b, end, 0.25 + tier * 0.05, mtof(n("C7") + shift), { type: "sine", vol: 0.2, vib: 0.012, r: 0.3 });
    if (tier >= 4) {
      kick(b, 0, 0.45);
      ["C5", "E5", "G5"].forEach((x) =>
        tone(b, end, 0.35, mtof(n(x) + shift), { type: "saw", vol: 0.1, lp: 0.3, a: 0.02, r: 0.35, detune: 0.005 })
      );
    }
    noise(b, 0.03, 0.4 + tier * 0.1, { vol: 0.05 + tier * 0.01, decay: 7 - tier });
    writeWav(`combo_${tier}.wav`, fadeEdges(finalize(b)));
  });

  b = makeBuf(0.75);
  ["C6", "E6", "G6", "C7"].forEach((x, i) =>
    tone(b, i * 0.035, 0.08, mtof(n(x)), { type: "bell", vol: 0.3, d: 0.1, s: 0.3, r: 0.25 })
  );
  ["G6", "B6", "D7", "G7"].forEach((x, i) =>
    tone(b, 0.16 + i * 0.035, 0.08, mtof(n(x)), { type: "bell", vol: 0.26, d: 0.1, s: 0.3, r: 0.3 })
  );
  noise(b, 0, 0.5, { vol: 0.07, decay: 7 });
  writeWav("clear_multi.wav", fadeEdges(finalize(b)));

  b = makeBuf(1.6);
  kick(b, 0, 0.8);
  noise(b, 0, 0.9, { vol: 0.25, decay: 4, lp: 0.35 });
  tone(b, 0, 0.5, 120, { glideTo: 900, type: "saw", vol: 0.15, lp: 0.2, r: 0.2 });
  ["C5", "G5", "C6", "E6", "G6"].forEach((x, i) =>
    tone(b, 0.12 + i * 0.03, 0.5, mtof(n(x)), { type: "bell", vol: 0.22, d: 0.3, s: 0.4, r: 0.6 })
  );
  writeWav("blast.wav", fadeEdges(finalize(b)));

  b = makeBuf(0.8);
  noise(b, 0, 0.35, { vol: 0.12, decay: 6, lp: 0.6 });
  tone(b, 0, 0.3, 400, { glideTo: 1600, type: "tri", vol: 0.3, vib: 0.03, vibRate: 14, s: 0.7, r: 0.1 });
  ["E6", "G#6", "B6"].forEach((x, i) =>
    tone(b, 0.28 + i * 0.05, 0.12, mtof(n(x)), { type: "bell", vol: 0.22, r: 0.25 })
  );
  writeWav("powerup.wav", fadeEdges(finalize(b)));
}


// ---------- music ----------
// Bars of chords: each chord = [bass, ...voicing]
function music({ name, bpm, bars, chords, arpPattern, lead, drums, padVol, arpVol, arpType }) {
  const beat = 60 / bpm;
  const len = bars * 4 * beat;
  const mix = makeBuf(len);
  const pad = makeBuf(len);
  const arp = makeBuf(len);
  const W = { wrap: true };

  chords.forEach((ch, bi) => {
    const t = bi * 4 * beat;
    const [bass, ...voice] = ch.map((x) => mtof(n(x)));
    // warm pad
    voice.forEach((f) =>
      tone(pad, t, 4 * beat - 0.05, f, { type: "saw", vol: padVol, a: 0.5, d: 0.5, s: 0.8, r: 0.9, lp: 0.08, detune: 0.004, ...W })
    );
    // bass
    drums.bass.forEach((p) =>
      tone(mix, t + p * beat, beat * 0.45, bass, { type: "sine", vol: 0.32, a: 0.01, s: 0.8, r: 0.12, ...W })
    );
    // arpeggio over chord tones (up an octave)
    arpPattern.forEach((step, si) => {
      if (step == null) return;
      const f = voice[step % voice.length] * (step >= voice.length ? 4 : 2);
      tone(arp, t + si * (beat / 2), beat * 0.25, f, { type: arpType, vol: arpVol, a: 0.004, d: 0.12, s: 0.2, r: 0.18, ...W });
    });
    // drums
    for (let q = 0; q < 4; q++) {
      const tb = t + q * beat;
      if (drums.kick.includes(q)) kick(mix, tb, 0.42, true);
      if (drums.clap.includes(q)) noise(mix, tb, 0.18, { vol: 0.11, decay: 22, lp: 0.5, wrap: true });
      for (let h = 0; h < drums.hatsPerBeat; h++)
        noise(mix, tb + (h * beat) / drums.hatsPerBeat, 0.05, { vol: h % 2 ? 0.025 : 0.04, decay: 90, ...W });
    }
  });

  // simple lead melody: [bar, beatOffset, note, beats]
  (lead || []).forEach(([bar, off, note, beats]) =>
    tone(arp, (bar * 4 + off) * beat, beats * beat * 0.9, mtof(n(note)), { type: "bell", vol: arpVol * 1.3, d: 0.2, s: 0.5, r: 0.3, vib: 0.004, ...W })
  );

  delay(arp, beat * 0.75, 0.35, 0.35);
  mixInto(mix, pad, 1);
  mixInto(mix, arp, 1);
  writeWav(name, finalize(mix, 0.8));
}

sfx();

music({
  name: "music_home.wav",
  bpm: 88,
  bars: 8,
  padVol: 0.16,
  arpVol: 0.13,
  arpType: "tri",
  chords: [
    ["A2", "A3", "C4", "E4", "G4"],
    ["A2", "A3", "C4", "E4", "G4"],
    ["F2", "F3", "A3", "C4", "E4"],
    ["F2", "F3", "A3", "C4", "E4"],
    ["C2", "C4", "E4", "G4", "B4"],
    ["C2", "C4", "E4", "G4", "B4"],
    ["G2", "G3", "B3", "D4", "E4"],
    ["G2", "G3", "B3", "D4", "E4"],
  ],
  arpPattern: [0, 2, 1, 3, 2, 4, 3, 1],
  drums: { kick: [0, 2], clap: [], hatsPerBeat: 1, bass: [0, 2.5] },
  lead: [
    [1, 2, "E5", 1],
    [1, 3, "G5", 1],
    [3, 2, "C6", 1],
    [3, 3, "B5", 1],
    [5, 2, "G5", 1],
    [5, 3, "E5", 1],
    [7, 2, "D5", 2],
  ],
});

music({
  name: "music_game.wav",
  bpm: 108,
  bars: 8,
  padVol: 0.12,
  arpVol: 0.12,
  arpType: "tri",
  chords: [
    ["F2", "F3", "A3", "C4", "E4"],
    ["G2", "G3", "B3", "D4", "F4"],
    ["E2", "E3", "G3", "B3", "D4"],
    ["A2", "A3", "C4", "E4", "G4"],
    ["F2", "F3", "A3", "C4", "E4"],
    ["G2", "G3", "B3", "D4", "F4"],
    ["C2", "C4", "E4", "G4", "B4"],
    ["C2", "C4", "E4", "G4", "B4"],
  ],
  arpPattern: [0, 2, 4, 2, 1, 3, 4, 3],
  drums: { kick: [0, 1, 2, 3], clap: [1, 3], hatsPerBeat: 2, bass: [0, 0.5, 1.5, 2, 3, 3.5] },
  lead: [
    [0, 0, "A5", 1],
    [0, 1.5, "C6", 1],
    [1, 0, "B5", 1.5],
    [2, 0, "G5", 1],
    [2, 1.5, "B5", 1],
    [3, 0, "A5", 2],
    [4, 0, "C6", 1],
    [4, 1.5, "E6", 1],
    [5, 0, "D6", 1.5],
    [6, 0, "E6", 1],
    [6, 2, "G6", 1],
    [7, 0, "C6", 3],
  ],
});
