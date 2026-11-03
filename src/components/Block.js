import React, { memo } from "react";
import { View } from "react-native";
import { shade } from "../utils/color";

// Glossy beveled block: four coloured borders (light top/left, dark
// bottom/right) plus a lighter glossy top half — plain Views, so it stays smooth.
function Block({ color, size }) {
  const b = Math.max(2, Math.round(size * 0.13));
  const inner = size - b * 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderTopWidth: b,
        borderLeftWidth: b,
        borderRightWidth: b,
        borderBottomWidth: b,
        borderTopColor: shade(color, 0.45),
        borderLeftColor: shade(color, 0.25),
        borderRightColor: shade(color, -0.2),
        borderBottomColor: shade(color, -0.35),
        borderRadius: Math.max(2, size * 0.08),
      }}
    >
      {/* glossy lighter top half in the block's own colour */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          height: inner * 0.48,
          backgroundColor: shade(color, 0.18),
        }}
      />
    </View>
  );
}

export default memo(Block);
