import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { formatNumber } from "../utils/format";

// Counts smoothly to `value` and gives a small bump when it increases.
// Always a single line: large numbers shrink to fit instead of wrapping.
export default function AnimatedNumber({ value, style, duration = 550, bump = true, format = formatNumber, minimumFontScale = 0.5 }) {
  const [display, setDisplay] = useState(value);
  const shown = useRef(value);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const from = shown.current;
    if (from === value) return undefined;
    if (bump && value > from) {
      scale.setValue(1.25);
      Animated.spring(scale, { toValue: 1, speed: 14, bounciness: 12, useNativeDriver: true }).start();
    }
    const start = Date.now();
    let raf;
    const step = () => {
      const k = Math.min(1, (Date.now() - start) / duration);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)));
      shown.current = v;
      setDisplay(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <Animated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={minimumFontScale} style={[style, { transform: [{ scale }] }]}>
      {format(display)}
    </Animated.Text>
  );
}
