# TODO

## Done

- [x] Create Vite + React + TypeScript project.
- [x] Install dependencies.
- [x] Create 40-tile board layout.
- [x] Place start tile at bottom-right as tile `00`.
- [x] Implement classic clockwise board path.
- [x] Add 1 player and 2 AI characters.
- [x] Use simple geometric tokens for characters.
- [x] Add two random dice.
- [x] Move pieces based on dice total.
- [x] Make movement fast.
- [x] Allow player to skip movement animation.
- [x] Let AI turns run automatically.
- [x] Add fast-forward behavior during AI delay.
- [x] Add reset behavior.
- [x] Run build verification.
- [x] Run lint verification.
- [x] Push initial project to GitHub.
- [x] Define tile data structure in `src/boardData.ts`.
- [x] Decide the final 4 Chonburi board zones.
- [x] Draft all 40 tile names.
- [x] Mark special tiles:
  - `00` Investment Bank
  - `05` Political Event
  - `10` Burapha University
  - `20` Chonburi Prison
  - `30` Local Power Broker
- [x] Add tile categories.
- [x] Add tile display names to the board UI.
- [x] Add current tile detail panel.
- [x] Add first-pass action card choice UI.
- [x] Add `ไม่เล่นการ์ด` skip option.
- [x] Make AI skip action-card UI for now.
- [x] Fix card display detection after movement.
- [x] Improve player token visibility and grouping.
- [x] Add Burapha University special card flow.
- [x] Add 2-turn study skip for Burapha University.
- [x] Require landing on Burapha University again before master degree option appears.
- [x] Add placeholder alumni fee card after master degree is completed.
- [x] Add Investment Bank visit tracking per character.
- [x] Add Investment Bank unlock ranges:
  - visit 1: normal tiles `01-09`
  - visit 2: normal tiles `01-19`
  - visit 3: normal tiles `01-29`
  - visit 4+: normal tiles `01-39`
- [x] Exclude special tiles from Investment Bank investment choices.
- [x] Add placeholder investment target selection UI.
- [x] Add placeholder 3-plan investment cards after choosing an investment target.
- [x] Keep AI Investment Bank behavior as status-only for now.

## Next

- [ ] Add player money/cash state.
- [ ] Decide starting cash amount.
- [ ] Deduct placeholder investment costs from player cash.
- [ ] Store selected investments per player and per tile.
- [ ] Decide when investment income is paid.
- [ ] Pay investment income from stored investments.
- [ ] Decide whether investment cards should vary by tile category or zone.
- [ ] Decide if multiple players can invest on the same tile.
- [ ] Decide what happens if a land owner buys a tile that already has investments.
- [ ] Decide what the 3 action cards should actually do.
- [ ] Decide whether card choices should depend on tile category.
- [ ] Decide whether AI should choose cards automatically.
- [ ] Add real card result display after selecting a card.
- [ ] Add tile value and purchase price.
- [ ] Add ownership system for land.
- [ ] Add rent system.
- [ ] Decide how land owners interact with small businesses on their land.
- [ ] Add behavior for special tiles:
  - Political Event
  - Chonburi Prison
  - Local Power Broker
- [ ] Add simple AI economic decisions.
- [ ] Update README with setup, dev, and project overview.

## Design Questions

- [ ] Should tile prices use large numbers, such as tens of thousands, millions, and tens of millions?
- [ ] Should income from small businesses be paid at the start of each player's turn?
- [ ] Should players be allowed to invest on unowned land only, or also on owned land with a fee?
- [ ] If a player buys land that already has another player's business, can the owner remove it, tax it, or buy it out?
- [ ] Should each normal tile always offer the same 3 cards, or should the cards vary by zone/category?
- [ ] Should Investment Bank investment cards use the same 3 plan cards everywhere, or vary by location?
- [ ] Should AI players use Investment Bank choices automatically later?
- [ ] Should special tiles use cards too, or have their own dedicated UI?
- [ ] What should happen when a player lands on Political Event?
- [ ] What should happen when a player lands on Chonburi Prison?
- [ ] What should happen when a player lands on Local Power Broker?

## Handoff Notes

- Current active branch: `main`.
- Latest pushed commit:
  - Check with `git log -1 --oneline` after pulling.
- If continuing on another computer:
  - `git pull origin main`
  - `npm.cmd install`
  - `npm.cmd run dev`
- Start by reading:
  - `DEVLOG.md`
  - `TODO.md`
  - `src/boardData.ts`
  - `src/App.tsx`
  - `src/App.css`
