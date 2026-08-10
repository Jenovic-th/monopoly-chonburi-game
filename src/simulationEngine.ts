import { boardTiles } from './boardData'
import { getBusinessCardsForTile, businessLevelMultipliers } from './businessData'

export type SimGameResult = {
  gameIndex: number
  winnerIndex: number
  totalRounds: number
  totalTurns: number
  finalNetWorths: number[]
  finalCash: number[]
  finalBusinessesCount: number[]
  finalLandsCount: number[]
  zoneRevenue: Record<string, number>
  totalRentPaid: number
  totalLeaseSharePaid: number
  policeRaidsTriggered: number
  degreesCompleted: number
}

export type SimBatchSummary = {
  totalGames: number
  targetNetWorth: number
  winCounts: [number, number, number]
  winPercentages: [number, number, number]
  avgRoundsToWin: number
  minRoundsToWin: number
  maxRoundsToWin: number
  avgWinnerNetWorth: number
  avgWinnerCash: number
  avgWinnerBusinesses: number
  avgWinnerLands: number
  zoneRevenuePercentages: Record<string, number>
  avgRentPerGame: number
  avgLeaseSharePerGame: number
  avgPoliceRaidsPerGame: number
  avgDegreesPerGame: number
}

type SimPlayer = {
  index: number
  name: string
  cash: number
  position: number
  prisonTurns: number
  hasPrisonCoupon: boolean
  educationStage: 'none' | 'bachelorCompleted' | 'masterCompleted'
  activeStudy: 'none' | 'bachelor' | 'master'
  studySkipTurns: number
  investmentVisits: number
  taxReliefCharges: number
  hasLeasePressure: boolean
  incomeModifier: { multiplier: number; scope: 'all' | 'industrial' | 'tourism' } | null
}

type SimBusiness = {
  id: string
  playerIndex: number
  tileId: number
  cardId: string
  title: string
  tier: 'small' | 'medium' | 'large'
  level: number
  pricePaid: number
  baseIncome: number
}

type SimLand = {
  tileId: number
  playerIndex: number
  policy: 'openLease' | 'ownerOnly'
}

type SimInfluenceHolding = {
  id: string
  playerIndex: number
  cardId: string
  effect: 'eviction' | 'leasePressure' | 'portConnection' | 'taxRelief' | 'zoningPermit'
  pricePaid: number
}

const TILE_COUNT = 40
const STARTING_CASH = 100000
const PASS_START_INCOME = 20000
const LAND_RENT_RATE = 0.03
const OPEN_LEASE_SHARE_RATE = 0.10
const PRISON_COUPON_DISCOUNT = 0.05
const MAX_INFLUENCE_CARDS = 3
const MAX_BUSINESS_LEVEL = 3

const NO_CARD_TILES = new Set([0, 5, 10, 20, 30])
const INDUSTRIAL_CATEGORIES = new Set(['industrial', 'port'])
const TOURISM_CATEGORIES = new Set([
  'market', 'viewpoint', 'beach', 'wildlife', 'island', 'mall',
  'landmark', 'nightlife', 'show', 'themepark',
])

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1
}

function getBusinessIncome(business: SimBusiness): number {
  const multiplier = businessLevelMultipliers[business.level - 1] ?? 1
  return Math.round(business.baseIncome * multiplier)
}

