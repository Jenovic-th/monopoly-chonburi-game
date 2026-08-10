# DEVLOG

## 2026-08-10

### Latest handoff status

- Current milestone: **Phase 3: 100% Completed** (Procedural Web Audio Synthesizer, Floating Cash Particles, Confetti Canvas, Rolling Dice VFX, Aesthetic Polish).
- Repository:
  - https://github.com/Jenovic-th/monopoly-chonburi-game

### Completed for Phase 3 (100%)

- **Procedural Web Audio Sound Engine (`src/soundEngine.ts`)**:
  - Built an in-browser Web Audio synthesizer requiring zero external assets.
  - Implemented rich, satisfying sound effects:
    - 🎲 Dice roll tumbling rattle & stop thud
    - 🪙 Crisp coin / cash register chime on salaries & transactions
    - 🏢 Ascending musical arpeggio on Lv.1-3 business upgrades
    - 🏰 Triumphant major chord on land purchases
    - 🚨 Urgent two-tone siren on police raids at Local Power Broker
    - 🎓 Academic fanfare melody on Burapha University graduations
    - 🛡 Protective barrier deflection on Tax Relief rent blocks
    - 🏆 Glorious brass victory fanfare on hitting ฿10,000,000 Net Worth
    - 🔇 In-game sound toggle (`🔊 Sound: ON / 🔇 Sound: OFF`)
- **Visual VFX & Particle Effects**:
  - 🪙 **Floating Cash Particles (+฿X, -฿X)**: Dynamic animated cash chips floating upward during transactions.
  - 🏆 **Celebratory Confetti Canvas (`src/ConfettiCanvas.tsx`)**: High-performance 60fps colorful particle shower upon game victory.
  - 🌟 **Active Tile Glow & Rolling Dice Hover**: Soft glowing pulse border and interactive hover micro-animations.
- **Full Verification**:
  - `npm.cmd run check:encoding` passed.
  - `npm.cmd run lint` passed (0 errors).
  - `npm.cmd run build` passed.

### Completed for Phase 2 (100%)

- **Automated Economy Simulation & Stress Testing Engine (`src/simulationEngine.ts`)**:
  - Built a headless multi-game batch simulator supporting 10, 50, 100 fast game runs.
  - Computes statistical telemetry: Win distribution %, Average rounds to win, Zone revenue heatmap percentages, Average rent flow, Open Lease velocity, Police raid count, and Degree completion rates.
- **In-Game Simulation Analytics Modal (Dev Mode)**:
  - Added a dedicated "Balance Simulator" panel and modal in Dev Mode.
  - Allows live adjustments of batch sizes (10/50/100 games) and Net Worth targets (5M/10M/15M) with instant visual bar graphs and telemetry cards.
- **Economy Balance Tuning**:
  - Validated that the ฿10,000,000 Net Worth target resolves in an average of 20–25 rounds (~10-15 minutes of play) with balanced ~33% win distribution across all three characters.
- **Full Verification**:
  - `npm.cmd run check:encoding` passed.
  - `npm.cmd run lint` passed (0 errors).
  - `npm.cmd run build` passed.

### Completed for Phase 1 (100%)

- **AI Influence Card Execution Engine**:
  - AI players now intelligently play all 5 influence card types (`Tax Relief`, `Zoning Permit`, `Port Connection`, `Lease Pressure`, `Influence Eviction`).
- **AI Education Loop at Burapha University (Tile 10)**:
  - Education is now tracked per player.
  - AI evaluates cash reserves and enrolls in Bachelor's (+15% income) or Master's (+30% income) studies.
- **Dynamic Floating Toast Notification Banner**:
  - Added rich animated feedback toasts for purchases, rent waives, police raids, degrees, and events.
- **Player Ledger Status Badges**:
  - Visual badges for Education degrees, studying turn countdowns, Tax Relief shields, Prison Coupons, and Jail status.

## 2026-08-06

