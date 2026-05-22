# DEVLOG

## 2026-05-22

### Latest handoff status

- Current milestone: Demo 0.3, special-tile prototype and investment placeholder flow.
- Repository:
  - https://github.com/Jenovic-th/monopoly-chonburi-game
- To see the newest commit on another computer after pulling:
  - `git log -1 --oneline`

### Added after Demo 0.2

- Added special behavior for `10` Burapha University:
  - first time the human player lands on tile `10`, a study card appears,
  - choosing to study skips the human player for 2 future human turns,
  - AI players continue taking turns while the human player is studying,
  - after bachelor study is completed, the player must land on tile `10` again to see the master degree option,
  - choosing master degree also skips 2 future human turns,
  - after master degree is completed, landing on tile `10` shows the placeholder alumni fee card:
    - `Alumni fee 0000`,
  - no grade/result system exists yet,
  - no money is charged yet.
- Added special behavior for `00` Investment Bank:
  - starting on tile `00` at game start does not count,
  - only landing exactly on tile `00` after moving counts as an Investment Bank visit,
  - visit counts are tracked per character:
    - Player,
    - AI 1,
    - AI 2,
  - human player sees an Investment Bank choice UI,
  - AI players only show a short status message for now.
- Investment Bank unlock ranges:
  - visit 1 unlocks normal tiles `01-09`, excluding special tile `05`,
  - visit 2 unlocks normal tiles `01-19`, excluding special tiles `05`, `10`,
  - visit 3 unlocks normal tiles `01-29`, excluding special tiles `05`, `10`, `20`,
  - visit 4 and later unlock normal tiles `01-39`, excluding special tiles `05`, `10`, `20`, `30`.
- Added placeholder investment plan cards after the player selects an unlocked tile:
  - `Small Stall`
    - cost placeholder: `30,000`
    - income placeholder: `3,000 / round`
  - `Local Shop`
    - cost placeholder: `120,000`
    - income placeholder: `12,000 / round`
  - `Anchor Business`
    - cost placeholder: `500,000`
    - income placeholder: `55,000 / round`
- Investment plan cards are UI-only for now:
  - selecting a plan only updates the status message,
  - no money is deducted,
  - no income is paid,
  - no business ownership is saved yet.

### Current important gameplay flow

- Human player presses `Roll Dice`.
- Human player moves based on two random dice.
- If the human player lands on a normal tile, the basic 3-card placeholder UI appears.
- If the human player lands on `00`, Investment Bank unlock selection appears.
- If the human player selects an Investment Bank target tile, 3 investment plan cards appear.
- If the human player lands on `10`, Burapha University study flow appears.
- AI players roll and move automatically.
- AI players do not open card UIs yet.

### Files most relevant for the next session

- `src/App.tsx`
  - turn flow,
  - phase handling,
  - card UI state,
  - Burapha University logic,
  - Investment Bank logic.
- `src/App.css`
  - board layout,
  - token visibility,
  - normal card UI,
  - education card UI,
  - investment card UI.
- `src/boardData.ts`
  - 40 Chonburi board tiles,
  - tile names,
  - zones,
  - categories,
  - descriptions.
- `TODO.md`
  - next implementation list.

### Recommended next development step

- Add the real money system before making investment cards permanent:
  - player cash,
  - starting cash,
  - investment cost deduction,
  - stored business investments,
  - income payout timing.
- Do not add land ownership/rent until the investment state is stable.

### Verified for this handoff

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed.
- Local app was reloaded in the in-app browser at:
  - http://127.0.0.1:5173/

### Current project status

- Demo 0.2 is now focused on Chonburi board data and first-pass card choice UI.
- Repository:
  - https://github.com/Jenovic-th/monopoly-chonburi-game
- Latest pushed commit:
  - `f06c2e5 Add Chonburi board tiles and card choice UI`

### Important workflow note for continuing on another computer

- Before continuing work on another machine, run:
  - `git pull origin main`
  - `npm.cmd install`
  - `npm.cmd run dev`
- Main files to read first:
  - `DEVLOG.md`
  - `TODO.md`
  - `src/boardData.ts`
  - `src/App.tsx`
  - `src/App.css`
- Do not edit generated folders:
  - `node_modules`
  - `dist`

### Completed today

- Added all 40 Chonburi board tiles in `src/boardData.ts`.
- Added tile names and tile categories to the board UI.
- Added a current-tile detail panel in the center control area.
- Added first-pass action card UI:
  - shows 3 card choices when the human player lands on a normal tile,
  - includes a `ไม่เล่นการ์ด` skip button,
  - AI players skip card choice for now.
- Card choices are placeholder-only for now:
  - `Street Trade`
  - `Local Deal`
  - `Area Scout`
- Card UI does not appear on special tiles:
  - `00` Investment Bank
  - `05` Political Event
  - `10` Burapha University
  - `20` Chonburi Prison
  - `30` Local Power Broker
- Fixed card-choice detection so it uses a reliable position ref instead of async React state.
- Improved player tokens:
  - tokens stay visible inside tiles,
  - tokens have a light capsule background,
  - multiple tokens on the same tile are grouped and do not overlap.

### Final 40-tile board

#### Bottom side: Bangsaen + Nong Mon

- `00` Investment Bank
- `01` Bangsaen Fish Market
- `02` Khao Sam Muk Viewpoint
- `03` Wonnapha Beach
- `04` Chonlamakwithi Bridge
- `05` Political Event
- `06` Nong Mon Market 1
- `07` Nong Mon Market 2
- `08` Bangsaen Beach 1
- `09` Bangsaen Beach 2
- `10` Burapha University

#### Left side: Sriracha + Laem Chabang

- `11` Bang Phra Reservoir
- `12` Sriracha Tiger Zoo
- `13` Koh Loi Health Park
- `14` J-Park Nihon Mura
- `15` Central Sriracha
- `16` Koh Sichang
- `17` Khao Kheow Open Zoo
- `18` Laem Chabang Industrial Estate 1
- `19` Laem Chabang Industrial Estate 2
- `20` Chonburi Prison

#### Top side: Amata City + Phan Thong

- `21` Amata Castle
- `22` Ninja Amata Market
- `23` Pinthong Industrial Area 1
- `24` Pinthong Industrial Area 2
- `25` Global Tech Factory Zone 1
- `26` Global Tech Factory Zone 2
- `27` Amata City Chonburi 1
- `28` Amata City Chonburi 2
- `29` Amata City Chonburi 3
- `30` Local Power Broker

#### Right side: Pattaya

- `31` Lan Pho Naklua Market
- `32` Pattaya Floating Market
- `33` Tiffany Show
- `34` Jomtien Beach
- `35` Sanctuary of Truth
- `36` Nong Nooch Garden
- `37` Columbia Pictures Aquaverse
- `38` Koh Larn
- `39` Walking Street Pattaya

### Current behavior

- Human player presses `Roll Dice`.
- Human player moves quickly based on two random dice.
- If the human lands on a normal tile, 3 action cards appear.
- The player must select a card or press `ไม่เล่นการ์ด`.
- After the card choice is resolved, AI 1 and AI 2 take their turns automatically.
- AI movement does not show card choices yet.
- Special tiles are placeholders only; their special effects are not implemented yet.

### Verified today

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed.
- Latest changes were pushed to GitHub.

### Known notes

- Browser screenshot automation may still fail in this environment, but the in-app browser can open the local Vite app.
- Some Git commands may print `error: daemon terminated`; this has not blocked commits or pushes so far.
- `.git/config` may show permission warnings in this environment, so commits use temporary `-c user.name` / `-c user.email` when needed.

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