export function runSingleSimulation(targetNetWorth = 10000000, gameIndex = 1): SimGameResult {
  const players: SimPlayer[] = [
    {
      index: 0,
      name: 'Player (Bot Strategy)',
      cash: STARTING_CASH,
      position: 0,
      prisonTurns: 0,
      hasPrisonCoupon: false,
      educationStage: 'none',
      activeStudy: 'none',
      studySkipTurns: 0,
      investmentVisits: 0,
      taxReliefCharges: 0,
      hasLeasePressure: false,
      incomeModifier: null,
    },
    {
      index: 1,
      name: 'AI 1 (Balanced)',
      cash: STARTING_CASH,
      position: 0,
      prisonTurns: 0,
      hasPrisonCoupon: false,
      educationStage: 'none',
      activeStudy: 'none',
      studySkipTurns: 0,
      investmentVisits: 0,
      taxReliefCharges: 0,
      hasLeasePressure: false,
      incomeModifier: null,
    },
    {
      index: 2,
      name: 'AI 2 (Aggressive)',
      cash: STARTING_CASH,
      position: 0,
      prisonTurns: 0,
      hasPrisonCoupon: false,
      educationStage: 'none',
      activeStudy: 'none',
      studySkipTurns: 0,
      investmentVisits: 0,
      taxReliefCharges: 0,
      hasLeasePressure: false,
      incomeModifier: null,
    },
  ]

  const businesses: SimBusiness[] = []
  const lands: SimLand[] = []
  const influenceCards: SimInfluenceHolding[] = []
  let prisonJackpot = 0
  let cardIdCounter = 0

  let totalRentPaid = 0
  let totalLeaseSharePaid = 0
  let policeRaidsTriggered = 0
  let degreesCompleted = 0
  const zoneRevenue: Record<string, number> = {
    'Bangsaen + Nong Mon': 0,
    'Sriracha + Laem Chabang': 0,
    'Amata City + Phan Thong': 0,
    'Pattaya': 0,
  }

  function getPlayerNetWorth(pIndex: number): number {
    const p = players[pIndex]
    const bizVal = businesses
      .filter((b) => b.playerIndex === pIndex)
      .reduce((sum, b) => sum + b.pricePaid, 0)
    const landVal = lands
      .filter((l) => l.playerIndex === pIndex)
      .reduce((sum, l) => sum + (boardTiles[l.tileId].landPrice ?? 0), 0)
    const infVal = influenceCards
      .filter((ic) => ic.playerIndex === pIndex)
      .reduce((sum, ic) => sum + ic.pricePaid, 0)
    return p.cash + bizVal + landVal + infVal
  }

  function executeInfluenceCards(pIndex: number) {
    const p = players[pIndex]
    const held = influenceCards.filter((c) => c.playerIndex === pIndex)
    if (held.length === 0) return

    // Tax Relief
    const taxCard = held.find((c) => c.effect === 'taxRelief')
    if (taxCard && p.cash < 150000 && p.taxReliefCharges === 0) {
      p.taxReliefCharges += 3
      const idx = influenceCards.findIndex((c) => c.id === taxCard.id)
      if (idx !== -1) influenceCards.splice(idx, 1)
      return
    }

    // Zoning Permit
    const zoningCard = held.find((c) => c.effect === 'zoningPermit')
    if (zoningCard) {
      const upgradable = businesses.filter((b) => b.playerIndex === pIndex && b.level < MAX_BUSINESS_LEVEL)
      if (upgradable.length > 0) {
        const best = [...upgradable].sort((a, b) => b.pricePaid - a.pricePaid)[0]
        best.level += 1
        const idx = influenceCards.findIndex((c) => c.id === zoningCard.id)
        if (idx !== -1) influenceCards.splice(idx, 1)
        return
      }
    }

    // Port Connection
    const portCard = held.find((c) => c.effect === 'portConnection')
    if (portCard) {
      const hasIndustrial = businesses.some(
        (b) => b.playerIndex === pIndex && INDUSTRIAL_CATEGORIES.has(boardTiles[b.tileId].category)
      )
      if (hasIndustrial && !p.incomeModifier) {
        p.incomeModifier = { multiplier: 1.4, scope: 'industrial' }
        const idx = influenceCards.findIndex((c) => c.id === portCard.id)
        if (idx !== -1) influenceCards.splice(idx, 1)
        return
      }
    }

    // Lease Pressure
    const leaseCard = held.find((c) => c.effect === 'leasePressure')
    if (leaseCard && !p.hasLeasePressure) {
      const ownedLands = new Set(lands.filter((l) => l.playerIndex === pIndex).map((l) => l.tileId))
      const hasTenants = businesses.some((b) => b.playerIndex !== pIndex && ownedLands.has(b.tileId))
      if (hasTenants) {
        p.hasLeasePressure = true
        const idx = influenceCards.findIndex((c) => c.id === leaseCard.id)
        if (idx !== -1) influenceCards.splice(idx, 1)
        return
      }
    }

    // Eviction
    const evictionCard = held.find((c) => c.effect === 'eviction')
    if (evictionCard) {
      const rivalBiz = businesses.filter((b) => b.playerIndex !== pIndex)
      if (rivalBiz.length > 0) {
        const target = [...rivalBiz].sort((a, b) => b.pricePaid - a.pricePaid)[0]
        players[target.playerIndex].cash += Math.round(target.pricePaid * 0.5)
        const bIdx = businesses.findIndex((b) => b.id === target.id)
        if (bIdx !== -1) businesses.splice(bIdx, 1)
        const cIdx = influenceCards.findIndex((c) => c.id === evictionCard.id)
        if (cIdx !== -1) influenceCards.splice(cIdx, 1)
      }
    }
  }

  let totalRounds = 0
  let totalTurns = 0
  let winnerIndex = -1
  const MAX_ROUNDS = 300

  while (totalRounds < MAX_ROUNDS && winnerIndex === -1) {
    totalRounds += 1

    for (let pIndex = 0; pIndex < players.length; pIndex += 1) {
      totalTurns += 1
      const p = players[pIndex]

      // Prison Skip
      if (p.prisonTurns > 0) {
        p.prisonTurns -= 1
        const pBizIncome = businesses
          .filter((b) => b.playerIndex === pIndex)
          .reduce((sum, b) => sum + getBusinessIncome(b), 0)
        prisonJackpot += Math.max(pBizIncome, 10000)
        continue
      }

      // Study Skip
      if (p.studySkipTurns > 0) {
        p.studySkipTurns -= 1
        if (p.studySkipTurns === 0) {
          if (p.activeStudy === 'bachelor') {
            p.educationStage = 'bachelorCompleted'
            degreesCompleted += 1
          } else if (p.activeStudy === 'master') {
            p.educationStage = 'masterCompleted'
            degreesCompleted += 1
          }
          p.activeStudy = 'none'
        }
        continue
      }

      // Influence Card Plays
      executeInfluenceCards(pIndex)

      // Roll & Move
      const roll1 = rollDie()
      const roll2 = rollDie()
      const steps = roll1 + roll2
      const oldPos = p.position
      const newPos = (oldPos + steps) % TILE_COUNT
      const passedStart = oldPos + steps >= TILE_COUNT
      p.position = newPos

      // Passing Start Income Collection
      if (passedStart || newPos === 0) {
        let bizIncome = 0
        const playerBiz = businesses.filter((b) => b.playerIndex === pIndex)
        for (const b of playerBiz) {
          let income = getBusinessIncome(b)
          const tile = boardTiles[b.tileId]
          if (p.incomeModifier) {
            if (p.incomeModifier.scope === 'all') {
              income = Math.round(income * p.incomeModifier.multiplier)
            } else if (p.incomeModifier.scope === 'industrial' && INDUSTRIAL_CATEGORIES.has(tile.category)) {
              income = Math.round(income * p.incomeModifier.multiplier)
            } else if (p.incomeModifier.scope === 'tourism' && TOURISM_CATEGORIES.has(tile.category)) {
              income = Math.round(income * p.incomeModifier.multiplier)
            }
          }

          // Lease share to land owner
          const landOwner = lands.find((l) => l.tileId === b.tileId)
          if (landOwner && landOwner.playerIndex !== pIndex && landOwner.policy === 'openLease') {
            const shareRate = players[landOwner.playerIndex].hasLeasePressure ? 0.20 : OPEN_LEASE_SHARE_RATE
            const share = Math.round(income * shareRate)
            income -= share
            players[landOwner.playerIndex].cash += share
            totalLeaseSharePaid += share
          }

          bizIncome += income
          zoneRevenue[tile.zone] = (zoneRevenue[tile.zone] ?? 0) + income
        }

        // Education Bonus
        const eduBonusRate =
          p.educationStage === 'masterCompleted'
            ? 0.30
            : p.educationStage === 'bachelorCompleted'
              ? 0.15
              : 0
        const eduBonus = Math.round(bizIncome * eduBonusRate)

        p.cash += PASS_START_INCOME + bizIncome + eduBonus
        p.incomeModifier = null
        p.hasLeasePressure = false
      }

      // Landing Logic
      const currentTile = boardTiles[newPos]

      // Rent payment if landing on rival land
      const landOwner = lands.find((l) => l.tileId === newPos)
      if (landOwner && landOwner.playerIndex !== pIndex && currentTile.landPrice) {
        if (p.taxReliefCharges > 0) {
          p.taxReliefCharges -= 1
        } else {
          const rentDue = Math.round(currentTile.landPrice * LAND_RENT_RATE)
          const rentPaid = Math.min(p.cash, rentDue)
          p.cash -= rentPaid
          players[landOwner.playerIndex].cash += rentPaid
          totalRentPaid += rentPaid
        }
      }

      // Special Tiles
      if (newPos === 0) {
        // Investment Bank
        p.investmentVisits += 1
        const maxUnlocked = [9, 19, 29, 39][Math.min(p.investmentVisits - 1, 3)]
        if (p.cash >= 100000) {
          const availableTiles = boardTiles.filter(
            (t) => t.id >= 1 && t.id <= maxUnlocked && !NO_CARD_TILES.has(t.id)
          )
          for (const t of availableTiles) {
            const cards = getBusinessCardsForTile(t)
            const existing = businesses.find((b) => b.playerIndex === pIndex && b.tileId === t.id && b.level < MAX_BUSINESS_LEVEL)
            if (existing) {
              const card = cards.find((c) => c.id === existing.cardId)
              if (card && p.cash >= card.price) {
                p.cash -= card.price
                existing.level += 1
                existing.pricePaid += card.price
                break
              }
            } else {
              const affordable = cards.filter((c) => p.cash >= c.price + 20000)
              if (affordable.length > 0) {
                const pick = affordable[affordable.length - 1]
                p.cash -= pick.price
                cardIdCounter += 1
                businesses.push({
                  id: `${pIndex}-${t.id}-${cardIdCounter}`,
                  playerIndex: pIndex,
                  tileId: t.id,
                  cardId: pick.id,
                  title: pick.title,
                  tier: pick.tier,
                  level: 1,
                  pricePaid: pick.price,
                  baseIncome: pick.baseIncome,
                })
                break
              }
            }
          }
        }
      } else if (newPos === 5) {
        // Political Event
        const eventId = Math.floor(Math.random() * 5)
        if (eventId === 0) {
          // COVID
          p.incomeModifier = { multiplier: 0.2, scope: 'all' }
        } else if (eventId === 1) {
          // Weak Baht
          p.incomeModifier = { multiplier: 1.4, scope: 'industrial' }
        } else if (eventId === 2) {
          // Tourism Boom
          p.incomeModifier = { multiplier: 1.5, scope: 'tourism' }
        } else if (eventId === 3) {
          // Stimulus
          for (const pl of players) pl.cash += 30000
        } else if (eventId === 4) {
          // Underground Lottery
          p.cash += prisonJackpot
          prisonJackpot = 0
        }
      } else if (newPos === 10) {
        // Burapha University
        if (p.educationStage === 'none' && p.cash >= 120000) {
          p.activeStudy = 'bachelor'
          p.studySkipTurns = 5
        } else if (p.educationStage === 'bachelorCompleted' && p.cash >= 220000) {
          p.activeStudy = 'master'
          p.studySkipTurns = 5
        }
      } else if (newPos === 20) {
        // Chonburi Prison Bazaar
        p.hasPrisonCoupon = true
      } else if (newPos === 30) {
        // Local Power Broker
        const pCards = influenceCards.filter((c) => c.playerIndex === pIndex)
        if (pCards.length < MAX_INFLUENCE_CARDS && p.cash >= 350000) {
          const discount = p.hasPrisonCoupon ? PRISON_COUPON_DISCOUNT : 0
          p.hasPrisonCoupon = false
          const effects: Array<'eviction' | 'leasePressure' | 'portConnection' | 'taxRelief' | 'zoningPermit'> = [
            'eviction', 'leasePressure', 'portConnection', 'taxRelief', 'zoningPermit',
          ]
          const chosenEffect = effects[Math.floor(Math.random() * effects.length)]
          const price = 400000 * (1 - discount)
          p.cash -= price
          cardIdCounter += 1
          influenceCards.push({
            id: `inf-${cardIdCounter}`,
            playerIndex: pIndex,
            cardId: chosenEffect,
            effect: chosenEffect,
            pricePaid: price,
          })

          // 20% Police Raid Risk
          if (Math.random() < 0.20) {
            policeRaidsTriggered += 1
            p.position = 20
            p.prisonTurns = 2
          }
        }
      } else if (!NO_CARD_TILES.has(newPos)) {
        // Normal Tile: Land & Business Actions
        // 1. Business
        const tileCards = getBusinessCardsForTile(currentTile)
        const existingBiz = businesses.find((b) => b.playerIndex === pIndex && b.tileId === newPos && b.level < MAX_BUSINESS_LEVEL)
        const isPolicyBlocked = Boolean(landOwner && landOwner.playerIndex !== pIndex && landOwner.policy === 'ownerOnly')

        if (!isPolicyBlocked) {
          if (existingBiz) {
            const card = tileCards.find((c) => c.id === existingBiz.cardId)
            if (card && p.cash >= card.price) {
              p.cash -= card.price
              existingBiz.level += 1
              existingBiz.pricePaid += card.price
            }
          } else {
            const affordable = tileCards.filter((c) => p.cash >= c.price + 20000)
            if (affordable.length > 0) {
              const pick = affordable[affordable.length - 1]
              p.cash -= pick.price
              cardIdCounter += 1
              businesses.push({
                id: `${pIndex}-${newPos}-${cardIdCounter}`,
                playerIndex: pIndex,
                tileId: newPos,
                cardId: pick.id,
                title: pick.title,
                tier: pick.tier,
                level: 1,
                pricePaid: pick.price,
                baseIncome: pick.baseIncome,
              })
            }
          }
        }

        // 2. Land purchase
        if (!landOwner && currentTile.landPrice && p.cash >= currentTile.landPrice + 50000) {
          p.cash -= currentTile.landPrice
          const ownsBizHere = businesses.some((b) => b.playerIndex === pIndex && b.tileId === newPos)
          lands.push({
            tileId: newPos,
            playerIndex: pIndex,
            policy: ownsBizHere ? 'ownerOnly' : 'openLease',
          })
        }
      }

      // Check Victory Condition
      const nw = getPlayerNetWorth(pIndex)
      if (nw >= targetNetWorth) {
        winnerIndex = pIndex
        break
      }
    }
  }

  // Fallback if max rounds reached
  if (winnerIndex === -1) {
    let maxNW = -1
    for (let i = 0; i < players.length; i += 1) {
      const nw = getPlayerNetWorth(i)
      if (nw > maxNW) {
        maxNW = nw
        winnerIndex = i
      }
    }
  }

  return {
    gameIndex,
    winnerIndex,
    totalRounds,
    totalTurns,
    finalNetWorths: players.map((_, i) => getPlayerNetWorth(i)),
    finalCash: players.map((p) => p.cash),
    finalBusinessesCount: players.map((_, i) => businesses.filter((b) => b.playerIndex === i).length),
    finalLandsCount: players.map((_, i) => lands.filter((l) => l.playerIndex === i).length),
    zoneRevenue,
    totalRentPaid,
    totalLeaseSharePaid,
    policeRaidsTriggered,
    degreesCompleted,
  }
}