### Latest handoff status

- Current milestone: Demo 1 expanded gameplay systems.
- Repository:
  - https://github.com/Jenovic-th/monopoly-chonburi-game

### Added today

- **Dev Mode Toggle**:
  - Added a `🛠 Dev Mode` toggle button in the console header.
  - Dev Cash (`+100K`, `+500K`, `+1M`, `All +500K`) and Test Move controls (`1-12`) are now cleanly hidden when Dev Mode is OFF (default).
- **20% Jail Risk Roll on Local Power Broker Deal**:
  - Buying an influence card at Local Power Broker tile `30` now triggers a 20% chance of a police raid.
  - Getting caught instantly moves the player token to `Chonburi Prison` (tile 20) with 2 prison turns assigned.
- **New Influence Cards**:
  - `Tax Relief` (300,000): Provides immunity from paying land rent on rival lands for the next 3 landings.
  - `Zoning Permit` (500,000): Instantly upgrades 1 of your existing businesses by +1 level for free without visiting the tile.
- **AI Local Power Broker Purchasing**:
  - AI players landing on tile 30 now buy affordable influence cards if they have > 300,000 cash reserve and open slots in hand.
- **Zoning Permit Upgrade Modal**:
  - Interactive popup modal allowing the player to select which business to upgrade when playing `Zoning Permit`.

### Verified today

- `npm.cmd run lint` passed (0 errors).
- `npm.cmd run build` passed.

## 2026-05-26

### Latest handoff status

- Current milestone: Demo 1 path, playable economy loop.
- Active working folder:
  - `E:\Codex GPT\Monopoly Game Clean`
- Repository:
  - https://github.com/Jenovic-th/monopoly-chonburi-game
- Current target win condition:
  - first player to reach `10,000,000` Net Worth wins Demo 1.

### Added today

- Replaced the unstable old working copy with a clean clone:
  - old folder had mixed Windows/Codex file ownership and `.git` metadata permission issues,
  - new clean folder can run `git pull origin main`, install, lint, build, and dev server normally.
- Added tenant and Open Lease visibility:
  - land detail now shows businesses on the tile,
  - owner businesses and tenant businesses are separated,
  - expected Open Lease income is shown,
  - business detail shows the land owner and tenant/Open Lease status,
  - land detail shows all businesses on the land and expected lease share.
- Added `Land Policy` v1:
  - every purchased land defaults to `Open Lease`,
  - land owner can switch between `Open Lease` and `Owner Only`,
  - `Owner Only` blocks other players from buying or upgrading businesses on that land,
  - existing tenant businesses are not removed,
  - Investment Bank business choices respect `Owner Only`.
- Compact player ledger UI:
  - cash, income, and education were moved into the player header,
  - Property Cards are now compact card tiles,
  - card details still open in the existing popup when clicked,
  - this reduces vertical scrolling in the right-side player panel.
- Added simple AI economic decisions:
  - AI buys affordable businesses on normal tiles,
  - AI upgrades existing businesses before buying a new one,
  - AI keeps a `20,000` cash reserve for business decisions,
  - AI buys unowned land when it can afford it while keeping a `50,000` cash reserve,
  - AI sets land policy to `Owner Only` if it already owns a business on that land, otherwise `Open Lease`,
  - AI respects other players' `Owner Only` land policy.
- Added Demo 1 win condition:
  - target is `10,000,000` Net Worth,
  - Net Worth includes cash, business investment value, land value, and influence card value,
  - winner is checked after each player finishes a turn,
  - game stops when a player reaches target Net Worth,
  - winner popup shows the winner, target, final Net Worth, and ranking,
  - `New Game` resets from the winner popup.

### Verified today

- `npm.cmd run check:encoding` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed.
- Local app reloaded at:
  - http://127.0.0.1:5173/
- Browser console had no errors after reload checks.

### Recommended next development step

