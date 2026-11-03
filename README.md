# BlockPop 🧩

A simple, clean 8×8 block puzzle built with **React Native 0.79 + Expo SDK 53** (JavaScript).
Drag the three pieces onto the board, fill rows or columns to clear them, and keep clearing to
build a combo.

## Gameplay
- 8×8 board (64 cells, engine `GRID = 8`), 30 piece shapes, 8 block colours
- Drag and drop with a snap preview; lines that are about to clear light up
- Rows and columns clear together; points: 10 per block, lines 1→100, 2→250, 3→450,
  4→700 (+100 when rows and columns clear together) × combo
- **Combo**: every move that clears a line adds +1. The combo only breaks after
  3 placements in a row without a clear, so continuous blasting keeps it climbing
- Clearing the whole board gives +1,000 and switches to the next colour theme
- Game over when none of the pieces fit; the game in progress is saved and can be continued

## Screens
- **Home**: logo, best score, Play / Continue, settings
- **Game**: best score, settings, current score, board, pieces
- **Settings** popup: Sound, Music, Vibration, plus Home / Replay during a game
- **Game Over**: score, best score, play again

## Setup & build
```bash
npm install
cd android && gradlew.bat assembleRelease   # android/app/build/outputs/apk/release/app-release.apk
```
The release APK is signed with the debug keystore; use your own keystore and
`gradlew.bat bundleRelease` for Google Play. iOS: on a Mac run `npx expo prebuild --platform ios`
then build with Xcode.

Sounds and music are synthesized by `scripts/generate-audio.js` (original, copyright-free).
Display font: Lilita One (SIL Open Font License, `assets/fonts/`).

## Structure
```
App.js                  loads data + font, then Home / Game
src/game/               engine.js (rules, scoring, combo), logic.js (8x8 grid), shapes.js
src/store/GameStore.js  best score, settings, theme, saved game (AsyncStorage)
src/screens/            HomeScreen, GameScreen
src/components/         Block, Board, MiniPiece, SettingsModal, GameButton, ...
src/constants/          themes.js (colour themes), fonts.js
src/services/           audio.js, haptics.js
```
