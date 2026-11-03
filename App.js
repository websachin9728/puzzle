import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { GameStoreProvider, useStore } from "./src/store/GameStore";
import { Router } from "./src/navigation/Router";
import { loadFonts } from "./src/constants/fonts";
import { initAudio } from "./src/services/audio";
import SplashScreen from "./src/screens/SplashScreen";
import HomeScreen from "./src/screens/HomeScreen";
import GameScreen from "./src/screens/GameScreen";
import AdventureScreen from "./src/screens/AdventureScreen";
import AchievementsScreen from "./src/screens/AchievementsScreen";

const SCREENS = { splash: SplashScreen, home: HomeScreen, game: GameScreen, adventure: AdventureScreen, achievements: AchievementsScreen };

// Waits for saved data + font, starts audio, then shows the home screen.
function Root() {
  const { ready } = useStore();
  const [fonts, setFonts] = useState(false);
  useEffect(() => {
    loadFonts().then(() => setFonts(true));
  }, []);
  useEffect(() => {
    if (ready) initAudio();
  }, [ready]);
  if (!ready || !fonts) return <View style={{ flex: 1, backgroundColor: "#4b53e6" }} />;
  return <Router screens={SCREENS} initial="splash" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <GameStoreProvider>
          <Root />
        </GameStoreProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
