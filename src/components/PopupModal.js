import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { displayFont } from "../constants/fonts";
import { playSfx } from "../services/audio";

// Colourful popup card with a gradient title bar and a close (×) button.
export default function PopupModal({ visible, title, onClose, children }) {
  const s = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      s.setValue(0);
      Animated.spring(s, { toValue: 1, speed: 16, bounciness: 8, useNativeDriver: true }).start();
    }
  }, [visible]);
  const scale = s.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const close = () => {
    playSfx("tap");
    onClose && onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: "rgba(15,8,45,0.72)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Animated.View style={{ width: "100%", maxWidth: 380, opacity: s, transform: [{ scale }] }}>
          <Pressable>
            <LinearGradient colors={["#ffb347", "#ff5e9c", "#8a4dff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 4 }}>
              <View style={{ backgroundColor: "#2a1f7a", borderRadius: 19, overflow: "hidden" }}>
                <LinearGradient colors={["#6f8cff", "#5a4dff"]} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", height: 60 }}>
                  <Text style={{ color: "#fff", fontSize: 30, ...displayFont(), textShadowColor: "#2a1f7a", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 1 }}>
                    {title}
                  </Text>
                  <Pressable
                    onPress={close}
                    hitSlop={12}
                    style={{ position: "absolute", right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: "#ff4f6a", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#ffb3c0" }}
                  >
                    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>✕</Text>
                  </Pressable>
                </LinearGradient>
                <View style={{ padding: 18 }}>{children}</View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
