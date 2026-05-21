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

## Next

- [ ] Define tile data structure.
- [ ] Decide the final 4 Chonburi board zones.
- [ ] Draft 40 tile names.
- [ ] Mark which tiles are normal properties and which are special tiles.
- [ ] Decide tile categories, such as:
  - market,
  - beach,
  - city,
  - industrial,
  - tourism,
  - port,
  - special.
- [ ] Add tile display names to the UI.
- [ ] Add basic tile detail panel when a player lands on a tile.
- [ ] Add player money system.
- [ ] Decide starting money amount.
- [ ] Add tile value and purchase price.
- [ ] Add small-business investment system for tiles.
- [ ] Define income per round from small-business investments.
- [ ] Add ownership system for land.
- [ ] Add rent system.
- [ ] Decide how land owners interact with small businesses on their land.
- [ ] Add simple AI economic decisions.

## Design Questions

- [ ] Should tile prices use large numbers, such as tens of thousands, millions, and tens of millions?
- [ ] Should income from small businesses be paid at the start of each player's turn?
- [ ] Should players be allowed to invest on unowned land only, or also on owned land with a fee?
- [ ] If a player buys land that already has another player's business, can the owner remove it, tax it, or buy it out?
- [ ] Which Chonburi locations should be included in the first 40-tile draft?

