import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ParticleBurst from "./ParticleBurst";
import AnimatedNumber from "./AnimatedNumber";
import { displayFont } from "../constants/fonts";

const RAINBOW = ["#ff4fb4", "#ffd21f", "#1fd5ff", "#a64dff", "#2fd65a", "#ff8a1f"];
const outline = (c) => ({ textShadowColor: c, textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 1 });

// Glowing band across a cleared row: "+200" on the left, the praise word on the right.
export function PraiseBanner({ item, onDone }) {
  const t = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(t, { toValue: 1, speed: 16, bounciness: 12, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(out, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone(item.id));
  }, []);
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const wordScale = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.3, 1.25, 1] });
  const translateY = out.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", left: item.left - 6, width: item.width + 12, top: item.y - item.h / 2, height: item.h, opacity: out, transform: [{ translateY }] }}
    >
      <Animated.View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, transform: [{ scaleX }] }}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", item.color, item.color, "rgba(255,255,255,0)"]}
          locations={[0, 0.2, 0.8, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, opacity: 0.85, borderRadius: 8 }}
        />
      </Animated.View>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22 }}>
        <Text style={{ color: "#fff", fontSize: 26, ...displayFont(), ...outline("rgba(20,10,80,0.6)") }}>+{item.points}</Text>
        <Animated.Text style={{ color: "#fff27a", fontSize: 34, ...displayFont(), ...outline("#b8530a"), transform: [{ scale: wordScale }, { rotate: "-4deg" }] }}>
          {item.word}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// Big "Combo 12" with a glowing pulsing orb behind the number and sparkles.
export function ComboBurst({ item, onDone }) {
  const t = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })).start();
    Animated.sequence([
      Animated.spring(t, { toValue: 1, speed: 10, bounciness: 16, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(out, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone(item.id));
  }, []);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const orb = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.15, 0.9] });
  const spin = pulse.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 10;
    return { x: 230 + Math.cos(a) * 60, y: 70 + Math.sin(a) * 60, color: RAINBOW[i % RAINBOW.length] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", left: item.x - 170, top: item.y - 70, width: 340, height: 140, opacity: out, transform: [{ scale }] }}
    >
      <ParticleBurst points={sparks} effect="sparkle" palette={RAINBOW} accent="#ffffff" unit={30} />
      {/* glowing orb behind the number */}
      <Animated.View
        style={{ position: "absolute", left: 230 - 62, top: 70 - 62, width: 124, height: 124, borderRadius: 62, transform: [{ scale: orb }, { rotate: spin }] }}
      >
        <LinearGradient colors={["rgba(255,255,255,0.95)", "rgba(120,200,255,0.55)", "rgba(160,90,255,0)"]} style={{ flex: 1, borderRadius: 62 }} />
      </Animated.View>
      <View style={{ position: "absolute", left: 230 - 70, top: 70 - 70, width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" }} />
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#e8f6ff", fontSize: 50, ...displayFont(), ...outline("#2a3d9e"), transform: [{ rotate: "-8deg" }] }}>Combo</Text>
        <Text style={{ color: "#ffd21f", fontSize: 76, marginLeft: 14, ...displayFont(), ...outline("#b8530a") }}>{item.combo}</Text>
      </View>
    </Animated.View>
  );
}

// Simple centred word (e.g. "New Record!" during play).
export function Shout({ item, onDone }) {
  const t = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(t, { toValue: 1, speed: 12, bounciness: 14, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(out, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone(item.id));
  }, []);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, top: item.y - 50, height: 100, alignItems: "center", justifyContent: "center", opacity: out, transform: [{ scale }] }}
    >
      <Text style={{ color: item.color || "#fff27a", fontSize: 52, ...displayFont(), ...outline("#8a2be2") }}>{item.text}</Text>
    </Animated.View>
  );
}

// Animated star with a delayed pop-in.
function Star({ delay, size, rotate }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(t, { toValue: 1, delay, speed: 10, bounciness: 18, useNativeDriver: true }).start();
  }, []);
  return <Animated.Text style={{ fontSize: size, transform: [{ scale: t }, { rotate }] }}>⭐</Animated.Text>;
}

// End-of-game "NEW RECORD" celebration: stars, glowing title, counting score,
// trumpets and confetti; tap anywhere to continue.
export function NewRecord({ score, onContinue }) {
  const t = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState(0);
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    const id = setTimeout(() => setShown(score), 500);
    return () => clearTimeout(id);
  }, []);
  const rays = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
  const raysScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });
  const confetti = Array.from({ length: 22 }, (_, i) => ({ x: 20 + ((i * 47) % 340), y: 110 + (i % 4) * 20, color: RAINBOW[i % RAINBOW.length] }));
  return (
    <Animated.View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: t }}>
      <Pressable onPress={onContinue} style={{ flex: 1, backgroundColor: "rgba(15,8,50,0.82)", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 380, alignItems: "center" }}>
          <ParticleBurst points={confetti} effect="confetti" palette={RAINBOW} unit={40} />
          <Animated.View style={{ position: "absolute", top: 0, width: 300, height: 300, borderRadius: 150, opacity: rays, transform: [{ scale: raysScale }] }}>
            <LinearGradient colors={["rgba(255,230,120,0.9)", "rgba(255,170,40,0.25)", "rgba(255,120,0,0)"]} style={{ flex: 1, borderRadius: 150 }} />
          </Animated.View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 20 }}>
            <Star delay={150} size={54} rotate="-14deg" />
            <Star delay={300} size={78} rotate="0deg" />
            <Star delay={450} size={54} rotate="14deg" />
          </View>
          <Text style={{ color: "#fff27a", fontSize: 50, marginTop: 6, ...displayFont(), ...outline("#c2185b") }}>NEW RECORD</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Text style={{ fontSize: 54, transform: [{ scaleX: -1 }] }}>🎺</Text>
            <AnimatedNumber value={shown} duration={1100} bump={false} style={{ color: "#ffffff", fontSize: 70, marginHorizontal: 12, ...displayFont(), ...outline("#d9480f") }} />
            <Text style={{ fontSize: 54 }}>🎺</Text>
          </View>
          <Text style={{ color: "#e6deff", fontSize: 18, marginTop: 30, ...displayFont() }}>Tap to continue</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
