// Bubbly display font used by the logo, big buttons and scores.
// Lilita One — SIL Open Font License (assets/fonts/OFL.txt).
import * as Font from "expo-font";

export const DISPLAY_FONT = "LilitaOne";
let loaded = false;

export async function loadFonts() {
  try {
    await Font.loadAsync({ [DISPLAY_FONT]: require("../../assets/fonts/LilitaOne-Regular.ttf") });
    loaded = true;
  } catch (e) {
    loaded = false; // fall back to the system font
  }
}

// Style for display text; heavy system font until the custom font is ready.
export function displayFont() {
  return loaded ? { fontFamily: DISPLAY_FONT, fontWeight: "normal" } : { fontWeight: "900" };
}