export function runSimulationBatch(gameCount = 50, targetNetWorth = 10000000): SimBatchSummary {
  const results: SimGameResult[] = []
  const winCounts: [number, number, number] = [0, 0, 0]

  for (let i = 1; i <= gameCount; i += 1) {
    const res = runSingleSimulation(targetNetWorth, i)
    results.push(res)
    winCounts[res.winnerIndex] += 1
  }

  const rounds = results.map((r) => r.totalRounds)
  const avgRounds = Math.round(rounds.reduce((a, b) => a + b, 0) / gameCount)
  const minRounds = Math.min(...rounds)
  const maxRounds = Math.max(...rounds)

  const winnerNWs = results.map((r) => r.finalNetWorths[r.winnerIndex])
  const avgWinnerNW = Math.round(winnerNWs.reduce((a, b) => a + b, 0) / gameCount)

  const winnerCash = results.map((r) => r.finalCash[r.winnerIndex])
  const avgWinnerCash = Math.round(winnerCash.reduce((a, b) => a + b, 0) / gameCount)

  const winnerBiz = results.map((r) => r.finalBusinessesCount[r.winnerIndex])
  const avgWinnerBiz = Number((winnerBiz.reduce((a, b) => a + b, 0) / gameCount).toFixed(1))

  const winnerLands = results.map((r) => r.finalLandsCount[r.winnerIndex])
  const avgWinnerLands = Number((winnerLands.reduce((a, b) => a + b, 0) / gameCount).toFixed(1))

  const totalZoneRev: Record<string, number> = {}
  for (const r of results) {
    for (const [zone, rev] of Object.entries(r.zoneRevenue)) {
      totalZoneRev[zone] = (totalZoneRev[zone] ?? 0) + rev
    }
  }

  const allZoneTotal = Object.values(totalZoneRev).reduce((a, b) => a + b, 0) || 1
  const zoneRevenuePercentages: Record<string, number> = {}
  for (const [zone, rev] of Object.entries(totalZoneRev)) {
    zoneRevenuePercentages[zone] = Number(((rev / allZoneTotal) * 100).toFixed(1))
  }

  const avgRentPerGame = Math.round(results.reduce((sum, r) => sum + r.totalRentPaid, 0) / gameCount)
  const avgLeaseSharePerGame = Math.round(results.reduce((sum, r) => sum + r.totalLeaseSharePaid, 0) / gameCount)
  const avgPoliceRaidsPerGame = Number((results.reduce((sum, r) => sum + r.policeRaidsTriggered, 0) / gameCount).toFixed(1))
  const avgDegreesPerGame = Number((results.reduce((sum, r) => sum + r.degreesCompleted, 0) / gameCount).toFixed(1))

  return {
    totalGames: gameCount,
    targetNetWorth,
    winCounts,
    winPercentages: winCounts.map((w) => Number(((w / gameCount) * 100).toFixed(1))) as [number, number, number],
    avgRoundsToWin: avgRounds,
    minRoundsToWin: minRounds,
    maxRoundsToWin: maxRounds,
    avgWinnerNetWorth: avgWinnerNW,
    avgWinnerCash: avgWinnerCash,
    avgWinnerBusinesses: avgWinnerBiz,
    avgWinnerLands: avgWinnerLands,
    zoneRevenuePercentages,
    avgRentPerGame,
    avgLeaseSharePerGame,
    avgPoliceRaidsPerGame,
    avgDegreesPerGame,
  }
}
