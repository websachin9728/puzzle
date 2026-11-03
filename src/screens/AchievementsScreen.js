import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import TopBar from "../components/TopBar";
import { useStore, useTheme } from "../store/GameStore";
import { achievementList } from "../game/achievements";
import { displayFont } from "../constants/fonts";
import { formatNumber } from "../utils/format";

const CARD_COLORS = [
  ["#ffd84a", "#ffa21f"],
  ["#ff7aa8", "#ff4f6a"],
  ["#6fe08a", "#21b85a"],
  ["#5fd8ff", "#2a8bff"],
  ["#c58bff", "#8a4dff"],
];

export default function AchievementsScreen({ nav }) {
  const { profile } = useStore();
  const theme = useTheme();
  const list = achievementList(profile);
  const unlocked = list.filter((a) => a.done).length;
  return (
    <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar title="Medals" onBack={() => nav.goBack()} />
        <View style={{ alignSelf: "center", marginTop: 14, backgroundColor: "rgba(20,10,70,0.35)", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 }}>
          <Text style={{ color: "#ffe27a", fontSize: 18, ...displayFont() }}>
            🏅 {unlocked} / {list.length} unlocked
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {list.map((a, i) => (
            <LinearGradient
              key={a.id}
              colors={a.done ? CARD_COLORS[i % CARD_COLORS.length] : ["rgba(30,15,90,0.55)", "rgba(30,15,90,0.7)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 16,
                padding: 12,
                marginBottom: 10,
                borderWidth: 2,
                borderColor: a.done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)",
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: a.done ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 30, opacity: a.done ? 1 : 0.45 }}>{a.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 19, ...displayFont(), textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 }}>
                  {a.title}
                </Text>
                <Text style={{ color: a.done ? "#ffffff" : "#c9c2f2", fontSize: 13, fontWeight: "700" }}>{a.desc}</Text>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.25)", marginTop: 6, overflow: "hidden" }}>
                  <LinearGradient
                    colors={a.done ? ["#ffffff", "#e8ffe8"] : ["#ffe27a", "#ff9f1a"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${(a.progress / a.target) * 100}%`, height: "100%" }}
                  />
                </View>
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: "#fff", fontSize: a.done ? 24 : 13, fontWeight: "900", marginLeft: 10, width: 96, textAlign: "right" }}>
                {a.done ? "✓" : `${formatNumber(a.progress)}/${formatNumber(a.target)}`}
              </Text>
            </LinearGradient>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
