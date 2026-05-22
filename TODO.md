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

## Next

- [ ] Decide what the 3 action cards should actually do.
- [ ] Decide whether card choices should depend on tile category.
- [ ] Decide whether AI should choose cards automatically.
- [ ] Add real card result display after selecting a card.
- [ ] Add player money system.
- [ ] Decide starting money amount.
- [ ] Add tile value and purchase price.
- [ ] Add small-business investment system for tiles.
- [ ] Define income per round from small-business investments.
- [ ] Add ownership system for land.
- [ ] Add rent system.
- [ ] Decide how land owners interact with small businesses on their land.
- [ ] Add behavior for special tiles:
  - Investment Bank
  - Political Event
  - Burapha University
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
- [ ] Should special tiles use cards too, or have their own dedicated UI?
- [ ] What should happen when a player lands on Political Event?
- [ ] What should happen when a player lands on Chonburi Prison?
- [ ] What should happen when a player lands on Local Power Broker?

## Handoff Notes

- Current active branch: `main`.
- Latest pushed commit at the time of this note:
  - `f06c2e5 Add Chonburi board tiles and card choice UI`
- If continuing on another computer:
  - `git pull origin main`
  - `npm.cmd install`
  - `npm.cmd run dev`
- Start by reading:
  - `DEVLOG.md`
  - `TODO.md`
  - `src/boardData.ts`
