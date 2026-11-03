import React, { memo, useCallback, useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRID } from "../game/logic";
import Block from "./Block";
import ParticleBurst from "./ParticleBurst";

const GAP = 2;
export const BOARD_PAD = 5;

const colorOf = (theme, v) => theme.palette[(v - 1) % theme.palette.length];

// One grid cell. Memoized so a drag only re-renders the cells whose state changed.
const Cell = memo(function Cell({ v, size, theme, ghostColor, lineColor, popId }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!popId || !v) return;
    scale.setValue(0.7);
    Animated.spring(scale, { toValue: 1, speed: 22, bounciness: 10, useNativeDriver: true }).start();
  }, [popId]);
  const inner = size - GAP;
  return (
    <View style={{ width: size, height: size, padding: GAP / 2 }}>
      {v ? (
        <Animated.View style={{ transform: [{ scale }] }}>
          <Block color={lineColor || colorOf(theme, v)} size={inner} />
        </Animated.View>
      ) : ghostColor ? (
        // where the piece will land: translucent block with a bright outline
        <View style={{ width: inner, height: inner, borderRadius: 4, borderWidth: 2, borderColor: "rgba(255,255,255,0.9)" }}>
          <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 0.55 }}>
            <Block color={ghostColor} size={inner - 4} />
          </View>
        </View>
      ) : (
        <View style={{ width: inner, height: inner, backgroundColor: theme.cell, borderRadius: 2 }} />
      )}
    </View>
  );
});

// Cleared blocks swell, flash white and vanish in a quick wave.
function ClearingBlock({ r, c, v, cell, theme, delay }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 360, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
  }, []);
  const scale = t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 1.15, 0.2] });
  const opacity = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.9, 0] });
  const flash = t.interpolate({ inputRange: [0, 0.3, 0.7], outputRange: [0.8, 0.5, 0] });
  const inner = cell - GAP;
  return (
    <Animated.View style={{ position: "absolute", left: c * cell + GAP / 2, top: r * cell + GAP / 2, opacity, transform: [{ scale }] }}>
      <Block color={colorOf(theme, v)} size={inner} />
      <Animated.View style={{ position: "absolute", left: 0, top: 0, width: inner, height: inner, backgroundColor: "#fff", opacity: flash }} />
    </Animated.View>
  );
}

// Bright beam that flashes along a cleared row or column.
function LineBeam({ index, vertical, cell, color }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, []);
  const len = GRID * cell;
  const thick = cell * 1.5;
  const opacity = t.interpolate({ inputRange: [0, 0.12, 0.55, 1], outputRange: [0, 1, 0.75, 0] });
  const grow = t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 1.25] });
  const thin = t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.5, 1, 0.3] });
  const pos = index * cell + cell / 2 - thick / 2;
  const stops = ["rgba(255,255,255,0)", color, "#ffffff", color, "rgba(255,255,255,0)"];
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: vertical ? pos : -cell * 0.4,
        top: vertical ? -cell * 0.4 : pos,
        width: vertical ? thick : len + cell * 0.8,
        height: vertical ? len + cell * 0.8 : thick,
        opacity,
        transform: vertical ? [{ scaleY: grow }, { scaleX: thin }] : [{ scaleX: grow }, { scaleY: thin }],
      }}
    >
      <LinearGradient
        colors={stops}
        start={vertical ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 }}
        end={vertical ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 }}
        style={{ flex: 1, borderRadius: thick / 2 }}
      />
    </Animated.View>
  );
}

function ClearingLayer({ clearing, cell, theme }) {
  const { cells, rows } = clearing;
  const wave = (r, c) => (rows.includes(r) ? c : r) * 18;
  const points = cells.map(([r, c, v]) => ({ x: c * cell + cell / 2, y: r * cell + cell / 2, color: colorOf(theme, v) }));
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}>
      {cells.map(([r, c, v]) => (
        <ClearingBlock key={`${r}-${c}`} r={r} c={c} v={v} cell={cell} theme={theme} delay={wave(r, c)} />
      ))}
      {clearing.rows.map((r) => (
        <LineBeam key={"r" + r} index={r} cell={cell} color={points.length ? points[0].color : theme.accent} />
      ))}
      {clearing.cols.map((c) => (
        <LineBeam key={"c" + c} index={c} vertical cell={cell} color={points.length ? points[0].color : theme.accent} />
      ))}
      <ParticleBurst points={points} effect="shards" palette={theme.palette} unit={cell} />
      <ParticleBurst points={points} effect="sparkle" palette={theme.palette} accent="#fff6b0" unit={cell} />
    </View>
  );
}

// The 8x8 board. Reports the page position of cell (0,0) via onMeasured so the
// game screen can map touches onto rows and columns.
function Board({ grid, cell, theme, ghost, previewLines, pops, clearing, onMeasured }) {
  const innerRef = useRef(null);
  const size = GRID * cell;

  const measure = useCallback(() => {
    const node = innerRef.current;
    // measure() gives page coordinates — the same space as touch pageX/pageY
    if (node && node.measure) {
      node.measure((x, y, w, h, pageX, pageY) => {
        if (typeof pageX === "number") onMeasured && onMeasured({ x: pageX, y: pageY, cell });
      });
    }
  }, [onMeasured, cell]);

  useEffect(() => {
    const t = setTimeout(measure, 450); // after the screen transition settles
    return () => clearTimeout(t);
  }, [measure]);

  const ghostColor = ghost ? colorOf(theme, ghost.color) : null;
  return (
    <View
      style={{
        padding: BOARD_PAD,
        borderRadius: 12,
        backgroundColor: theme.board,
        borderWidth: 3,
        borderColor: theme.frame,
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
      }}
    >
      <View ref={innerRef} onLayout={measure} collapsable={false} style={{ width: size, height: size, flexDirection: "row", flexWrap: "wrap" }}>
        {grid.map((row, r) =>
          row.map((v, c) => {
            const key = r * GRID + c;
            const isGhost = ghost && ghost.cells.has(key);
            // lines that are about to clear light up in the dragged piece's colour
            const inLine = previewLines && (previewLines.rows.includes(r) || previewLines.cols.includes(c));
            return (
              <Cell
                key={key}
                v={v || (isGhost && inLine ? ghost.color : 0)}
                size={cell}
                theme={theme}
                ghostColor={isGhost && !v && !inLine ? ghostColor : null}
                lineColor={inLine ? ghostColor : null}
                popId={pops ? pops[key] : 0}
              />
            );
          })
        )}
        {clearing ? <ClearingLayer key={clearing.id} clearing={clearing} cell={cell} theme={theme} /> : null}
      </View>
    </View>
  );
}

export default memo(Board);