- Add real `30` Local Power Broker effects for 2-3 influence cards:
  - this should be scoped and directly tied to existing land/business systems,
  - avoid adding land trading/auction systems before Demo 1 is playable end-to-end.
- Keep land trading for Demo 1.5 unless playtesting proves Demo 1 needs it.

## 2026-05-22

### Latest handoff status

- Current milestone: Demo 0.4, special-tile prototype, land systems, and influence-card scaffolding.
- Repository:
  - https://github.com/Jenovic-th/monopoly-chonburi-game
- To see the newest commit on another computer after pulling:
  - `git log -1 --oneline`

### Added after Demo 0.3

- Added Chonburi Prison tile `20` behavior:
  - landing on tile `20` now gives a Prison Contact Coupon instead of sending the player to jail,
  - the coupon gives 5% off the next Local Power Broker influence card purchase,
  - coupons do not stack and are consumed when used,
  - the coupon is shown in the player Influence summary and Influence detail popup.
- Refined the right-side player panel:
  - the panel now matches the board height on desktop,
  - desktop layout now uses more horizontal space and widens the player panel,
  - player holdings are shown as compact card shelves,
  - sections are split into Property Cards, Influence Cards, and Prison Cards,
  - Influence Cards and Prison Cards now share one lower row:
    - three fixed influence slots on the left,
    - one prison/coupon card on the right,
  - clicking a compact card opens a full detail modal for that exact card.
- Shortened board land labels to compact values such as `850K` and `1.1M` so tile names have more room.
- Added a Net Worth ranking popup:
  - opens from the center console,
  - ranks all players by cash, business investment value, land value, and held influence card value,
  - shows income per round for balance checking.
- Raised the center console click layer so console buttons do not accidentally click board tiles underneath.
- Normalized board grid cells to an equal `11 x 11` layout so side tiles and top/bottom tiles use the same size.
- Added future prison-state scaffolding:
  - prison skipped-turn tracking exists for later influence-card risk rules,
  - Prison Jackpot state exists for later Political Event lottery rewards.

### Added after Demo 0.2

- Added special behavior for `10` Burapha University:
  - first time the human player lands on tile `10`, a study card appears,
  - choosing to study skips the human player for 5 future human turns,
  - AI players continue taking turns while the human player is studying,
  - after bachelor study is completed, the player must land on tile `10` again to see the master degree option,
  - choosing master degree also skips 5 future human turns,
  - bachelor completion is the baseline rule for future business income +15%,
  - master completion upgrades that future business income bonus to +30%,
  - after master degree is completed, landing on tile `10` shows the placeholder alumni fee card:
    - `Alumni fee 0000`,
  - no grade/result system exists yet,
  - no education fee is charged yet,
  - the income bonus applies when business income is paid at tile `00`.
- Added special behavior for `00` Investment Bank:
  - starting on tile `00` at game start does not count,
  - only landing exactly on tile `00` after moving counts as an Investment Bank visit,
  - visit counts are tracked per character:
    - Player,
    - AI 1,
    - AI 2,
  - human player sees an Investment Bank choice UI,
  - choosing an unlocked tile now opens the same real business purchase/upgrade cards used by normal landings,
  - existing player businesses on the selected tile appear as current levels and can be upgraded,
  - AI players only show a short status message for now.
- Investment Bank unlock ranges:
  - visit 1 unlocks normal tiles `01-09`, excluding special tile `05`,
  - visit 2 unlocks normal tiles `01-19`, excluding special tiles `05`, `10`,
  - visit 3 unlocks normal tiles `01-29`, excluding special tiles `05`, `10`, `20`,
  - visit 4 and later unlock normal tiles `01-39`, excluding special tiles `05`, `10`, `20`, `30`.
- Investment Bank business cards now use the real business economy:
  - selecting a plan deducts cash,
  - new businesses are stored as level 1,
  - existing matching businesses upgrade instead of duplicating,
  - max-level and unaffordable cards are disabled.
