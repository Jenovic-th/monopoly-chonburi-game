# Monopoly Chonburi (บอร์ดเกมเศรษฐีชลบุรี)

A modern, fast-paced Monopoly-style strategy board game built with **React**, **TypeScript**, and **Vite**, featuring a localized 40-tile Chonburi / Sriracha / Pattaya theme, dynamic economy loops, land policies, and influence cards.

---

## 🎲 Game Overview

**Monopoly Chonburi** puts players in control of local commerce, land development, and strategic influence across 4 Chonburi economic zones:

1. **Bangsaen + Nong Mon** (Tiles `00-10`): Tourism, seafood markets, view points, and Burapha University.
2. **Sriracha + Laem Chabang** (Tiles `11-20`): Ports, industrial estates, parks, and Chonburi Prison.
3. **Amata City + Phan Thong** (Tiles `21-30`): Major industrial zones, tech factories, and Local Power Broker.
4. **Pattaya** (Tiles `31-39`): Entertainment, nightlife, theme parks, and prime real estate.

---

## 🏆 Victory Condition (Demo 1)

The first player to reach a **Net Worth of ฿10,000,000** wins!

Net Worth calculation includes:
- 💵 Current Cash
- 🏪 Invested Business Value
- 🏞 Land Ownership Value
- 🃏 Influence Card Value

---

## ⚙️ Key Game Systems

### 1. Business Investments & Upgrades (Level 1-3)
- Players land on normal tiles to purchase **Small**, **Medium**, or **Large** business cards.
- Returning to an owned tile allows upgrading businesses up to **Level 3** (Income multipliers: `x1.0`, `x1.8`, `x2.5`).

### 2. Land Ownership & Open Lease Policy
- Players can purchase land titles on normal tiles.
- **Land Rent**: Landing on rival land incurs a 3% land rent fee.
- **Land Policy**:
  - `Open Lease` (Default): Other players can build tenant businesses, paying a 10% lease share during start-of-lap payouts.
  - `Owner Only`: Blocks rival players from building new businesses on that tile.

### 3. Special Tiles
- **`00` Investment Bank**: Allows retrospective investments in previously unlocked tile ranges (`01-09`, `01-19`, `01-29`, `01-39`).
- **`05` Political Event**: Triggers board-wide events (COVID-19, Tourism Boom, Weak Baht, Thai Stimulus, Underground Lottery).
- **`10` Burapha University**: Study for Bachelor's (+15% income bonus) or Master's (+30% income bonus).
- **`20` Chonburi Prison**: Grants a 5% Prison Contact discount coupon for influence card purchases.
- **`30` Local Power Broker**: Underground deals for special Influence Cards (with a 20% police raid jail risk).

### 4. Influence Cards
- **Influence Eviction** (฿450,000): Remove a rival business with 50% cost refund.
- **Lease Pressure** (฿350,000): Increases next Open Lease tenant share to 20%.
- **Port Connection** (฿400,000): Grants +40% income for industrial & port businesses next lap.
- **Tax Relief** (฿300,000): Rent immunity on rival lands for the next 3 landings.
- **Zoning Permit** (฿500,000): Instantly upgrade 1 of your businesses by +1 level for free.

---

## 🛠 Local Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm`

### Installation

```bash
# Clone the repository
git clone https://github.com/Jenovic-th/monopoly-chonburi-game.git

# Navigate into project folder
cd monopoly-sriracha

# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Verification Scripts

```bash
# Run ESLint check
npm run lint

# Run TypeScript & Vite build
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
