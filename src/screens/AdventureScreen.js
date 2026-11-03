import React, { useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import GameButton, { GREEN } from "../components/GameButton";
import TopBar from "../components/TopBar";
import { useStore, useTheme } from "../store/GameStore";
import { LEVEL_COUNT } from "../game/levels";
import { displayFont } from "../constants/fonts";
import { playSfx } from "../services/audio";

const COLS = 6;
// completed tiles cycle through the block colours row by row
const ROW_COLORS = [
  ["#ffd21f", "#f0a800"],
  ["#ff8a1f", "#e06400"],
  ["#ff4f6a", "#d62a48"],
  ["#2fd65a", "#14a83c"],
  ["#1fd5ff", "#0a9fd6"],
  ["#4f8bff", "#2a5ee0"],
  ["#b46bff", "#8a3dff"],
  ["#ff6fc2", "#e03d9a"],
];

// Level map: level 1 at the bottom-left, climbing upwards row by row.
export default function AdventureScreen({ nav }) {
  const { profile } = useStore();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scroll = useRef(null);
  const current = Math.min(profile.adventureLevel, LEVEL_COUNT);
  const allDone = profile.adventureLevel > LEVEL_COUNT;
  const tile = Math.floor((width - 48) / COLS) - 6;

  const rows = [];
  for (let start = 1; start <= LEVEL_COUNT; start += COLS) {
    rows.push(Array.from({ length: Math.min(COLS, LEVEL_COUNT - start + 1) }, (_, i) => start + i));
  }
  rows.reverse(); // highest levels on top

  useEffect(() => {
    const t = setTimeout(() => scroll.current && scroll.current.scrollToEnd({ animated: false }), 50);
    return () => clearTimeout(t);
  }, []);

  const play = (n) => nav.navigate("game", { mode: "adventure", level: n });

  return (
    <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="Adventure" onBack={() => nav.goBack()} />

        <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 80, opacity: allDone ? 1 : 0.6 }}>🏆</Text>
          <View style={{ backgroundColor: "rgba(20,10,70,0.35)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 }}>
            <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", ...displayFont() }}>
              {allDone ? "You won the trophy!" : `Complete all ${LEVEL_COUNT} levels to win the trophy`}
            </Text>
          </View>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", alignSelf: "flex-start" }}>
              {row.map((n) => {
                const done = n < profile.adventureLevel;
                const isCurrent = n === current && !allDone;
                const locked = n > profile.adventureLevel;
                const c = ROW_COLORS[Math.floor((n - 1) / COLS) % ROW_COLORS.length];
                return (
                  <Pressable
                    key={n}
                    disabled={locked}
                    onPress={() => {
                      playSfx("tap");
                      play(n);
                    }}
                    style={{ margin: 3 }}
                  >
                    <LinearGradient
                      colors={isCurrent ? ["#fff27a", "#ffc21f"] : done ? c : ["rgba(30,15,90,0.55)", "rgba(30,15,90,0.7)"]}
                      style={{
                        width: tile,
                        height: tile,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: isCurrent ? 3 : 2,
                        borderColor: isCurrent ? "#ffffff" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)",
                      }}
                    >
                      <Text style={{ color: isCurrent ? "#8a4a00" : done ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 19, ...displayFont() }}>
                        {locked ? n : n}
                      </Text>
                      {done ? <Text style={{ position: "absolute", top: 1, right: 3, fontSize: 11 }}>⭐</Text> : null}
                      {locked ? <Text style={{ position: "absolute", bottom: 1, right: 3, fontSize: 10, opacity: 0.6 }}>🔒</Text> : null}
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={{ padding: 18, paddingBottom: 24 }}>
          <GameButton title={allDone ? "Play Level 100" : `Level ${current}`} icon="▶" color={GREEN} height={62} fontSize={30} onPress={() => play(current)} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
