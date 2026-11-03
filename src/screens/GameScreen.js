import React, { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Easing, PanResponder, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import Board, { BOARD_PAD } from "../components/Board";
import MiniPiece from "../components/MiniPiece";
import GameButton, { RoundButton, GREEN, PURPLE, ORANGE } from "../components/GameButton";
import AnimatedNumber from "../components/AnimatedNumber";
import SettingsModal from "../components/SettingsModal";
import { GRID } from "../game/logic";
import { newGame, applyMove, previewClears, canPieceFit, isValidSavedGame, hasMoves } from "../game/engine";
import { levelGrid, levelTarget, LEVEL_COUNT } from "../game/levels";
import { useStore, useTheme } from "../store/GameStore";
import { displayFont } from "../constants/fonts";
import { formatNumber } from "../utils/format";
import { playMusic, playSfx, speak } from "../services/audio";
import { PraiseBanner, ComboBurst, Shout, NewRecord } from "../components/Celebrations";
import { haptic } from "../services/haptics";

let seq = 0;

// The dragged piece moves faster than the finger, so a short swipe reaches the
// top of the board (upward movement is boosted most).
const DRAG_X = 1.25;
const DRAG_UP = 1.9;
const DRAG_DOWN = 1.2;
const dragPoint = (g) => ({ x: g.x0 + g.dx * DRAG_X, y: g.y0 + g.dy * (g.dy < 0 ? DRAG_UP : DRAG_DOWN) });

// "+250" rising from where the lines were cleared.
function FloatText({ item, onDone }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => onDone(item.id));
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.Text
      style={{
        position: "absolute",
        left: item.x - 120,
        top: item.y - 20,
        width: 240,
        textAlign: "center",
        color: "#fff",
        fontSize: 30,
        ...displayFont(),
        textShadowColor: "rgba(0,0,0,0.45)",
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 2,
        opacity,
        transform: [{ translateY }],
      }}
    >
      {item.text}
    </Animated.Text>
  );
}

// Every clear gets a word; bigger clears and combos get bigger words.
const SINGLE = ["Good!", "Nice!", "Great!"];
let singleIdx = 0;
function praiseFor(r) {
  if (r.perfect) return "Perfect!";
  if (r.lines >= 4 || r.combo >= 6) return "Unbelievable!";
  if (r.lines === 3 || r.combo >= 4) return "Amazing!";
  if (r.lines === 2 || r.combo === 3) return "Excellent!";
  if (r.combo === 2) return "Great!";
  return SINGLE[singleIdx++ % SINGLE.length];
}

// A tray piece that springs in whenever a new piece is dealt.
function TrayPiece({ piece, color, cell, dim, shake }) {
  const s = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: 1, speed: 16, bounciness: 10, useNativeDriver: true }).start();
  }, []);
  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] });
  return (
    <Animated.View style={{ transform: [{ translateX }, { scale: s }] }}>
      <MiniPiece shape={piece.shape} color={color} cell={cell} dim={dim} />
    </Animated.View>
  );
}

// Adventure result: level complete (next level) or failed (retry).
function LevelResult({ data, theme, onPrimary, onHome }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(t, { toValue: 1, speed: 12, bounciness: 10, useNativeDriver: true }).start();
  }, []);
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const win = data.type === "win";
  return (
    <Animated.View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: t }}>
      <LinearGradient colors={theme.bg} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
        <Animated.View style={{ alignItems: "center", alignSelf: "stretch", transform: [{ scale }] }}>
          <Text style={{ fontSize: 80 }}>{win ? "🏆" : "😵"}</Text>
          <Text style={{ color: win ? "#ffe27a" : "#ffffff", fontSize: 48, textAlign: "center", ...displayFont(), textShadowColor: win ? "#c2185b" : "#3a1680", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 1 }}>
            {win ? "Level Complete!" : "Level Failed"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 22, marginTop: 12, ...displayFont() }}>Level {data.level}</Text>
          <Text style={{ color: "#dfe6ff", fontSize: 18, marginTop: 6, ...displayFont() }}>
            {formatNumber(data.score)} / {formatNumber(data.target)}
          </Text>
          <GameButton
            title={win ? (data.level < LEVEL_COUNT ? "Next Level" : "Finish") : "Retry"}
            icon={win ? "▶" : "↻"}
            color={GREEN}
            height={62}
            fontSize={28}
            onPress={onPrimary}
            style={{ alignSelf: "stretch", marginTop: 36 }}
          />
          <Pressable onPress={onHome} style={{ marginTop: 22, padding: 6 }}>
            <Text style={{ color: "#fff", fontSize: 20, ...displayFont() }}>🏠 Home</Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

