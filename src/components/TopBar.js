import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RoundButton, PINK } from "./GameButton";
import { displayFont } from "../constants/fonts";

// Gradient title bar with a round back button.
export default function TopBar({ title, onBack }) {
  return (
    <LinearGradient colors={["#7a5cff", "#5a3dd6"]} style={{ height: 76, flexDirection: "row", alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "#b9a6ff" }}>
      <View style={{ position: "absolute", left: 14, top: 10 }}>
        <RoundButton icon="◀" color={PINK} size={46} onPress={onBack} />
      </View>
      <Text style={{ color: "#fff", fontSize: 34, ...displayFont(), textShadowColor: "#2a1680", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 1 }}>{title}</Text>
    </LinearGradient>
  );
}
