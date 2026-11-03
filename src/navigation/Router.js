// Minimal stack navigator: no extra dependency, animated screen transitions and
// Android back-button support. Screens receive { nav, params }.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, Easing, View } from "react-native";

const NavContext = createContext(null);
let keySeq = 0;

function ScreenTransition({ children, style }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  return <Animated.View style={[{ flex: 1, opacity: t, transform: [{ translateY }, { scale }] }, style]}>{children}</Animated.View>;
}

export function Router({ screens, initial }) {
  const [stack, setStack] = useState([{ name: initial, params: {}, key: ++keySeq }]);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const nav = useMemo(
    () => ({
      navigate: (name, params = {}) => setStack((s) => [...s, { name, params, key: ++keySeq }]),
      replace: (name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params, key: ++keySeq }]),
      reset: (name, params = {}) => setStack([{ name, params, key: ++keySeq }]),
      goBack: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      // update the current screen's params in place (no remount); used so that
      // coming back to the game resumes it instead of starting a new one
      setParams: (params) =>
        setStack((s) => [...s.slice(0, -1), { ...s[s.length - 1], params: { ...s[s.length - 1].params, ...params } }]),
      canGoBack: () => stackRef.current.length > 1,
    }),
    []
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stackRef.current.length > 1) {
        nav.goBack();
        return true;
      }
      return false; // let Android close/background the app from the home screen
    });
    return () => sub.remove();
  }, []);

  const top = stack[stack.length - 1];
  const Screen = screens[top.name];
  return (
    <NavContext.Provider value={nav}>
      <View style={{ flex: 1, backgroundColor: "#3a4d98" }}>
        <ScreenTransition key={top.key}>
          <Screen nav={nav} params={top.params} />
        </ScreenTransition>
      </View>
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}
