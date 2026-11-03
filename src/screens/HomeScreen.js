import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import GameButton, { RoundButton, ORANGE, TEAL, PURPLE } from "../components/GameButton";
import SettingsModal from "../components/SettingsModal";
import Decor from "../components/Decor";
import { useStore, useTheme, dailyStreak, dayKey } from "../store/GameStore";
import { displayFont } from "../constants/fonts";
import { formatNumber } from "../utils/format";
import { playMusic } from "../services/audio";

const LOGO_COLORS = ["#ffb020", "#3cc8ff", "#ff4d5e", "#ffe03a", "#c06bff", "#4ce06a", "#ff8a2e", "#2ef0dc"];

// "BlockPop" — every letter in its own colour with a dark outline and 3D drop.
function Wordmark() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const letters = (style) =>
    "BlockPop".split("").map((ch, i) => (
      <Text key={i} style={style(i)}>
        {ch}
      </Text>
    ));
  return (
    <Animated.View style={{ alignItems: "center", transform: [{ translateY }, { scale }] }}>
      <View>
        {/* dark outline/extrusion behind the coloured letters */}
        <Text style={{ position: "absolute", top: 7, left: 0, right: 0, textAlign: "center", fontSize: 72, color: "#1d1060", ...displayFont() }}>BlockPop</Text>
        <Text
          style={{
            fontSize: 72,
            textAlign: "center",
            ...displayFont(),
            textShadowColor: "#ffffff",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 6,
          }}
        >
          {letters((i) => ({ color: LOGO_COLORS[i] }))}
        </Text>
      </View>
      <LinearGradient
        colors={["#ff4fa0", "#a64dff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingHorizontal: 18, paddingVertical: 4, borderRadius: 14, marginTop: 4, borderWidth: 2, borderColor: "#ffd0ec" }}
      >
        <Text style={{ color: "#fff", fontSize: 18, letterSpacing: 6, ...displayFont() }}>PUZZLE</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function HomeScreen({ nav }) {
  const store = useStore();
  const { profile } = store;
  const theme = useTheme();
  const [settings, setSettings] = useState(false);
  const streak = dailyStreak(profile);
  const wonToday = profile.daily.lastWinDay === dayKey(0);

  useEffect(() => {
    playMusic("home");
  }, []);

  return (
    <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
      <Decor />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 26 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 8 }}>
          <RoundButton icon="⚙️" color={PURPLE} onPress={() => setSettings(true)} />
          <RoundButton icon="🏅" color={ORANGE} label="Medals" onPress={() => nav.navigate("achievements")} />
        </View>

        <View style={{ flex: 1, justifyContent: "center" }}>
          <Wordmark />
        </View>

        {/* consecutive days with at least one Adventure level won */}
        <View style={{ borderRadius: 18, overflow: "hidden", marginBottom: 26, borderWidth: 3, borderColor: "#ffe27a", backgroundColor: "#fff" }}>
          <LinearGradient colors={["#ffd84a", "#ffa21f"]} style={{ paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ color: "#7a3a00", fontSize: 18, ...displayFont() }}>⭐ Daily Victories ⭐</Text>
          </LinearGradient>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
            <Text style={{ fontSize: 42 }}>👑</Text>
            <Text style={{ color: "#5a35d6", fontSize: 40, marginLeft: 14, ...displayFont() }}>×{streak}</Text>
            <Text style={{ position: "absolute", right: 16, fontSize: 24 }}>{wonToday ? "✅" : "⏳"}</Text>
          </View>
          <Text style={{ color: wonToday ? "#1fae4a" : "#8a6ad6", fontSize: 13, fontWeight: "800", textAlign: "center", marginBottom: 10 }}>
            {wonToday ? "Today's victory done!" : "Win an Adventure level today"}
          </Text>
        </View>

        <View style={{ paddingBottom: 40 }}>
          <GameButton
            title={`Adventure  ·  Lv ${Math.min(profile.adventureLevel, 100)}`}
            icon="📍"
            color={ORANGE}
            height={64}
            fontSize={27}
            onPress={() => nav.navigate("adventure")}
          />
          <GameButton
            title={profile.savedGame ? "Classic  ·  Continue" : "Classic"}
            icon="∞"
            color={TEAL}
            height={64}
            fontSize={27}
            onPress={() => nav.navigate("game", { mode: "classic", resume: !!profile.savedGame })}
            style={{ marginTop: 16 }}
          />
          <View style={{ alignSelf: "center", marginTop: 16, backgroundColor: "rgba(20,10,70,0.35)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ color: "#ffe27a", fontSize: 17, ...displayFont() }}>👑 Classic best: {formatNumber(profile.bestScore)}</Text>
          </View>
        </View>
      </SafeAreaView>
      <SettingsModal visible={settings} onClose={() => setSettings(false)} />
    </LinearGradient>
  );
}
