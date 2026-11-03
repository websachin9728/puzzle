import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import Block from "./Block";

// A handful of glossy blocks bobbing gently in the background of menu screens.
// Positions are fractions of the screen; few items, native-driver animations.
const ITEMS = [
  { x: 0.06, y: 0.12, s: 46, c: "#ffd21f", r: -14 },
  { x: 0.8, y: 0.17, s: 40, c: "#ff4fb4", r: 12 },
  { x: 0.12, y: 0.42, s: 30, c: "#1fd5ff", r: 18 },
  { x: 0.86, y: 0.44, s: 52, c: "#2fd65a", r: -10 },
  { x: 0.03, y: 0.7, s: 38, c: "#ff8a1f", r: 8 },
  { x: 0.88, y: 0.74, s: 34, c: "#a64dff", r: -16 },
];

function Bob({ x, y, s, c, r, i }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 2200 + i * 300, delay: i * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 2200 + i * 300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  return (
    <Animated.View style={{ position: "absolute", left: x, top: y, opacity: 0.85, transform: [{ translateY }, { rotate: `${r}deg` }] }}>
      <Block color={c} size={s} />
    </Animated.View>
  );
}

export default function Decor() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
      {ITEMS.map((it, i) => (
        <Bob key={i} i={i} x={it.x * width} y={it.y * height} s={it.s} c={it.c} r={it.r} />
      ))}
    </View>
  );
}