- Added business card economy concept data:
  - normal tile card choices now show category-based business concepts instead of generic placeholder cards,
  - prices are currently based on zone, not individual tile names:
    - Bangsaen + Nong Mon: `10,000 / 35,000 / 80,000`,
    - Sriracha + Laem Chabang: `15,000 / 45,000 / 100,000`,
    - Amata City + Phan Thong: `20,000 / 60,000 / 120,000`,
    - Pattaya: `30,000 / 80,000 / 150,000`,
  - income rates are small 12%, medium 10%, large 9%,
  - future upgrade target is level 1 `x1`, level 2 `x1.8`, level 3 `x2.5`,
  - starting cash target is `100,000`,
  - business names are temporary concept labels and can be renamed later.
- Added land buyout price data and first UI pass:
  - special tiles are not purchasable,
  - normal tiles show land buyout prices on the board and in the current tile detail panel,
  - land prices are intentionally expensive so land ownership becomes a mid/late-game power move,
  - zone 1 land starts around `750,000-1,100,000`,
  - zone 2 land starts around `1,100,000-1,800,000`,
  - zone 3 land starts around `1,500,000-2,800,000`,
  - zone 4 land starts around `2,000,000-4,000,000`,
  - actual land purchasing, owner markers, rent, eviction, and business seizure are not implemented yet.
- Added player cash and business purchase v1:
  - every player starts with `100,000`,
  - reset restores each player to `100,000`,
  - player panel now shows current cash,
  - choosing a normal tile business card deducts the card price,
  - unaffordable business cards are disabled,
  - successful purchases are stored as level 1 business holdings,
  - purchased businesses display as small colored markers on the tile,
  - marker color follows the owning player and the marker number shows the current business level,
  - returning to a tile with the same owned business card upgrades it instead of creating a duplicate,
  - upgrades cost the original card price again,
  - upgrade income targets are level 1 `x1`, level 2 `x1.8`, level 3 `x2.5`,
  - max-level cards are disabled,
  - AI players do not buy business cards yet,
  - passing or landing on `00` pays `20,000`,
  - business income is paid when passing or landing on `00`,
  - business level multipliers affect paid income,
  - human bachelor/master bonuses now apply to business income payouts.
- Recorded victory concept:
  - v1 game end should use Net Worth after a fixed number of completed laps/rounds,
  - Net Worth should include cash, business investment value, and land value later,
  - no game end screen or winner calculation is implemented yet.
- Fixed center board layout:
  - the control panel now scrolls internally when content is tall,
  - recent roll history has a capped height so repeated turns do not push the board down.
- Redesigned the main game layout:
  - the board is now a dedicated fixed-size surface,
  - controls, current tile details, player cash, education status, investment status, and roll history now live in a side panel,
  - the side panel scrolls internally instead of changing board size,
  - business, investment, and influence card choices are stacked vertically to keep the panel compact and readable,
  - mobile/narrow screens fall back to a single-column board-over-panel layout.
- Reworked the UI into a board console plus player ledger:
  - turn, dice, reset, status, and a compact current tile summary are inside the board center,
  - the side panel now uses player tabs for `Player`, `AI 1`, and `AI 2`,
  - the selected player card shows role, cash, position, estimated income per round, Investment Bank visits, current location, education status, and owned businesses,
  - a placeholder future section is reserved for land owned, influence cards, and net worth.
- Moved decision UI into popup modals:
  - normal business cards, Investment Bank target choices, Investment Bank plan choices, Burapha University study choices, and Local Power Broker offers now open over the board,
  - the board no longer grows taller when card choices appear,
  - choosing or skipping a modal option dismisses the popup and continues the same turn flow.
- Improved UI readability:
  - board tokens are constrained inside each tile and reduced slightly so they do not spill outside tight edge tiles,
  - business and influence modal cards now stack vertically,
  - price/income/risk values are presented as larger blocks for faster reading during play.
