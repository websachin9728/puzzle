import React, { memo } from "react";
import { View } from "react-native";
import Block from "./Block";

// Renders a shape matrix as a grid of blocks at the given cell size.
function MiniPiece({ shape, color, cell, gap = 2, dim = false }) {
  if (!shape) return null;
  const rows = shape.length;
  const cols = shape[0].length;
  return (
    <View style={{ width: cols * cell, height: rows * cell, opacity: dim ? 0.35 : 1 }}>
      {shape.map((row, r) =>
        row.map((v, c) =>
          v ? (
            <View
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: c * cell,
                top: r * cell,
                width: cell,
                height: cell,
                padding: gap / 2,
              }}
            >
              <Block color={color} size={cell - gap} />
            </View>
          ) : null
        )
      )}
    </View>
  );
}

export default memo(MiniPiece);
