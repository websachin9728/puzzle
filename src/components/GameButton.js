import React, { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { shade } from "../utils/color";
import { playSfx } from "../services/audio";
import { haptic } from "../services/haptics";
import { displayFont } from "../constants/fonts";

export const GREEN = "#3fd12a";
export const ORANGE = "#ff9d1f";
export const TEAL = "#16cfb0";
export const PINK = "#ff4fa0";
export const PURPLE = "#9a4dff";

// Glossy candy button: gradient face, shine band, darker 3D base, springy press.
export default function GameButton({ title, icon, onPress, color = GREEN, height = 56, fontSize = 24, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={style}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, speed: 40, bounciness: 0, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 10, useNativeDriver: true }).start()}
      onPress={() => {
        playSfx("tap");
        haptic("select");
        onPress && onPress();
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={{ borderRadius: height / 2.6, backgroundColor: shade(color, -0.38), paddingBottom: 6 }}>
          <LinearGradient
            colors={[shade(color, 0.3), color, shade(color, -0.08)]}
            style={{
              height,
              borderRadius: height / 2.6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 18,
              borderWidth: 2,
              borderColor: shade(color, 0.45),
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 3,
                left: 14,
                right: 14,
                height: height * 0.36,
                borderRadius: height,
                backgroundColor: "rgba(255,255,255,0.3)",
              }}
            />
            {icon ? <Text style={{ color: "#fff", fontSize: fontSize * 1.05, marginRight: title ? 12 : 0 }}>{icon}</Text> : null}
            {title ? (
              <Text
                numberOfLines={1}
                style={{
                  color: "#fff",
                  fontSize,
                  ...displayFont(),
                  textShadowColor: shade(color, -0.5),
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 1,
                }}
              >
                {title}
              </Text>
            ) : null}
          </LinearGradient>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// Round glossy icon button (settings, medals, back).
export function RoundButton({ icon, color = PURPLE, size = 52, onPress, label }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      hitSlop={8}
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, speed: 40, bounciness: 0, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 10, useNativeDriver: true }).start()}
      onPress={() => {
        playSfx("tap");
        onPress && onPress();
      }}
      style={{ alignItems: "center" }}
    >
      <Animated.View style={{ transform: [{ scale }], borderRadius: size / 2, backgroundColor: shade(color, -0.4), paddingBottom: 4 }}>
        <LinearGradient
          colors={[shade(color, 0.35), color]}
          style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: shade(color, 0.5) }}
        >
          <Text style={{ fontSize: size * 0.5, color: "#fff", fontWeight: "900" }}>{icon}</Text>
        </LinearGradient>
      </Animated.View>
      {label ? (
        <Text style={{ color: "#fff", fontSize: 13, marginTop: 3, ...displayFont(), textShadowColor: "rgba(0,0,0,0.35)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
