# Monopoly Chonburi Game - Handoff Notes

Last updated: 2026-06-08
Latest synced GitHub commit: `9986d80 feat: symmetrical board layout, centered tokens, bottom business markers, bilingual board updates, cinematic zoom card redesign, and AI special tile dwells`
Repository: `https://github.com/Jenovic-th/monopoly-chonburi-game`

## How to Continue on Another Computer

Use these commands from the folder where the project should live:

```powershell
git status --short --branch
git fetch origin
git pull origin main
npm.cmd install
npm.cmd run dev
```

Open the local URL Vite prints, normally:

```text
http://localhost:5173/
```

Before making changes, read these files:

- `AGENTS.md` - mandatory AI/project workflow, cross-machine Git rules, and known Windows Git fix.
- `HANDOFF.md` - current project map and next work.
- `DEVLOG.md` - chronological work log.
- `TODO.md` - done list, next tasks, design questions.
- `src/App.tsx` - main game state and gameplay flow.
- `src/boardData.ts` - board tile names, categories, and land prices.
- `src/businessData.ts` - business cards and income data.
- `src/App.css` - board, UI, modal, and responsive styles.

## Cross-Machine AI Memory

The user works on this project from more than one machine. Future AI assistants must treat these repository files as the shared memory between machines:

- `AGENTS.md`
- `HANDOFF.md`
- `DEVLOG.md`
- `TODO.md`

Before doing any coding or Git operation, read `AGENTS.md` and follow its rules. This prevents the office machine and home machine from acting like separate disconnected sessions.

Important rule: GitHub is the source of truth at the start of each session. Always check/fetch/pull before editing unless the user explicitly asks to inspect local uncommitted work first.

## Current Game Concept

This is a single-player computer board game inspired by Monopoly / Thai economic board games.
The setting is Chonburi province.

Current demo structure:

- 1 human player.
- 2 AI players.
- 40 board tiles.
- 2 dice.
- Fast movement with optional skip/fast-forward behavior.
- Board starts at tile `00` in the bottom-right corner and moves clockwise, first moving left along the bottom edge.
- Normal tiles can offer business cards.
- Special tiles use dedicated systems.

## Board Zones and Special Tiles

Special tiles:

- `00` Investment Bank.
- `05` Political Event.
- `10` Burapha University.
- `20` Chonburi Prison.
- `30` Local Power Broker.

Normal tiles are grouped into four Chonburi zones:

- Zone 1: Bangsaen + Nong Mon.
- Zone 2: Sriracha + Laem Chabang.
- Zone 3: Amata City + Phan Thong.
- Zone 4: Pattaya.

Board data lives in:

- `src/boardData.ts`

## Main Systems Already Implemented

### Movement

- Human rolls two dice.
- AI rolls automatically.
- Movement is intentionally fast.
- Human can fast-forward AI delay and skip movement animation.

### Business Cards

- Normal tiles offer three business cards.
- Buying deducts cash.
- Businesses have levels 1-3.
- Returning to the same owned business upgrades it instead of creating a duplicate.
- Each tile/card stall has only one owner.
- Other players cannot buy a stall slot already owned by someone else.
- Business markers on board group by owner to avoid clutter.

Data lives in:

- `src/businessData.ts`

### Income

- Passing or landing on tile `00` pays base income.
- Business income is also paid at tile `00`.
- Business level affects income.
- Education bonus affects human business income:
  - bachelor completed: +15%.
  - master completed: +30%.
- Tenant businesses pay Open Lease share to land owners during tile `00` income collection.

Important constants in `src/App.tsx`:

- `startingCash = 100000`
- `passStartIncome = 20000`
- `openLeaseShareRate = 0.1`

### Land Ownership

- Normal tiles can be bought if they have `landPrice`.
- Special tiles cannot be bought.
- Land owner badge appears on the board.
- Landing rent is paid when another player lands on owned land.
- Rent is currently `3%` of land price.
- If the visitor cannot afford full rent, they pay all remaining cash.
- Open Lease income share is separate from landing rent.

Important constants in `src/App.tsx`:

- `landRentRate = 0.03`

### Investment Bank - Tile `00`

When a player lands exactly on `00`, Investment Bank unlocks remote investing:

- Visit 1: choose from tiles `01-09`, excluding special tiles.
- Visit 2: choose from tiles `01-19`, excluding special tiles.
- Visit 3: choose from tiles `01-29`, excluding special tiles.
- Visit 4+: choose from tiles `01-39`, excluding special tiles.

The human sees a draggable Investment Bank modal so they can move it away from the board.
AI uses this system automatically.

### Burapha University - Tile `10`

Human education flow:

- First landing can start bachelor study.
- Bachelor costs `250,000`.
- Studying skips turns.
- After bachelor is completed, landing on tile `10` again can start master degree.
- Master costs `750,000`.
- Master also skips turns.
- After master is completed, the tile shows an alumni fee placeholder.

Current skip turns:

- `studySkipTurns = 5`

Earlier discussion mentioned shorter study turns, but current code uses 5. If this feels too slow, reduce `studySkipTurns` in `src/App.tsx`.

### Political Event - Tile `05`

Political Event draws one reusable event card.
Current events include:

- COVID-19: next business income collection pays 20%.
- Weak Baht: industrial/port business income pays 140% on next collection.
- Tourism Boom: tourism/market business income pays 150% on next collection.
- Thai Chuai Thai Stimulus: everyone receives `30,000`.
- Underground Lottery: claims Prison Jackpot.

### Chonburi Prison - Tile `20`

Current behavior:

- Landing on tile `20` does not automatically imprison the player.
- It gives a Prison Contact Coupon.
- Coupon gives 5% off next influence card purchase.
- Prison turns and jackpot contribution already exist for jail-risk effects.