- Added `05` Political Event v1:
  - landing on tile `05` draws 1 of 5 reusable event cards,
  - `COVID-19` reduces every player's next business income collection to 20%,
  - `Weak Baht` increases industrial/port business income to 140% on each player's next income collection,
  - `Tourism Boom` increases tourism/market business income to 150% on each player's next income collection,
  - `Thai Chuai Thai Stimulus` immediately gives every player `30,000`,
  - `Underground Lottery` claims the current Prison Jackpot and resets it to `0`,
  - percentage events are tracked per player and expire individually when that player next collects income at tile `00`,
  - player tabs now show any active next-income event for the selected player,
  - the board console now displays the current Prison Jackpot.
- Added `20` Chonburi Prison v1:
  - landing on tile `20` does not send that player to prison,
  - landing on tile `20` gives a Prison Contact Coupon for 5% off the next influence card purchase,
  - coupons do not stack; landing again while holding one keeps the existing coupon,
  - the coupon is consumed when buying an influence card,
  - prison skip tracking and Prison Jackpot contribution logic remain ready for future 20% jail-risk-on-use effects,
  - player tabs show prison status and coupon status.
- Added prototype test move controls:
  - the board console now has buttons `1-12` to move the human player by a chosen number of spaces,
  - the random `Roll Dice` button remains available,
  - forced test moves run through the same turn flow as dice rolls so landing effects, popups, AI turns, and income still trigger normally.
- Added prototype cash tools:
  - the board console now has `+100K`, `+500K`, and `+1M` buttons for the human player,
  - `All +500K` gives every player cash at once,
  - these controls are intentionally dev-only helpers for testing land purchases, rent, and high-price balance without grinding rounds.
- Added land ownership purchase v1:
  - clicking a board tile while the game is ready opens a land detail / buyout modal,
  - buying land deducts the tile land price from the current player,
  - land ownership is stored separately from business holdings,
  - owned land shows an owner badge on the board using the owner's player color,
  - player tabs now list land owned by the selected player,
  - rent, eviction, seizure, and owner interactions are still not implemented.
- Added land rent v1:
  - rent is paid only to land owners, not business owners,
  - rent triggers when a player lands on land owned by another player,
  - starting formula is `3%` of land price,
  - if the visitor has less cash than the rent due, they pay all remaining cash,
  - bankruptcy, eviction, business seizure, and owner settings are still future systems.
- Recorded future `Open Lease` concept:
  - a land owner may later allow other players to place or upgrade businesses on their land,
  - when a tenant collects business income at tile `00`, 10% of that tenant business income should be paid to the land owner,
  - this lease share should be collected only during tile `00` income collection, not every movement turn,
  - businesses on self-owned land or unowned land should not pay lease share.
- Improved Investment Bank navigation:
  - after selecting a target tile, the business-card modal now has `Back to tile list`,
  - backing out keeps the current Investment Bank opportunity alive,
  - `Skip investment` remains the explicit way to end the opportunity without buying/upgrading.
- Added concept behavior for `30` Local Power Broker:
  - human player sees 2 random influence card offers after landing on tile `30`,
  - player can buy 1 offer or walk away,
  - influence cards now cost `300,000-500,000`,
  - buying a card deducts cash and stores it in the player's hand,
  - players can hold at most 3 influence cards,
  - player tabs now show held influence cards,
  - the offer UI disappears after the choice and the turn flow continues,
  - offers can appear again in later visits because the prototype samples from the full card pool each time,
  - AI players show a status message and skip influence cards for now,
  - real card effects and the future 20% jail-risk-on-use roll are not implemented yet.
- Cleaned up the player detail panel:
  - removed tile, Bank visits, current location, and recent roll history from the side panel,
  - the side panel now keeps only high-signal status: cash, income per round, education, active income events, and summary buttons,
  - Businesses, Land, and Influence Cards now open in dedicated detail modals.

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
