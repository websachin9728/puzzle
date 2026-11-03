import React from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PopupModal from "./PopupModal";
import GameButton, { GREEN, ORANGE } from "./GameButton";
import { useStore } from "../store/GameStore";
import { playSfx } from "../services/audio";
import { haptic } from "../services/haptics";

// Round colourful toggle; turns grey with a red strike-through when off.
function Toggle({ icon, label, on, colors, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", width: 92 }}>
      <LinearGradient
        colors={on ? colors : ["#7a7f9e", "#575c7a"]}
        style={{ width: 66, height: 66, borderRadius: 33, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: on ? "#ffffff" : "#9a9fbd" }}
      >
        <Text style={{ fontSize: 32 }}>{icon}</Text>
        {!on ? (
          <View style={{ position: "absolute", width: 64, height: 5, borderRadius: 3, backgroundColor: "#ff3b3b", transform: [{ rotate: "-40deg" }] }} />
        ) : null}
      </LinearGradient>
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15, marginTop: 6 }}>{label}</Text>
    </Pressable>
  );
}

export default function SettingsModal({ visible, onClose, onHome, onReplay }) {
  const store = useStore();
  const s = store.profile.settings;
  const flip = (key) => {
    store.updateSettings({ [key]: !s[key] });
    playSfx("tap");
    if (key === "vibration" && !s.vibration) haptic("medium");
  };
  return (
    <PopupModal visible={visible} title="Settings" onClose={onClose}>
      <View style={{ flexDirection: "row", justifyContent: "space-around", paddingBottom: onHome ? 18 : 4 }}>
        <Toggle icon="🔊" label="Sound" on={s.sound} colors={["#4fd1ff", "#2a7bff"]} onPress={() => flip("sound")} />
        <Toggle icon="🎵" label="Music" on={s.music} colors={["#ff8ad8", "#c13dff"]} onPress={() => flip("music")} />
        <Toggle icon="📳" label="Vibration" on={s.vibration} colors={["#ffd25a", "#ff8a1f"]} onPress={() => flip("vibration")} />
      </View>
      {onHome ? (
        <>
          <GameButton title="Home" icon="🏠" color={ORANGE} onPress={onHome} />
          <GameButton title="Replay" icon="↻" color={GREEN} onPress={onReplay} style={{ marginTop: 14 }} />
        </>
      ) : null}
    </PopupModal>
  );
}