### Local Power Broker - Tile `30`

Human can buy influence cards.
Current influence effects:

- Influence Eviction:
  - remove one rival business anywhere on the board,
  - evicted owner recovers 50% paid investment.
- Lease Pressure:
  - next Open Lease collection by that player is 20% instead of 10%.
- Port Connection:
  - next industrial/port income collection is 140%.

Influence card use has a jail risk:

- `influenceJailRiskRate = 0.2`
- jail risk sends player to tile `20`
- prison skip turns from influence risk: `influenceJailTurns = 2`

AI does not buy or use influence cards yet.

### AI

AI currently:

- rolls and moves automatically,
- buys or upgrades business cards on normal tiles,
- uses Investment Bank tile `00`,
- buys land only after it has stable business cashflow,
- keeps cash reserve before spending,
- skips influence cards and education for now.

Important AI constants in `src/App.tsx`:

- `aiMinimumCashReserve = passStartIncome * 2`
- `aiLandCashReserveMultiplier = 5`
- `aiLandMinimumBusinessIncome = 90000`
- `aiLandMinimumCashMultiple = 1.45`

AI land buyout was intentionally delayed because land is too expensive early-game.
The intended economic logic is:

1. build cashflow through businesses,
2. upgrade businesses,
3. buy land later after income is stable.

### AI Board Focus

AI actions now flash/highlight the relevant tile instead of showing annoying popups.
This covers:

- tile AI is rolling from,
- tile AI stops on,
- tile AI buys/upgrades business on,
- Investment Bank target tile,
- land purchase tile.

Current highlight duration:

- `aiFocusMs = 700`

If the effect feels too slow or too fast, tune `aiFocusMs` in `src/App.tsx`.

### Language Selection

Before the game starts, player chooses:

- Thai
- English

The language stays fixed during the game.
Only core UI labels are translated for now.
Dynamic messages, card text, tile names, and long modal text are still mostly English / mixed.

Do not add mid-game language switching yet. It was intentionally avoided to reduce state risk.

### Turn Log

Important actions are stored in Turn Log.
This is preferred over floating result popups.

Do not bring back floating result notices unless the user specifically asks.
The user tested it and found it visually annoying.

## Current Win Condition

Demo 1 winner check:

- Target net worth: `10,000,000`.
- Net worth includes:
  - cash,
  - paid business value,
  - paid land value,
  - paid influence card value.

Winner popup allows:

- continue testing balance,
- reset game.

## UI Notes

Current UI direction:

- board should stay prominent,
- avoid persistent clutter,
- avoid extra popups during AI turns,
- use Turn Log for optional detail,
- use board highlights for attention,
- player ledger can be hidden with Hide Info / Show Info.

Known concern:

- center board console may still need a dedicated layout pass before adding images.
- future tile images should probably live on tiles/card popups, not inside the center console.

## Important User Preferences

- Game should feel fast.
- AI movement and decisions can slow slightly only if it helps readability.
- Do not make the game feel like heavy strategy UI.
- Avoid annoying floating popups.
- Put optional details in Turn Log.
- Large numbers are preferred over small Monopoly-like amounts.
- Buying land should be late-game, after business cashflow is established.
- AI should not buy land too early.
- Business stall slots should be exclusive: one slot, one owner.
- If a player owns land, Open Lease income share is okay.
- Full land trading / auction / negotiation should wait until later.

## Suggested Next Development Steps

Recommended order:

1. Tune AI highlight duration and readability after playtesting.
2. Redesign center board console as a fixed compact panel that cannot overflow.
3. Add full translation map for dynamic gameplay text:
   - status messages,
   - turn log messages,
   - card titles/descriptions,
   - tile names/descriptions,
   - modal detail copy.
4. Balance AI economic behavior:
   - business reserve,
   - land purchase threshold,
   - upgrade aggressiveness.
5. Add clearer land/tenant policy screen:
   - owner,
   - tenant businesses,
   - landing rent,
   - Open Lease share.
6. Decide actual effects for the 3 normal business card choices if they should become more than buy/upgrade.
7. Later, add land trading/auction/buyout systems.

## Validation Commands

Run before pushing:

```powershell
npm.cmd run check:encoding
npm.cmd run lint
npm.cmd run build
```

If Vite dev server is needed:

```powershell
npm.cmd run dev
```

## Git / Windows Warning

This office machine has repeatedly had `.git/index` permission problems.
Symptoms:

- `git add` fails with `fatal: Unable to write new index file`.
- local `git log -1` may be stale even though GitHub has newer commits.
- `git pull` may update working-tree files but fail before writing the index.

Permanent-preferred fix:

- Use a clean clone in a normal user-owned folder such as `C:\Dev\monopoly-chonburi-game`.
- Do not copy the project folder including `.git` between machines.
- Do not keep the repository inside OneDrive, Google Drive, Dropbox, or another synced folder.
- Do not alternate Git operations between Administrator, normal Windows user, and sandbox users in the same clone.

Normal start commands on any machine:

```powershell
git status --short --branch
git fetch origin
git pull origin main
npm.cmd install
npm.cmd run dev
```

If local changes exist before pulling, preserve them first:

```powershell
git stash push -u -m "work before pull"
git pull --ff-only origin main
```

If this existing office clone hits `.git/index` errors again, stop and preserve work. Prefer a clean clone or repair `.git` ownership instead of repeatedly retrying the same failing Git command.

## Latest Known Verification

Before this handoff, the project passed:

```text
npm.cmd run check:encoding
npm.cmd run lint
npm.cmd run build
```

Dev server responded at:

```text
http://127.0.0.1:5173/
```
