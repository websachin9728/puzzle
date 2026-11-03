import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";

const MAX_PARTICLES = 60;

// Builds particle specs for the selected effect. Points are in the parent's
// coordinate space ({x, y, color}); `unit` scales distances (board cell size).
function build(points, effect, palette, accent, unit) {
  const per = { sparkle: 2, confetti: 2, fireworks: 3, stardust: 2 }[effect] || 2;
  const step = Math.max(1, Math.ceil((points.length * per) / MAX_PARTICLES));
  const out = [];
  let id = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  points.forEach((pt, i) => {
    if (i % step) return;
    for (let k = 0; k < per; k++) {
      const p = { id: id++, x: pt.x, y: pt.y, delay: Math.round(rnd(0, 120)), spin: 0, shape: "square" };
      if (effect === "shards") {
        // chunky block fragments in the cleared blocks' own colours
        Object.assign(p, {
          dx: rnd(-1.9, 1.9) * unit,
          dy: rnd(-2.8, -0.6) * unit,
          g: rnd(3.5, 5) * unit,
          w: unit * rnd(0.22, 0.36),
          color: pt.color || palette[k % palette.length],
          dur: 850,
          spin: rnd(-540, 540),
        });
        p.h = p.w;
      } else if (effect === "confetti") {
        Object.assign(p, {
          dx: rnd(-1.6, 1.6) * unit,
          dy: rnd(-2.6, -1.2) * unit,
          g: rnd(3, 4.5) * unit,
          w: unit * 0.2,
          h: unit * 0.36,
          color: palette[Math.floor(Math.random() * palette.length)],
          dur: 950,
          spin: rnd(-720, 720),
        });
      } else if (effect === "fireworks") {
        const a = (Math.PI * 2 * k) / per + rnd(0, 1.2);
        const s = rnd(1.4, 2.4) * unit;
        Object.assign(p, {
          dx: Math.cos(a) * s,
          dy: Math.sin(a) * s,
          g: unit * 0.8,
          w: unit * 0.24,
          h: unit * 0.24,
          shape: "circle",
          color: k === 0 ? "#ffffff" : pt.color || palette[k % palette.length],
          dur: 750,
        });
      } else if (effect === "stardust") {
        Object.assign(p, {
          dx: rnd(-0.7, 0.7) * unit,
          dy: rnd(-3, -1.6) * unit,
          g: 0,
          w: unit * rnd(0.12, 0.22),
          h: 0,
          shape: "circle",
          color: ["#7df9ff", "#c8a2ff", "#ffffff", "#ffe27a"][k % 4],
          dur: 1100,
        });
        p.h = p.w;
      } else {
        const a = rnd(0, Math.PI * 2);
        const s = rnd(0.7, 1.6) * unit;
        Object.assign(p, {
          dx: Math.cos(a) * s,
          dy: Math.sin(a) * s - unit * 0.4,
          g: unit * 0.7,
          w: unit * rnd(0.16, 0.3),
          shape: "diamond",
          color: ["#ffffff", accent, "#fff6c2"][k % 3],
          dur: 600,
          spin: 90,
        });
        p.h = p.w;
      }
      out.push(p);
    }
  });
  return out;
}

function Particle({ x, y, dx, dy, g, w, h, color, dur, delay, shape, spin }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.timing(t, { toValue: 1, duration: dur, delay, easing: Easing.out(Easing.quad), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, []);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, dy * 0.75 + g * 0.12, dy + g] });
  const opacity = t.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 0.9, 0] });
  const scale = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.2, 1.15, 0.5] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: [shape === "diamond" ? "45deg" : "0deg", `${(shape === "diamond" ? 45 : 0) + spin}deg`] });
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: shape === "circle" ? w / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    />
  );
}

export default function ParticleBurst({ points, effect = "sparkle", palette, accent = "#ffd23f", unit = 30 }) {
  const particles = useMemo(() => build(points, effect, palette, accent, unit), []);
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
      {particles.map(({ id, ...p }) => (
        <Particle key={id} {...p} />
      ))}
    </View>
  );
}