// Full-screen game over: score, best score, play again.
function GameOver({ data, theme, onPlay, onHome }) {
  const t = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    const id = setTimeout(() => setShown(data.score), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <Animated.View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: t }}>
      <LinearGradient colors={theme.bg} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
        <Text style={{ color: "#ffe27a", fontSize: 58, ...displayFont(), textShadowColor: "#c2185b", textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 1 }}>
          Game Over
        </Text>
        <Text style={{ color: "#fff", fontSize: 22, marginTop: 40, ...displayFont() }}>Score</Text>
        <AnimatedNumber value={shown} duration={900} bump={false} style={{ color: "#fff", fontSize: 64, ...displayFont() }} />
        <Text style={{ color: "#fff", fontSize: 22, marginTop: 26, ...displayFont() }}>{data.newBest ? "New Best Score!" : "Best Score"}</Text>
        <Text style={{ color: "#ffb52e", fontSize: 44, ...displayFont() }}>{formatNumber(data.best)}</Text>
        <GameButton icon="▶" color={GREEN} height={64} fontSize={34} onPress={onPlay} style={{ alignSelf: "stretch", marginTop: 40 }} />
        <Pressable onPress={onHome} style={{ marginTop: 22, padding: 6 }}>
          <Text style={{ color: "#fff", fontSize: 20, ...displayFont() }}>🏠 Home</Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

