# DEVLOG

## 2026-05-21

### Project status

- Created the first React + TypeScript + Vite prototype for a Monopoly-style board game.
- Current prototype name: Demo 0.1, movement prototype.
- Repository pushed to GitHub:
  - https://github.com/Jenovic-th/monopoly-chonburi-game
- Latest initial commit:
  - `ba57164 Initial Chonburi board game prototype`

### Completed

- Set up the project structure with Vite, React, and TypeScript.
- Installed npm dependencies.
- Built a 40-tile square board.
- Board starts at tile `00` in the bottom-right corner.
- Movement direction follows the classic Monopoly feel:
  - bottom row moves right to left,
  - left side moves upward,
  - top row moves left to right,
  - right side moves downward.
- Added 1 human player and 2 AI players.
- Represented player pieces with simple geometric tokens:
  - Player: blue circle,
  - AI 1: red square,
  - AI 2: green triangle.
- Added two random dice.
- Added fast tile-by-tile movement.
- Added a main action button that changes by game phase:
  - `Roll Dice`,
  - `Fast Forward`,
  - `Skip Move`.
- Added automatic AI turns.
- Added `Reset`.
- Added protection so reset does not let old movement logic keep updating the game state.
- Added `.gitignore` coverage for generated and temporary files:
  - `node_modules`,
  - `dist`,
  - logs,
  - error log files.

### Verified

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed.
- Local Vite server responded with HTTP 200 at:
  - http://127.0.0.1:5173
- GitHub push completed successfully.

### Known notes

- Browser screenshot automation had trouble in this environment, but the app build, lint, and local HTTP server checks passed.
- Git showed `error: daemon terminated` in some commands, but core Git operations still completed.
- Git also reported permission warnings when writing `.git/config`, but the remote was added and push succeeded.

### Design direction discussed

- The game should be developed in small systems.
- The first prototype only proves dice, turns, board layout, and movement.
- The next major design area is tile data.
- Theme direction should start with a Chonburi/Sriracha local map instead of a whole Thailand map.
- Proposed future board zones:
  - Chonburi city / Bang Saen / Nong Mon,
  - Sriracha / Koh Loi / Laem Chabang / Koh Sichang,
  - Pattaya / Bang Lamung,
  - Sattahip / Na Jomtien / Khao Chi Chan / Samae San.

