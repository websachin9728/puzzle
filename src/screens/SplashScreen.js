import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Block from "../components/Block";
import { displayFont } from "../constants/fonts";
import { playMusic } from "../services/audio";

const LETTERS = "BlockPop".split("");
const LETTER_COLORS = ["#ffb020", "#3cc8ff", "#ff4d5e", "#ffe03a", "#c06bff", "#4ce06a", "#ff8a2e", "#2ef0dc"];
const BLOCK_COLORS = ["#ffd21f", "#ff8a1f", "#ff3d4f", "#2fd65a", "#1fd5ff", "#2f7bff", "#a64dff", "#ff4fb4"];
const DURATION = 2600;

// A block that drops from above the screen and bounces into place.
function FallingBlock({ x, y, size, color, delay, rotate }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 700, delay, easing: Easing.bounce, useNativeDriver: true }).start();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-y - 200, 0] });
  return (
    <Animated.View style={{ position: "absolute", left: x, top: y, transform: [{ translateY }, { rotate }] }}>
      <Block color={color} size={size} />
    </Animated.View>
  );
}

function Letter({ ch, color, delay }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(t, { toValue: 1, delay, speed: 10, bounciness: 18, useNativeDriver: true }).start();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });
  return (
    <Animated.Text style={{ color, fontSize: 70, ...displayFont(), opacity: t, transform: [{ translateY }, { scale: t }] }}>
      {ch}
    </Animated.Text>
  );
}

export default function SplashScreen({ nav }) {
  const { width, height } = useWindowDimensions();
  const bar = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    playMusic("home");
    Animated.timing(bar, { toValue: 1, duration: DURATION, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    Animated.timing(sub, { toValue: 1, duration: 500, delay: 1300, useNativeDriver: true }).start();
    const id = setTimeout(() => nav.reset("home"), DURATION + 200);
    return () => clearTimeout(id);
  }, []);

  // a staircase of blocks piling up along the bottom of the screen
  const size = Math.floor(width / 7);
  const pile = [];
  const heights = [3, 2, 4, 1, 3, 2, 4];
  heights.forEach((h, col) => {
    for (let r = 0; r < h; r++) {
      pile.push({ x: col * size, y: height - (r + 1) * size - 40, color: BLOCK_COLORS[(col + r * 3) % 8], delay: 150 + col * 90 + r * 140 });
    }
  });

  const barWidth = bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <LinearGradient colors={["#3a8dff", "#4b53e6", "#6a35d6"]} style={{ flex: 1 }}>
      {pile.map((b, i) => (
        <FallingBlock key={i} x={b.x} y={b.y} size={size - 2} color={b.color} delay={b.delay} rotate="0deg" />
      ))}
      <FallingBlock x={width * 0.12} y={height * 0.14} size={44} color="#ff4fb4" delay={500} rotate="-14deg" />
      <FallingBlock x={width * 0.76} y={height * 0.18} size={38} color="#ffd21f" delay={650} rotate="12deg" />

      <View style={{ position: "absolute", left: 0, right: 0, top: height * 0.3, alignItems: "center" }}>
        <View style={{ flexDirection: "row" }}>
          {LETTERS.map((ch, i) => (
            <Letter key={i} ch={ch} color={LETTER_COLORS[i]} delay={200 + i * 110} />
          ))}
        </View>
        <Animated.View style={{ opacity: sub, transform: [{ scale: sub }] }}>
          <LinearGradient
            colors={["#ff4fa0", "#a64dff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 18, paddingVertical: 4, borderRadius: 14, marginTop: 6, borderWidth: 2, borderColor: "#ffd0ec" }}
          >
            <Text style={{ color: "#fff", fontSize: 18, letterSpacing: 6, ...displayFont() }}>PUZZLE</Text>
          </LinearGradient>
        </Animated.View>

        <View style={{ width: width * 0.62, height: 22, borderRadius: 11, backgroundColor: "rgba(20,10,70,0.45)", marginTop: 50, padding: 3, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }}>
          <Animated.View style={{ width: barWidth, height: "100%", borderRadius: 8, overflow: "hidden" }}>
            <LinearGradient colors={["#fff27a", "#ffb21e"]} style={{ flex: 1 }} />
          </Animated.View>
        </View>
        <Text style={{ color: "#fff", marginTop: 10, fontSize: 16, letterSpacing: 3, ...displayFont() }}>Loading...</Text>
      </View>
    </LinearGradient>
  );
}