export default function GameScreen({ nav, params }) {
  const store = useStore();
  const { profile } = store;
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const adventure = params.mode === "adventure";
  const level = params.level || 1;
  const target = adventure ? levelTarget(level) : 0;

  // ---- layout ----
  const SIDE = 12;
  const usableH = height - insets.top - insets.bottom;
  const trayH = Math.round(Math.min(170, usableH * 0.2));
  const cell = Math.floor(Math.min(width - SIDE * 2 - BOARD_PAD * 2 - 6, usableH - 170 - trayH - 30) / GRID);
  const trayCell = Math.max(14, Math.min(Math.round(cell * 0.5), Math.floor((trayH - 30) / 5)));

  const [game, setGame] = useState(() => {
    if (adventure) return newGame({ grid: levelGrid(level) });
    const saved = store.get().savedGame;
    return params.resume && isValidSavedGame(saved) ? saved : newGame();
  });
  const gameRef = useRef(game);
  gameRef.current = game;

  const [dragIndex, setDragIndex] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [previewLines, setPreviewLines] = useState(null);
  const [pops, setPops] = useState(null);
  const [clearing, setClearing] = useState(null);
  const [floats, setFloats] = useState([]);
  const [banners, setBanners] = useState([]);
  const [combos, setCombos] = useState([]);
  const [shouts, setShouts] = useState([]);
  const [record, setRecord] = useState(null); // end-of-game NEW RECORD overlay
  const shake = useRef(new Animated.Value(0)).current;
  const recordShown = useRef(false);
  const [settings, setSettings] = useState(false);
  const [over, setOver] = useState(null);
  const [oldBg, setOldBg] = useState(null);

  const bestAtStart = useRef(store.get().bestScore);
  const boardPos = useRef(null);
  const rootRef = useRef(null);
  const rootOffset = useRef({ x: 0, y: 0 });
  const lastGhostKey = useRef("");
  const floatXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const floatScale = useRef(new Animated.Value(1)).current;
  const bgFade = useRef(new Animated.Value(0)).current;
  const shakes = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const timers = useRef([]);
  const blockedRef = useRef(false);
  blockedRef.current = settings || !!over;
  const overRef = useRef(null);
  overRef.current = over;
  const wonRef = useRef(false); // level target reached: no more moves

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  useEffect(() => {
    playMusic("game");
    if (!adventure) {
      if (!params.resume) store.clearSavedGame();
      nav.setParams({ resume: true }); // coming back here resumes instead of restarting
    }
    if (!hasMoves(gameRef.current)) later(() => finish(gameRef.current), 600);
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (overRef.current) nav.reset("home");
      else setSettings((v) => !v);
      return true;
    });
    return () => {
      sub.remove();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  // cross-fade the background when the theme changes (after a perfect clear)
  const lastTheme = useRef(theme);
  useEffect(() => {
    if (lastTheme.current.id === theme.id) return;
    setOldBg(lastTheme.current.bg);
    lastTheme.current = theme;
    bgFade.setValue(1);
    Animated.timing(bgFade, { toValue: 0, duration: 900, useNativeDriver: true }).start(() => setOldBg(null));
  }, [theme.id]);

  // ---------- helpers ----------
  const cellPoint = (r, c) => {
    const bp = boardPos.current;
    if (!bp) return { x: width / 2, y: height / 2 };
    return { x: bp.x + (c + 0.5) * bp.cell - rootOffset.current.x, y: bp.y + (r + 0.5) * bp.cell - rootOffset.current.y };
  };
  const colorOf = (v) => theme.palette[(v - 1) % theme.palette.length];

  function computeTarget(idx, fx0, fy0) {
    const bp = boardPos.current;
    const piece = gameRef.current.tray[idx];
    if (!bp || !piece) return null;
    const cols = piece.shape[0].length;
    const rows = piece.shape.length;
    const floatLeft = fx0 - (cols * bp.cell) / 2;
    const floatTop = fy0 - rows * bp.cell - bp.cell * 1.2; // keep the piece visible above the finger
    const col = Math.round((floatLeft - bp.x) / bp.cell);
    const row = Math.round((floatTop - bp.y) / bp.cell);
    const lines = previewClears(gameRef.current.grid, piece.shape, row, col);
    return { row, col, floatLeft, floatTop, piece, valid: !!lines, lines };
  }

  function updateGhost(tg) {
    const key = `${tg.row},${tg.col},${tg.valid}`;
    if (key === lastGhostKey.current) return;
    lastGhostKey.current = key;
    if (!tg.valid) {
      setGhost(null);
      setPreviewLines(null);
      return;
    }
    const cells = new Set();
    tg.piece.shape.forEach((r, ri) => r.forEach((v, ci) => v && cells.add((tg.row + ri) * GRID + tg.col + ci)));
    setGhost({ cells, color: tg.piece.color });
    setPreviewLines(tg.lines.rows.length + tg.lines.cols.length > 0 ? tg.lines : null);
  }

  function shakeScreen() {
    shake.setValue(0);
    Animated.sequence([1, -1, 0.7, -0.7, 0].map((x) => Animated.timing(shake, { toValue: x * 7, duration: 45, useNativeDriver: true }))).start();
  }

  function shakeSlot(idx) {
    const v = shakes[idx];
    v.setValue(0);
    Animated.sequence([1, -1, 1, 0].map((x) => Animated.timing(v, { toValue: x, duration: 45, useNativeDriver: true }))).start();
  }

  // ---------- drag handlers (fresh each render, called by stable responders) ----------
  const handlers = useRef({});
  const dragIndexRef = useRef(null);
  handlers.current.grant = (idx, g) => {
    if (blockedRef.current || wonRef.current || !gameRef.current.tray[idx]) return;
    const tg = computeTarget(idx, g.x0, g.y0);
    if (!tg) return;
    dragIndexRef.current = idx;
    floatXY.setValue({ x: tg.floatLeft - rootOffset.current.x, y: tg.floatTop - rootOffset.current.y });
    floatScale.setValue(0.55);
    Animated.spring(floatScale, { toValue: 1, speed: 24, bounciness: 6, useNativeDriver: true }).start();
    setDragIndex(idx);
    lastGhostKey.current = "";
    updateGhost(tg);
    playSfx("pickup");
    haptic("light");
  };
  handlers.current.move = (idx, g) => {
    if (dragIndexRef.current !== idx) return;
    const p = dragPoint(g);
    const tg = computeTarget(idx, p.x, p.y);
    if (!tg) return;
    floatXY.setValue({ x: tg.floatLeft - rootOffset.current.x, y: tg.floatTop - rootOffset.current.y });
    updateGhost(tg);
  };
  handlers.current.release = (idx, g) => {
    if (dragIndexRef.current !== idx) return;
    const p = dragPoint(g);
    const tg = computeTarget(idx, p.x, p.y);
    dragIndexRef.current = null;
    setDragIndex(null);
    setGhost(null);
    setPreviewLines(null);
    lastGhostKey.current = "";
    if (tg && tg.valid) doMove(idx, tg.row, tg.col);
    else {
      playSfx("invalid");
      shakeSlot(idx);
    }
  };

  const responders = useRef(
    [0, 1, 2].map((idx) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e, g) => handlers.current.grant(idx, g),
        onPanResponderMove: (e, g) => handlers.current.move(idx, g),
        onPanResponderRelease: (e, g) => handlers.current.release(idx, g),
        onPanResponderTerminate: (e, g) => handlers.current.release(idx, g),
      })
    )
  ).current;

  // ---------- applying a move ----------
  function doMove(idx, row, col) {
    const res = applyMove(gameRef.current, idx, row, col);
    if (!res) return;
    const { state, result } = res;
    gameRef.current = state;
    setGame(state);

    const id = ++seq;
    const nextPops = {};
    result.placedCells.forEach(([r, c]) => (nextPops[r * GRID + c] = id));
    setPops(nextPops);

    if (result.lines > 0) {
      setClearing({ id, cells: result.clearedCells, rows: result.rows, cols: result.cols });
      later(() => setClearing((c) => (c && c.id === id ? null : c)), 900);

      // praise word for every clear, on a glowing band across the cleared line
      const word = praiseFor(result);
      const bp = boardPos.current;
      const bandCell = bp ? bp.cell : cell;
      const bandRow = result.rows.length ? result.rows[0] : Math.floor(GRID / 2);
      const bandPt = cellPoint(bandRow, (GRID - 1) / 2);
      setBanners((x) => [
        ...x.slice(-1),
        {
          id: ++seq,
          word,
          points: formatNumber(result.gained),
          color: colorOf(result.clearedCells[0][2]),
          left: bandPt.x - (GRID * bandCell) / 2,
          width: GRID * bandCell,
          y: bandPt.y,
          h: bandCell * 1.1,
        },
      ]);
      later(() => speak(word), 120);
      if (result.combo >= 2) {
        const mid = cellPoint((GRID - 1) / 2, (GRID - 1) / 2);
        setCombos((x) => [...x.slice(-1), { id: ++seq, combo: result.combo, x: mid.x, y: mid.y - bandCell * 1.5 }]);
      }
      if (result.lines >= 3 || result.combo >= 4 || result.perfect) shakeScreen();

      // sound escalates with the size of the clear and the combo
      if (result.perfect) playSfx("fullclear");
      else if (result.combo >= 2) playSfx(`combo${Math.min(5, result.combo)}`);
      else if (result.lines >= 3) playSfx("blast");
      else if (result.lines === 2) playSfx("clearMulti");
      else playSfx(result.rows.length ? "clearRow" : "clearCol");
      haptic(result.lines >= 2 || result.combo >= 2 ? "heavy" : "medium");
    } else {
      playSfx("place");
      haptic("light");
    }

    store.recordMove(result);
    if (result.perfect) later(() => store.nextTheme(), 500); // empty board -> new colours

    if (adventure) {
      if (state.score >= target) {
        wonRef.current = true; // block further moves right away
        store.completeLevel(level);
        later(() => {
          playSfx("fullclear");
          haptic("success");
          setOver({ type: "win", level, score: state.score, target });
        }, 700);
      } else if (result.gameOver) later(() => finish(state), 800);
      return;
    }

    if (state.score > store.get().bestScore) {
      store.setBest(state.score);
      if (!recordShown.current && bestAtStart.current > 0) {
        recordShown.current = true;
        const mid = cellPoint((GRID - 1) / 2, (GRID - 1) / 2);
        later(() => setShouts((x) => [...x, { id: ++seq, text: "New Record!", y: mid.y + cell * 2 }]), 900);
      }
    }
    store.saveGame(state);
    if (result.gameOver) later(() => finish(state), 800);
  }

  function finish(state) {
    if (overRef.current) return;
    if (adventure) {
      playSfx("gameover");
      haptic("error");
      setOver({ type: "fail", level, score: state.score, target });
      return;
    }
    store.finishGame(state.score);
    if (state.score > bestAtStart.current && state.score > 0) {
      playSfx("fullclear");
      haptic("success");
      later(() => speak("New record!"), 300);
      setRecord(state.score);
    } else {
      playSfx("gameover");
      haptic("error");
    }
    setOver({ score: state.score, best: Math.max(bestAtStart.current, state.score), newBest: state.score > bestAtStart.current && state.score > 0 });
  }

  function restart() {
    const g = adventure ? newGame({ grid: levelGrid(level) }) : newGame();
    gameRef.current = g;
    wonRef.current = false;
    setGame(g);
    if (!adventure) store.clearSavedGame();
    bestAtStart.current = store.get().bestScore;
    setOver(null);
    setSettings(false);
    setPops(null);
    setClearing(null);
    setFloats([]);
    setBanners([]);
    setCombos([]);
    setShouts([]);
    setRecord(null);
    recordShown.current = false;
  }

  function goHome() {
    setSettings(false);
    nav.reset("home");
  }

  const measureRoot = () =>
    rootRef.current &&
    rootRef.current.measure((x, y, w, h, pageX, pageY) => {
      if (typeof pageX === "number") rootOffset.current = { x: pageX, y: pageY };
    });

  const draggingPiece = dragIndex != null ? game.tray[dragIndex] : null;

  return (
    <LinearGradient colors={theme.bg} style={{ flex: 1 }}>
      {oldBg ? (
        <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: bgFade }}>
          <LinearGradient colors={oldBg} style={{ flex: 1 }} />
        </Animated.View>
      ) : null}
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View ref={rootRef} onLayout={measureRoot} collapsable={false} style={{ flex: 1, paddingHorizontal: SIDE, transform: [{ translateX: shake }] }}>
          {/* best score / level + settings */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            {adventure ? (
              <View style={{ flex: 1, marginRight: 14, backgroundColor: "rgba(20,10,70,0.4)", borderRadius: 16, padding: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 22, ...displayFont() }}>📍 Level {level}</Text>
                  <Text style={{ color: "#ffe27a", fontSize: 14, ...displayFont() }}>🎯 {formatNumber(target)}</Text>
                </View>
                <View style={{ height: 12, borderRadius: 6, backgroundColor: "rgba(0,0,0,0.35)", marginTop: 6, overflow: "hidden" }}>
                  <LinearGradient
                    colors={["#fff27a", "#ff9f1a"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${Math.min(100, (game.score / target) * 100)}%`, height: "100%" }}
                  />
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(20,10,70,0.4)", borderRadius: 24, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 2, borderColor: "rgba(255,226,122,0.6)" }}>
                <Text style={{ fontSize: 28 }}>👑</Text>
                <Text style={{ color: "#ffe27a", fontSize: 26, marginLeft: 8, ...displayFont() }}>
                  {formatNumber(Math.max(profile.bestScore, game.score))}
                </Text>
              </View>
            )}
            <RoundButton icon="⚙️" color={PURPLE} size={50} onPress={() => setSettings(true)} />
          </View>

          {/* current score */}
          <View style={{ alignItems: "center", marginTop: 4, height: 86, justifyContent: "center" }}>
            <AnimatedNumber
              value={game.score}
              style={{ color: "#fff", fontSize: 68, ...displayFont(), textShadowColor: "rgba(30,10,90,0.6)", textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 1 }}
            />
          </View>

          {/* board */}
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Board
              grid={game.grid}
              cell={cell}
              theme={theme}
              ghost={ghost}
              previewLines={previewLines}
              pops={pops}
              clearing={clearing}
              onMeasured={(pos) => {
                boardPos.current = pos;
                measureRoot();
              }}
            />
          </View>

          {/* pieces */}
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", minHeight: trayH }}>
            {game.tray.map((piece, i) => (
              <View key={i} {...responders[i].panHandlers} style={{ flex: 1, height: trayH, alignItems: "center", justifyContent: "center" }}>
                {piece && dragIndex !== i ? (
                  <TrayPiece key={piece.id} piece={piece} color={colorOf(piece.color)} cell={trayCell} dim={!canPieceFit(game.grid, piece)} shake={shakes[i]} />
                ) : null}
              </View>
            ))}
          </View>

          {/* effects */}
          <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
            {floats.map((f) => (
              <FloatText key={f.id} item={f} onDone={(fid) => setFloats((all) => all.filter((x) => x.id !== fid))} />
            ))}
            {banners.map((x) => (
              <PraiseBanner key={x.id} item={x} onDone={(id) => setBanners((all) => all.filter((y) => y.id !== id))} />
            ))}
            {combos.map((x) => (
              <ComboBurst key={x.id} item={x} onDone={(id) => setCombos((all) => all.filter((y) => y.id !== id))} />
            ))}
            {shouts.map((x) => (
              <Shout key={x.id} item={x} onDone={(id) => setShouts((all) => all.filter((y) => y.id !== id))} />
            ))}
          </View>

          {/* dragged piece */}
          {draggingPiece ? (
            <Animated.View
              pointerEvents="none"
              style={{ position: "absolute", left: 0, top: 0, opacity: 0.78, transform: [...floatXY.getTranslateTransform(), { scale: floatScale }] }}
            >
              <MiniPiece shape={draggingPiece.shape} color={colorOf(draggingPiece.color)} cell={boardPos.current ? boardPos.current.cell : cell} />
            </Animated.View>
          ) : null}
        </Animated.View>
      </SafeAreaView>

      {over && over.type ? (
        <LevelResult
          data={over}
          theme={theme}
          onHome={goHome}
          onPrimary={() => {
            if (over.type === "fail") restart();
            else if (level < LEVEL_COUNT) nav.replace("game", { mode: "adventure", level: level + 1 });
            else nav.replace("adventure");
          }}
        />
      ) : over && record != null ? (
        <NewRecord score={record} onContinue={() => setRecord(null)} />
      ) : over ? (
        <GameOver data={over} theme={theme} onPlay={restart} onHome={goHome} />
      ) : null}
      <SettingsModal visible={settings && !over} onClose={() => setSettings(false)} onHome={goHome} onReplay={restart} />
    </LinearGradient>
  );
}
