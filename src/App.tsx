import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { boardTiles, type TileCategory } from './boardData'
import {
  businessLevelMultipliers,
  getBusinessCardsForTile,
  type BusinessCard,
} from './businessData'
import './App.css'
import './tenantDetails.css'

type Player = {
  id: string
  name: string
  role: 'Human' | 'AI'
  shape: 'circle' | 'square' | 'triangle'
  colorClass: string
}

type DiceRoll = {
  die1: number
  die2: number
  total: number
}

type Phase =
  | 'ready'
  | 'ai-delay'
  | 'moving'
  | 'card-choice'
  | 'education-choice'
  | 'study-skip'
  | 'prison-skip'
  | 'investment-choice'
  | 'investment-card-choice'
  | 'political-event'
  | 'land-choice'
  | 'influence-choice'

type EducationStage = 'none' | 'bachelorCompleted' | 'masterCompleted'

type ActiveStudy = 'none' | 'bachelor' | 'master'

type EducationState = {
  stage: EducationStage
  activeStudy: ActiveStudy
  skipTurns: number
}

type BuraphaChoice = 'bachelor' | 'master' | 'alumni'

type InventoryDetail =
  | { kind: 'business'; id: string }
  | { kind: 'land'; tileId: number }
  | { kind: 'influence'; id: string }
  | { kind: 'prisonCoupon' }
  | { kind: 'prisonStatus' }
  | null

type InvestmentOffer = {
  playerIndex: number
  visitCount: number
  maxTile: number
  options: number[]
}

type InfluenceEffect = 'eviction' | 'leasePressure' | 'portConnection'

type InfluenceCard = {
  id: string
  title: string
  price: number
  risk: string
  description: string
  effect: InfluenceEffect
}

type PoliticalEventScope = 'all' | 'industrial' | 'tourism'

type PoliticalEventCard = {
  id: string
  title: string
  tone: 'bad' | 'good' | 'cash' | 'jackpot'
  description: string
  effectText: string
  cashBonus?: number
  jackpotClaim?: boolean
  incomeModifier?: {
    multiplier: number
    scope: PoliticalEventScope
  }
}

type IncomeModifier = {
  id: string
  eventTitle: string
  playerIndex: number
  multiplier: number
  scope: PoliticalEventScope
}

type LeaseSharePayment = {
  ownerIndex: number
  tileId: number
  amount: number
}

type BusinessHolding = {
  id: string
  playerIndex: number
  tileId: number
  cardId: string
  title: string
  tier: BusinessCard['tier']
  level: number
  pricePaid: number
  baseIncome: number
}

type LandHolding = {
  tileId: number
  playerIndex: number
  pricePaid: number
}

type InfluenceHolding = {
  id: string
  playerIndex: number
  cardId: string
  title: string
  pricePaid: number
  risk: string
  description: string
  effect: InfluenceEffect
}

const players: Player[] = [
  {
    id: 'player',
    name: 'Player',
    role: 'Human',
    shape: 'circle',
    colorClass: 'token-blue',
  },
  {
    id: 'ai-1',
    name: 'AI 1',
    role: 'AI',
    shape: 'square',
    colorClass: 'token-red',
  },
  {
    id: 'ai-2',
    name: 'AI 2',
    role: 'AI',
    shape: 'triangle',
    colorClass: 'token-green',
  },
]

const tileCount = 40
const startingCash = 100000
const passStartIncome = 20000
const landRentRate = 0.03
const openLeaseShareRate = 0.1
const prisonJackpotMinimum = 20000
const prisonContactDiscountRate = 0.05
const influenceJailRiskRate = 0.2
const influenceJailTurns = 2
const investmentBankTile = 0
const politicalEventTile = 5
const prisonTile = 20
const buraphaTile = 10
const localPowerBrokerTile = 30
const walkDelayMs = 55
const aiDelayMs = 140
const noCardTiles = new Set([0, 5, 10, 20, 30])
const investmentUnlockRanges = [9, 19, 29, 39]
const testMoveOptions = Array.from({ length: 12 }, (_, index) => index + 1)
const devCashOptions = [100000, 500000, 1000000]
const devAllCashAmount = 500000
const maxInfluenceCards = 3
const studySkipTurns = 5
const aiMinimumCashReserve = passStartIncome * 2
const aiLandCashReserveMultiplier = 5
const aiLandMinimumBusinessIncome = 90000
const aiLandMinimumCashMultiple = 1.45
const netWorthWinTarget = 10000000
const educationTuition = {
  bachelor: 250000,
  master: 750000,
} satisfies Record<Exclude<ActiveStudy, 'none'>, number>
const educationIncomeBonus = {
  bachelorCompleted: 15,
  masterCompleted: 30,
} satisfies Record<Exclude<EducationStage, 'none'>, number>
const maxBusinessLevel = businessLevelMultipliers.length
const tourismCategories = new Set<TileCategory>([
  'market',
  'viewpoint',
  'beach',
  'wildlife',
  'island',
  'mall',
  'landmark',
  'nightlife',
  'show',
  'themepark',
])
const industrialCategories = new Set<TileCategory>(['industrial', 'port'])
const politicalEventCards: PoliticalEventCard[] = [
  {
    id: 'covid-19',
    title: 'COVID-19',
    tone: 'bad',
    description: 'Customers disappear and business slows across the whole board.',
    effectText: 'Business income for every player drops to 20% on their next income collection.',
    incomeModifier: {
      multiplier: 0.2,
      scope: 'all',
    },
  },
  {
    id: 'weak-baht',
    title: 'Weak Baht',
    tone: 'good',
    description: 'Foreign investment flows into industrial estates and logistics areas.',
    effectText: 'Industrial business income increases by 40% on each player\'s next income collection.',
    incomeModifier: {
      multiplier: 1.4,
      scope: 'industrial',
    },
  },
  {
    id: 'tourism-boom',
    title: 'Tourism Boom',
    tone: 'good',
    description: 'Tourists return, markets are busy, and souvenir spending jumps.',
    effectText: 'Tourism and market business income increases by 50% on each player\'s next income collection.',
    incomeModifier: {
      multiplier: 1.5,
      scope: 'tourism',
    },
  },
  {
    id: 'thai-stimulus',
    title: 'Thai Chuai Thai Stimulus',
    tone: 'cash',
    description: 'Government stimulus puts cash directly into everyone\'s pocket.',
    effectText: 'Every player immediately receives 30,000.',
    cashBonus: 30000,
  },
  {
    id: 'underground-lottery',
    title: 'Underground Lottery',
    tone: 'jackpot',
    description: 'A lucky number hits at the perfect time.',
    effectText: 'The player who drew this event claims the entire Prison Jackpot.',
    jackpotClaim: true,
  },
]
const influenceCards: InfluenceCard[] = [
  {
    id: 'influence-eviction',
    title: 'Influence Eviction',
    price: 300000,
    risk: '20% jail risk on use',
    description: 'Choose one rival business anywhere on the board and force it to close. The owner recovers 50% of the money paid into that business.',
    effect: 'eviction',
  },
  {
    id: 'lease-pressure',
    title: 'Lease Pressure',
    price: 350000,
    risk: '20% jail risk on use',
    description: 'Your next Open Lease collection is doubled from 10% to 20%, then this pressure ends.',
    effect: 'leasePressure',
  },
  {
    id: 'port-connection',
    title: 'Port Connection',
    price: 400000,
    risk: '20% jail risk on use',
    description: 'Industrial and port business income pays 140% on your next income collection at tile 00.',
    effect: 'portConnection',
  },
]

function rollDice(): DiceRoll {
  const die1 = Math.floor(Math.random() * 6) + 1
  const die2 = Math.floor(Math.random() * 6) + 1

  return {
    die1,
    die2,
    total: die1 + die2,
  }
}

function drawPoliticalEvent() {
  return politicalEventCards[Math.floor(Math.random() * politicalEventCards.length)]
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function formatMoney(amount: number) {
  return amount.toLocaleString()
}

function formatCompactMoney(amount: number) {
  if (amount >= 1000000) {
    const millions = amount / 1000000
    return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`
  }

  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}K`
  }

  return amount.toLocaleString()
}

function getRandomInfluenceOffer() {
  return [...influenceCards]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
}

function getTileGridPosition(tile: number) {
  if (tile <= 10) {
    return { gridColumn: 11 - tile, gridRow: 11 }
  }

  if (tile <= 20) {
    return { gridColumn: 1, gridRow: 21 - tile }
  }

  if (tile <= 30) {
    return { gridColumn: tile - 19, gridRow: 1 }
  }

  return { gridColumn: 11, gridRow: tile - 29 }
}

function countStartPasses(startPosition: number, steps: number) {
  return Math.floor((startPosition + steps) / tileCount)
}

function rollInfluenceJailRisk() {
  return Math.random() < influenceJailRiskRate
}

function App() {
  const [positions, setPositions] = useState<number[]>(() => players.map(() => 0))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [latestRoll, setLatestRoll] = useState<DiceRoll | null>(null)
  const [status, setStatus] = useState('Ready. Roll to start the round.')
  const [, setRollHistory] = useState<string[]>([])
  const [education, setEducation] = useState<EducationState>({
    stage: 'none',
    activeStudy: 'none',
    skipTurns: 0,
  })
  const [buraphaChoice, setBuraphaChoice] = useState<BuraphaChoice | null>(null)
  const [educationPlayerIndex, setEducationPlayerIndex] = useState<number | null>(null)
  const [, setInvestmentVisits] = useState<number[]>(() => players.map(() => 0))
  const [investmentOffer, setInvestmentOffer] = useState<InvestmentOffer | null>(null)
  const [selectedInvestmentTile, setSelectedInvestmentTile] = useState<number | null>(null)
  const [selectedLandTile, setSelectedLandTile] = useState<number | null>(null)
  const [selectedPoliticalEvent, setSelectedPoliticalEvent] = useState<PoliticalEventCard | null>(null)
  const [incomeModifiers, setIncomeModifiers] = useState<IncomeModifier[]>([])
  const [prisonJackpot, setPrisonJackpot] = useState(0)
  const [isNetWorthOpen, setIsNetWorthOpen] = useState(false)
  const [isWinnerDismissed, setIsWinnerDismissed] = useState(false)
  const [prisonTurns, setPrisonTurns] = useState<number[]>(() => players.map(() => 0))
  const [prisonContactCoupons, setPrisonContactCoupons] = useState<boolean[]>(() =>
    players.map(() => false),
  )
  const [influenceOffer, setInfluenceOffer] = useState<InfluenceCard[]>([])
  const [influenceHoldings, setInfluenceHoldings] = useState<InfluenceHolding[]>([])
  const [leasePressurePlayers, setLeasePressurePlayers] = useState<boolean[]>(() =>
    players.map(() => false),
  )
  const [evictionCard, setEvictionCard] = useState<InfluenceHolding | null>(null)
  const [cash, setCash] = useState<number[]>(() => players.map(() => startingCash))
  const [businesses, setBusinesses] = useState<BusinessHolding[]>([])
  const [landHoldings, setLandHoldings] = useState<LandHolding[]>([])
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0)
  const [inventoryDetail, setInventoryDetail] = useState<InventoryDetail>(null)
  const [isDevMode, setIsDevMode] = useState(false)
  const [isLedgerVisible, setIsLedgerVisible] = useState(true)
  const [investmentModalOffset, setInvestmentModalOffset] = useState({ x: 0, y: 0 })

  const skipRequestedRef = useRef(false)
  const activeRunRef = useRef(false)
  const runIdRef = useRef(0)
  const positionsRef = useRef<number[]>(players.map(() => 0))
  const educationRef = useRef<EducationState>({
    stage: 'none',
    activeStudy: 'none',
    skipTurns: 0,
  })
  const investmentVisitsRef = useRef<number[]>(players.map(() => 0))
  const cashRef = useRef<number[]>(players.map(() => startingCash))
  const businessesRef = useRef<BusinessHolding[]>([])
  const landHoldingsRef = useRef<LandHolding[]>([])
  const incomeModifiersRef = useRef<IncomeModifier[]>([])
  const prisonJackpotRef = useRef(0)
  const prisonTurnsRef = useRef<number[]>(players.map(() => 0))
  const prisonContactCouponsRef = useRef<boolean[]>(players.map(() => false))
  const influenceHoldingsRef = useRef<InfluenceHolding[]>([])
  const leasePressurePlayersRef = useRef<boolean[]>(players.map(() => false))
  const influenceCardIdRef = useRef(0)
  const forcedMoveRef = useRef<number | null>(null)
  const aiDelayResolverRef = useRef<(() => void) | null>(null)
  const cardChoiceResolverRef = useRef<(() => void) | null>(null)
  const educationChoiceResolverRef = useRef<(() => void) | null>(null)
  const investmentChoiceResolverRef = useRef<(() => void) | null>(null)
  const politicalEventResolverRef = useRef<(() => void) | null>(null)
  const influenceChoiceResolverRef = useRef<(() => void) | null>(null)
  const investmentModalDragRef = useRef<{
    originX: number
    originY: number
    pointerId: number
    startX: number
    startY: number
  } | null>(null)

  const tileOccupants = useMemo(() => {
    return positions.reduce<Record<number, number[]>>((occupants, position, index) => {
      occupants[position] = [...(occupants[position] ?? []), index]
      return occupants
    }, {})
  }, [positions])

  const businessesByTile = useMemo(() => {
    return businesses.reduce<Record<number, BusinessHolding[]>>((groups, business) => {
      groups[business.tileId] = [...(groups[business.tileId] ?? []), business]
      return groups
    }, {})
  }, [businesses])

  const landHoldingByTile = useMemo(() => {
    return landHoldings.reduce<Record<number, LandHolding>>((groups, holding) => {
      groups[holding.tileId] = holding
      return groups
    }, {})
  }, [landHoldings])

  function updatePositions(nextPositions: number[]) {
    positionsRef.current = nextPositions
    setPositions(nextPositions)
  }

  function updateEducation(nextEducation: EducationState) {
    educationRef.current = nextEducation
    setEducation(nextEducation)
  }

  function updateInvestmentVisits(nextInvestmentVisits: number[]) {
    investmentVisitsRef.current = nextInvestmentVisits
    setInvestmentVisits(nextInvestmentVisits)
  }

  function updateCash(nextCash: number[]) {
    cashRef.current = nextCash
    setCash(nextCash)
  }

  function updateBusinesses(nextBusinesses: BusinessHolding[]) {
    businessesRef.current = nextBusinesses
    setBusinesses(nextBusinesses)
  }

  function updateLandHoldings(nextLandHoldings: LandHolding[]) {
    landHoldingsRef.current = nextLandHoldings
    setLandHoldings(nextLandHoldings)
  }

  function updateIncomeModifiers(nextIncomeModifiers: IncomeModifier[]) {
    incomeModifiersRef.current = nextIncomeModifiers
    setIncomeModifiers(nextIncomeModifiers)
  }

  function updatePrisonJackpot(nextPrisonJackpot: number) {
    prisonJackpotRef.current = nextPrisonJackpot
    setPrisonJackpot(nextPrisonJackpot)
  }

  function updatePrisonTurns(nextPrisonTurns: number[]) {
    prisonTurnsRef.current = nextPrisonTurns
    setPrisonTurns(nextPrisonTurns)
  }

  function updatePrisonContactCoupons(nextPrisonContactCoupons: boolean[]) {
    prisonContactCouponsRef.current = nextPrisonContactCoupons
    setPrisonContactCoupons(nextPrisonContactCoupons)
  }

  function updateInfluenceHoldings(nextInfluenceHoldings: InfluenceHolding[]) {
    influenceHoldingsRef.current = nextInfluenceHoldings
    setInfluenceHoldings(nextInfluenceHoldings)
  }

  function updateLeasePressurePlayers(nextLeasePressurePlayers: boolean[]) {
    leasePressurePlayersRef.current = nextLeasePressurePlayers
    setLeasePressurePlayers(nextLeasePressurePlayers)
  }

  function getEducationIncomeBonusRate(playerIndex: number) {
    if (players[playerIndex].role !== 'Human') {
      return 0
    }

    if (educationRef.current.stage === 'masterCompleted') {
      return educationIncomeBonus.masterCompleted / 100
    }

    if (educationRef.current.stage === 'bachelorCompleted') {
      return educationIncomeBonus.bachelorCompleted / 100
    }

    return 0
  }

  function getBusinessHoldingIncome(business: BusinessHolding) {
    const multiplier = businessLevelMultipliers[business.level - 1] ?? businessLevelMultipliers[0]
    return Math.round(business.baseIncome * multiplier)
  }

  function getRawBusinessIncomeForPlayer(playerIndex: number) {
    return businessesRef.current
      .filter((business) => business.playerIndex === playerIndex)
      .reduce((total, business) => total + getBusinessHoldingIncome(business), 0)
  }

  function isBusinessInScope(business: BusinessHolding, scope: PoliticalEventScope) {
    if (scope === 'all') {
      return true
    }

    const tileCategory = boardTiles[business.tileId].category

    if (scope === 'industrial') {
      return industrialCategories.has(tileCategory)
    }

    return tourismCategories.has(tileCategory)
  }

  function getModifiedBusinessIncomeForPlayer(playerIndex: number) {
    const playerBusinesses = businessesRef.current.filter(
      (business) => business.playerIndex === playerIndex,
    )
    const playerModifiers = incomeModifiersRef.current.filter(
      (modifier) => modifier.playerIndex === playerIndex,
    )
    const modifierSummary = new Set<string>()
    const businessIncomes = playerBusinesses.map((business) => {
      const baseIncome = getBusinessHoldingIncome(business)
      const matchingModifiers = playerModifiers.filter((modifier) =>
        isBusinessInScope(business, modifier.scope),
      )
      const modifiedIncome = matchingModifiers.reduce(
        (income, modifier) => {
          modifierSummary.add(`${modifier.eventTitle} (${Math.round(modifier.multiplier * 100)}%)`)
          return Math.round(income * modifier.multiplier)
        },
        baseIncome,
      )

      return {
        business,
        income: modifiedIncome,
      }
    })

    return {
      businessIncome: businessIncomes.reduce((total, item) => total + item.income, 0),
      businessIncomes,
      modifierSummary: [...modifierSummary],
      usedModifierIds: playerModifiers.map((modifier) => modifier.id),
    }
  }

  function getLeaseSharePayments(
    playerIndex: number,
    businessIncomes: { business: BusinessHolding; income: number }[],
    passCount: number,
  ) {
    return businessIncomes.reduce<LeaseSharePayment[]>((payments, item) => {
      const landHolding = landHoldingsRef.current.find(
        (holding) => holding.tileId === item.business.tileId,
      )

      if (!landHolding || landHolding.playerIndex === playerIndex) {
        return payments
      }

      const rate = leasePressurePlayersRef.current[landHolding.playerIndex]
        ? openLeaseShareRate * 2
        : openLeaseShareRate
      const amount = Math.round(item.income * passCount * rate)

      if (amount <= 0) {
        return payments
      }

      return [
        ...payments,
        {
          ownerIndex: landHolding.playerIndex,
          tileId: item.business.tileId,
          amount,
        },
      ]
    }, [])
  }

  function payStartIncome(playerIndex: number, passCount: number) {
    if (passCount <= 0) {
      return null
    }

    const modifiedIncome = getModifiedBusinessIncomeForPlayer(playerIndex)
    const baseRoundIncome = passStartIncome * passCount
    const businessIncome = modifiedIncome.businessIncome * passCount
    const educationBonus = Math.round(businessIncome * getEducationIncomeBonusRate(playerIndex))
    const leaseShares = getLeaseSharePayments(
      playerIndex,
      modifiedIncome.businessIncomes,
      passCount,
    )
    const totalLeaseShare = leaseShares.reduce((total, payment) => total + payment.amount, 0)
    const totalIncome = baseRoundIncome + businessIncome + educationBonus - totalLeaseShare
    const nextCash = [...cashRef.current]
    nextCash[playerIndex] += totalIncome
    leaseShares.forEach((payment) => {
      nextCash[payment.ownerIndex] += payment.amount
    })
    updateCash(nextCash)

    const pressuredOwners = new Set(
      leaseShares
        .map((payment) => payment.ownerIndex)
        .filter((ownerIndex) => leasePressurePlayersRef.current[ownerIndex]),
    )

    if (pressuredOwners.size > 0) {
      updateLeasePressurePlayers(
        leasePressurePlayersRef.current.map((isPressured, ownerIndex) =>
          pressuredOwners.has(ownerIndex) ? false : isPressured,
        ),
      )
    }

    if (modifiedIncome.usedModifierIds.length > 0) {
      updateIncomeModifiers(
        incomeModifiersRef.current.filter(
          (modifier) => !modifiedIncome.usedModifierIds.includes(modifier.id),
        ),
      )
    }

    return {
      baseRoundIncome,
      businessIncome,
      educationBonus,
      modifierSummary: modifiedIncome.modifierSummary,
      leaseShares,
      totalLeaseShare,
      totalIncome,
      nextCash: nextCash[playerIndex],
    }
  }

  function payLandRent(playerIndex: number, tileId: number) {
    const landHolding = landHoldingsRef.current.find((holding) => holding.tileId === tileId)
    const tile = boardTiles[tileId]

    if (!landHolding || landHolding.playerIndex === playerIndex || !tile.landPrice) {
      return null
    }

    const rentDue = Math.round(tile.landPrice * landRentRate)
    const rentPaid = Math.min(cashRef.current[playerIndex], rentDue)
    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= rentPaid
    nextCash[landHolding.playerIndex] += rentPaid
    updateCash(nextCash)

    return {
      ownerIndex: landHolding.playerIndex,
      rentDue,
      rentPaid,
      payerCash: nextCash[playerIndex],
      ownerCash: nextCash[landHolding.playerIndex],
    }
  }

  async function skipPrisonTurn(playerIndex: number, runId: number) {
    const currentTurns = prisonTurnsRef.current[playerIndex]

    if (currentTurns <= 0) {
      return
    }

    const jackpotContribution = Math.max(
      getRawBusinessIncomeForPlayer(playerIndex),
      prisonJackpotMinimum,
    )
    const nextPrisonTurns = [...prisonTurnsRef.current]
    nextPrisonTurns[playerIndex] = Math.max(currentTurns - 1, 0)
    updatePrisonTurns(nextPrisonTurns)
    updatePrisonJackpot(prisonJackpotRef.current + jackpotContribution)
    setPhase('prison-skip')
    setStatus(
      `${players[playerIndex].name} is in Chonburi Prison. Skipped turn: ${nextPrisonTurns[playerIndex]} left. ${formatMoney(jackpotContribution)} moved into Prison Jackpot.`,
    )

    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function movePlayer(playerIndex: number, steps: number, runId: number) {
    skipRequestedRef.current = false
    setPhase('moving')
    const startPosition = positionsRef.current[playerIndex]
    let finalPosition = startPosition

    for (let step = 0; step < steps; step += 1) {
      if (runId !== runIdRef.current) {
        return
      }

      if (skipRequestedRef.current) {
        finalPosition = (finalPosition + (steps - step)) % tileCount
        const nextPositions = [...positionsRef.current]
        nextPositions[playerIndex] = finalPosition
        updatePositions(nextPositions)
        break
      }

      await wait(walkDelayMs)

      if (runId !== runIdRef.current) {
        return
      }

      finalPosition = (finalPosition + 1) % tileCount
      const nextPositions = [...positionsRef.current]
      nextPositions[playerIndex] = finalPosition
      updatePositions(nextPositions)
    }

    skipRequestedRef.current = false
    const payout = payStartIncome(playerIndex, countStartPasses(startPosition, steps))

    if (payout) {
      const eventText =
        payout.modifierSummary.length > 0 ? ` Event: ${payout.modifierSummary.join(', ')}.` : ''
      const leaseText =
        payout.totalLeaseShare > 0
          ? ` Open Lease paid ${formatMoney(payout.totalLeaseShare)} to land owner${payout.leaseShares.length > 1 ? 's' : ''}.`
          : ''
      setStatus(
        `${players[playerIndex].name} passed Investment Bank and received ${formatMoney(payout.totalIncome)}.${eventText}${leaseText} Cash: ${formatMoney(payout.nextCash)}.`,
      )
    } else {
      setStatus(`${players[playerIndex].name} stopped at ${boardTiles[finalPosition].name}.`)
    }
    return finalPosition
  }

  async function playTurn(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    setCurrentPlayerIndex(playerIndex)

    if (prisonTurnsRef.current[playerIndex] > 0) {
      await skipPrisonTurn(playerIndex, runId)
      return
    }

    if (player.role === 'Human' && educationRef.current.skipTurns > 0) {
      await skipStudyTurn(runId)
      return
    }

    if (player.role === 'AI') {
      setPhase('ai-delay')
      setStatus(`${player.name} is rolling next.`)
      await new Promise<void>((resolve) => {
        aiDelayResolverRef.current = resolve
        window.setTimeout(resolve, aiDelayMs)
      })
      aiDelayResolverRef.current = null

      if (runId !== runIdRef.current) {
        return
      }
    }

    const forcedMove = player.role === 'Human' ? forcedMoveRef.current : null
    forcedMoveRef.current = null
    const roll = forcedMove === null ? rollDice() : { die1: forcedMove, die2: 0, total: forcedMove }
    setLatestRoll(roll)
    setStatus(
      forcedMove === null
        ? `${player.name} rolled ${roll.die1} + ${roll.die2} = ${roll.total}.`
        : `${player.name} test moved ${roll.total} spaces.`,
    )
    setRollHistory((history) => [
      forcedMove === null
        ? `${player.name}: ${roll.die1} + ${roll.die2} = ${roll.total}`
        : `${player.name}: Test move ${roll.total}`,
      ...history,
    ].slice(0, 5))

    const finalPosition = await movePlayer(playerIndex, roll.total, runId)

    const rentResult =
      typeof finalPosition === 'number' ? payLandRent(playerIndex, finalPosition) : null
    const rentMessage = rentResult
      ? `${player.name} paid ${formatMoney(rentResult.rentPaid)} rent to ${players[rentResult.ownerIndex].name} for ${boardTiles[finalPosition as number].name}.`
      : ''

    if (rentResult) {
      setStatus(
        rentResult.rentPaid < rentResult.rentDue
          ? `${rentMessage} Rent due was ${formatMoney(rentResult.rentDue)}, but ${player.name} only had enough to pay ${formatMoney(rentResult.rentPaid)}.`
          : rentMessage,
      )
    }

    if (
      runId === runIdRef.current &&
      typeof finalPosition === 'number' &&
      finalPosition === prisonTile
    ) {
      await handlePrisonBazaarTile(playerIndex, runId)
      return
    }

    if (
      runId === runIdRef.current &&
      typeof finalPosition === 'number' &&
      finalPosition === investmentBankTile
    ) {
      await handleInvestmentBankTile(playerIndex, runId)
      return
    }

    if (
      runId === runIdRef.current &&
      typeof finalPosition === 'number' &&
      finalPosition === politicalEventTile
    ) {
      await handlePoliticalEventTile(playerIndex, runId)
      return
    }

    if (
      runId === runIdRef.current &&
      player.role === 'Human' &&
      finalPosition === buraphaTile
    ) {
      await handleBuraphaTile(playerIndex)
      return
    }

    if (
      runId === runIdRef.current &&
      typeof finalPosition === 'number' &&
      finalPosition === localPowerBrokerTile
    ) {
      await handleLocalPowerBrokerTile(playerIndex, runId)
      return
    }

    if (
      runId === runIdRef.current &&
      player.role === 'Human' &&
      typeof finalPosition === 'number' &&
      !noCardTiles.has(finalPosition)
    ) {
      setPhase('card-choice')
      setStatus(
        `${rentMessage ? `${rentMessage} ` : ''}Choose a card for ${boardTiles[finalPosition].name}, or skip.`,
      )
      await new Promise<void>((resolve) => {
        cardChoiceResolverRef.current = resolve
      })
      cardChoiceResolverRef.current = null
    }

    if (
      runId === runIdRef.current &&
      player.role === 'AI' &&
      typeof finalPosition === 'number' &&
      !noCardTiles.has(finalPosition)
    ) {
      await applyAiBusinessChoice(playerIndex, finalPosition, 'AI business choice', runId)
    }

    if (
      runId === runIdRef.current &&
      player.role === 'AI' &&
      typeof finalPosition === 'number' &&
      !noCardTiles.has(finalPosition)
    ) {
      await applyAiLandChoice(playerIndex, finalPosition, runId)
    }
  }

  function getInvestmentOptions(visitCount: number) {
    const maxTile =
      investmentUnlockRanges[Math.min(visitCount, investmentUnlockRanges.length) - 1] ??
      investmentUnlockRanges[investmentUnlockRanges.length - 1]
    const options = boardTiles
      .filter((tile) => tile.id >= 1 && tile.id <= maxTile && !noCardTiles.has(tile.id))
      .map((tile) => tile.id)

    return { maxTile, options }
  }

  async function handleInvestmentBankTile(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    const nextVisits = [...investmentVisitsRef.current]
    nextVisits[playerIndex] += 1
    updateInvestmentVisits(nextVisits)

    const visitCount = nextVisits[playerIndex]
    const { maxTile, options } = getInvestmentOptions(visitCount)

    if (player.role === 'AI') {
      setStatus(`${player.name} reached Investment Bank visit ${visitCount}. AI is checking 01-${maxTile}.`)
      await applyAiInvestmentBankChoice(playerIndex, options, runId)
      return
    }

    setInvestmentModalOffset({ x: 0, y: 0 })
    setInvestmentOffer({
      playerIndex,
      visitCount,
      maxTile,
      options,
    })
    setPhase('investment-choice')
    setStatus(`Investment Bank visit ${visitCount}: choose an investment tile, or skip.`)

    await new Promise<void>((resolve) => {
      investmentChoiceResolverRef.current = resolve
    })
    investmentChoiceResolverRef.current = null
    setInvestmentOffer(null)
    setSelectedInvestmentTile(null)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function handlePrisonBazaarTile(playerIndex: number, runId: number) {
    const nextCoupons = [...prisonContactCouponsRef.current]
    const alreadyHasCoupon = nextCoupons[playerIndex]
    nextCoupons[playerIndex] = true
    updatePrisonContactCoupons(nextCoupons)

    setStatus(
      alreadyHasCoupon
        ? `${players[playerIndex].name} visited Chonburi Prison Bazaar and already has a Prison Contact Coupon.`
        : `${players[playerIndex].name} received a Prison Contact Coupon: ${Math.round(prisonContactDiscountRate * 100)}% off the next influence card purchase.`,
    )

    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  function applyPoliticalEvent(event: PoliticalEventCard, playerIndex: number) {
    if (event.cashBonus) {
      const nextCash = cashRef.current.map((playerCash) => playerCash + event.cashBonus!)
      updateCash(nextCash)
      return `Every player received ${formatMoney(event.cashBonus)}.`
    }

    if (event.jackpotClaim) {
      const prize = prisonJackpotRef.current
      const nextCash = [...cashRef.current]
      nextCash[playerIndex] += prize
      updateCash(nextCash)
      updatePrisonJackpot(0)

      if (prize <= 0) {
        return `${players[playerIndex].name} drew the lottery, but the Prison Jackpot is empty.`
      }

      return `${players[playerIndex].name} claimed the Prison Jackpot: ${formatMoney(prize)}.`
    }

    if (!event.incomeModifier) {
      return 'No effect.'
    }

    const nextModifiers = incomeModifiersRef.current.filter(
      (modifier) =>
        !(
          modifier.scope === event.incomeModifier?.scope &&
          players.some((player) => `${event.id}-${player.id}` === modifier.id)
        ),
    )

    updateIncomeModifiers([
      ...nextModifiers,
      ...players.map((player, playerIndex) => ({
        id: `${event.id}-${player.id}`,
        eventTitle: event.title,
        playerIndex,
        multiplier: event.incomeModifier!.multiplier,
        scope: event.incomeModifier!.scope,
      })),
    ])

    return 'Effect applies to each player once, on their next business income collection.'
  }

  function resolvePoliticalEvent(message: string) {
    setStatus(message)
    politicalEventResolverRef.current?.()
  }

  async function handlePoliticalEventTile(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    const event = drawPoliticalEvent()
    const effectResult = applyPoliticalEvent(event, playerIndex)

    if (player.role === 'AI') {
      setStatus(`${player.name} triggered ${event.title}. ${effectResult}`)
      await wait(aiDelayMs)
      return
    }

    setSelectedPoliticalEvent(event)
    setPhase('political-event')
    setStatus(`Political Event: ${event.title}.`)

    await new Promise<void>((resolve) => {
      politicalEventResolverRef.current = resolve
    })
    politicalEventResolverRef.current = null
    setSelectedPoliticalEvent(null)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function handleLocalPowerBrokerTile(playerIndex: number, runId: number) {
    const player = players[playerIndex]

    if (player.role === 'AI') {
      setStatus(`${player.name} reached Local Power Broker. AI skips influence cards for now.`)
      await wait(aiDelayMs)
      return
    }

    setInfluenceOffer(getRandomInfluenceOffer())
    setPhase('influence-choice')
    setStatus('Local Power Broker: choose one influence card, or walk away.')

    await new Promise<void>((resolve) => {
      influenceChoiceResolverRef.current = resolve
    })
    influenceChoiceResolverRef.current = null
    setInfluenceOffer([])

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function skipStudyTurn(runId: number) {
    const currentEducation = educationRef.current
    const remainingTurns = Math.max(currentEducation.skipTurns - 1, 0)
    const completedStudy = currentEducation.activeStudy
    const nextEducation: EducationState = {
      stage: currentEducation.stage,
      activeStudy: remainingTurns === 0 ? 'none' : currentEducation.activeStudy,
      skipTurns: remainingTurns,
    }

    if (remainingTurns === 0 && completedStudy === 'bachelor') {
      nextEducation.stage = 'bachelorCompleted'
    }

    if (remainingTurns === 0 && completedStudy === 'master') {
      nextEducation.stage = 'masterCompleted'
    }

    updateEducation(nextEducation)
    setPhase('study-skip')

    if (remainingTurns === 0) {
      const bonus =
        completedStudy === 'master'
          ? educationIncomeBonus.masterCompleted
          : educationIncomeBonus.bachelorCompleted
      setStatus(`Player finished studying at Burapha University. Business income bonus is now +${bonus}%.`)
    } else {
      setStatus(`Player is studying at Burapha University. ${remainingTurns} skipped turn left.`)
    }

    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function handleBuraphaTile(playerIndex: number) {
    const currentEducation = educationRef.current
    const nextChoice: BuraphaChoice =
      currentEducation.stage === 'none'
        ? 'bachelor'
        : currentEducation.stage === 'bachelorCompleted'
          ? 'master'
          : 'alumni'

    setEducationPlayerIndex(playerIndex)
    setBuraphaChoice(nextChoice)
    setPhase('education-choice')

    if (nextChoice === 'bachelor') {
      setStatus('Burapha University: choose whether to continue studying.')
    } else if (nextChoice === 'master') {
      setStatus('Burapha University: choose whether to study a master degree.')
    } else {
      setStatus('Burapha University: alumni fee card is available.')
    }

    await new Promise<void>((resolve) => {
      educationChoiceResolverRef.current = resolve
    })
    educationChoiceResolverRef.current = null
    setBuraphaChoice(null)
    setEducationPlayerIndex(null)
  }

  async function playRound() {
    if (activeRunRef.current) {
      return
    }

    activeRunRef.current = true
    const runId = runIdRef.current

    let continueStudyRounds = true

    while (continueStudyRounds) {
      for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
        if (runId !== runIdRef.current) {
          return
        }

        await playTurn(playerIndex, runId)
      }

      continueStudyRounds = educationRef.current.skipTurns > 0 || prisonTurnsRef.current[0] > 0
    }

    if (runId !== runIdRef.current) {
      return
    }

    setCurrentPlayerIndex(0)
    setSelectedPlayerIndex(0)
    setPhase('ready')
    setStatus('Your turn. Roll when ready.')
    activeRunRef.current = false
  }

  function handlePrimaryAction() {
    if (phase === 'ready') {
      void playRound()
      return
    }

    if (phase === 'ai-delay') {
      aiDelayResolverRef.current?.()
      setStatus('Fast forwarding AI turn.')
      return
    }

    if (
      phase === 'card-choice' ||
      phase === 'education-choice' ||
      phase === 'study-skip' ||
      phase === 'prison-skip' ||
      phase === 'investment-choice' ||
      phase === 'investment-card-choice' ||
      phase === 'political-event' ||
      phase === 'land-choice' ||
      phase === 'influence-choice'
    ) {
      return
    }

    skipRequestedRef.current = true
    setStatus('Skipping movement.')
  }

  function handleTestMove(steps: number) {
    if (phase !== 'ready' || activeRunRef.current) {
      return
    }

    forcedMoveRef.current = steps
    void playRound()
  }

  function addDevCashToPlayer(amount: number) {
    const nextCash = [...cashRef.current]
    nextCash[0] += amount
    updateCash(nextCash)
    setSelectedPlayerIndex(0)
    setStatus(`Dev cash: Player received ${formatMoney(amount)}.`)
  }

  function addDevCashToAll(amount: number) {
    const nextCash = cashRef.current.map((playerCash) => playerCash + amount)
    updateCash(nextCash)
    setStatus(`Dev cash: every player received ${formatMoney(amount)}.`)
  }

  function resolveCardChoice(message: string) {
    setStatus(message)
    cardChoiceResolverRef.current?.()
  }

  function openLandDetail(tileId: number) {
    if (phase !== 'ready') {
      return
    }

    setSelectedLandTile(tileId)
    setPhase('land-choice')
    setStatus(`Viewing land detail: ${boardTiles[tileId].name}.`)
  }

  function closeLandDetail(message?: string) {
    setSelectedLandTile(null)
    setPhase('ready')

    if (message) {
      setStatus(message)
    }
  }

  function buyCurrentLand() {
    const playerIndex = currentPlayerIndex
    const tile = selectedLandTile === null ? null : boardTiles[selectedLandTile]

    if (!tile) {
      closeLandDetail('No land selected.')
      return
    }

    if (!tile.landPrice) {
      closeLandDetail(`${tile.name} cannot be purchased.`)
      return
    }

    if (landHoldingsRef.current.some((holding) => holding.tileId === tile.id)) {
      closeLandDetail(`${tile.name} already has a land owner.`)
      return
    }

    const playerCash = cashRef.current[playerIndex]

    if (playerCash < tile.landPrice) {
      closeLandDetail(
        `${players[playerIndex].name} needs ${formatMoney(tile.landPrice)} but only has ${formatMoney(playerCash)}.`,
      )
      return
    }

    const result = buyLandForPlayer(playerIndex, tile.id)
    closeLandDetail(result.message)
  }

  function buyLandForPlayer(playerIndex: number, tileId: number) {
    const tile = boardTiles[tileId]

    if (!tile.landPrice) {
      return {
        success: false,
        message: `${tile.name} cannot be purchased.`,
      }
    }

    if (landHoldingsRef.current.some((holding) => holding.tileId === tile.id)) {
      return {
        success: false,
        message: `${tile.name} already has a land owner.`,
      }
    }

    const playerCash = cashRef.current[playerIndex]

    if (playerCash < tile.landPrice) {
      return {
        success: false,
        message: `${players[playerIndex].name} needs ${formatMoney(tile.landPrice)} but only has ${formatMoney(playerCash)}.`,
      }
    }

    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= tile.landPrice
    updateCash(nextCash)
    updateLandHoldings([
      ...landHoldingsRef.current,
      {
        tileId: tile.id,
        playerIndex,
        pricePaid: tile.landPrice,
      },
    ])

    return {
      success: true,
      message: `${players[playerIndex].name} bought land at ${tile.name} for ${formatMoney(tile.landPrice)}. Cash left: ${formatMoney(nextCash[playerIndex])}.`,
    }
  }

  function getBusinessIncomeAtLevel(card: BusinessCard, level: number) {
    const multiplier = businessLevelMultipliers[level - 1] ?? businessLevelMultipliers[0]
    return Math.round(card.baseIncome * multiplier)
  }

  function purchaseBusinessCardForPlayer(playerIndex: number, card: BusinessCard, tileId: number) {
    const tile = boardTiles[tileId]
    const existingBusiness = businessesRef.current.find(
      (business) =>
        business.tileId === tileId &&
        business.cardId === card.id,
    )

    if (existingBusiness && existingBusiness.playerIndex !== playerIndex) {
      return {
        success: false,
        message: `${card.title} at ${tile.name} already belongs to ${players[existingBusiness.playerIndex].name}.`,
      }
    }

    if (existingBusiness && existingBusiness.level >= maxBusinessLevel) {
      return {
        success: false,
        message: `${existingBusiness.title} at ${tile.name} is already max level.`,
      }
    }

    const playerCash = cashRef.current[playerIndex]

    if (playerCash < card.price) {
      return {
        success: false,
        message: `${players[playerIndex].name} needs ${formatMoney(card.price)} but only has ${formatMoney(playerCash)}.`,
      }
    }

    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= card.price
    updateCash(nextCash)

    if (existingBusiness) {
      const nextLevel = existingBusiness.level + 1
      updateBusinesses(
        businessesRef.current.map((business) =>
          business.id === existingBusiness.id
            ? {
                ...business,
                level: nextLevel,
                pricePaid: business.pricePaid + card.price,
          }
            : business,
        ),
      )
      return {
        success: true,
        message: `${players[playerIndex].name} upgraded ${card.title} at ${tile.name} to level ${nextLevel} for ${formatMoney(card.price)}. New income: ${formatMoney(getBusinessIncomeAtLevel(card, nextLevel))} / round.`,
      }
    }

    const nextBusiness: BusinessHolding = {
      id: `${playerIndex}-${tileId}-${card.id}`,
      playerIndex,
      tileId,
      cardId: card.id,
      title: card.title,
      tier: card.tier,
      level: 1,
      pricePaid: card.price,
      baseIncome: card.baseIncome,
    }
    updateBusinesses([...businessesRef.current, nextBusiness])
    return {
      success: true,
      message: `${players[playerIndex].name} bought ${card.title} at ${tile.name} for ${formatMoney(card.price)}. Cash left: ${formatMoney(nextCash[playerIndex])}.`,
    }
  }

  function buyOrUpgradeBusinessCard(card: BusinessCard, tileId = activeTile.id) {
    const result = purchaseBusinessCardForPlayer(currentPlayerIndex, card, tileId)

    if (result.success) {
      resolveCardChoice(result.message)
      return
    }

    setStatus(result.message)
  }

  function resolveEducationChoice(message: string) {
    setStatus(message)
    educationChoiceResolverRef.current?.()
  }

  function resolveInvestmentChoice(message: string) {
    setStatus(message)
    investmentChoiceResolverRef.current?.()
  }

  function buyOrUpgradeInvestmentCard(card: BusinessCard, tileId: number) {
    const result = purchaseBusinessCardForPlayer(currentPlayerIndex, card, tileId)

    if (result.success) {
      resolveInvestmentChoice(result.message)
      return
    }

    setStatus(result.message)
  }

  function getAiBusinessChoice(playerIndex: number, tileId: number) {
    const playerCash = cashRef.current[playerIndex]
    const cashReserve = Math.max(
      aiMinimumCashReserve,
      Math.round(getRawBusinessIncomeForPlayer(playerIndex) * 0.35),
    )

    return getBusinessCardsForTile(boardTiles[tileId])
      .map((card) => {
        const existingBusiness = businessesRef.current.find(
          (business) =>
            business.tileId === tileId &&
            business.cardId === card.id,
        )

        if (existingBusiness && existingBusiness.playerIndex !== playerIndex) {
          return null
        }

        if (existingBusiness && existingBusiness.level >= maxBusinessLevel) {
          return null
        }

        if (playerCash - card.price < cashReserve) {
          return null
        }

        const nextLevel = existingBusiness ? existingBusiness.level + 1 : 1
        const currentIncome = existingBusiness ? getBusinessHoldingIncome(existingBusiness) : 0
        const nextIncome = getBusinessIncomeAtLevel(card, nextLevel)
        const incomeGain = nextIncome - currentIncome

        if (incomeGain <= 0) {
          return null
        }

        return {
          card,
          tileId,
          incomeGain,
          score: incomeGain / card.price + (existingBusiness ? 0.005 : 0),
        }
      })
      .filter((choice): choice is NonNullable<typeof choice> => choice !== null)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        return right.incomeGain - left.incomeGain
      })[0] ?? null
  }

  function getAiLandReserve(playerIndex: number) {
    return Math.max(
      aiMinimumCashReserve * aiLandCashReserveMultiplier,
      Math.round(getRawBusinessIncomeForPlayer(playerIndex) * 0.6),
    )
  }

  function shouldAiBuyLand(playerIndex: number, tileId: number) {
    const tile = boardTiles[tileId]

    if (!tile.landPrice || landHoldingsRef.current.some((holding) => holding.tileId === tileId)) {
      return false
    }

    const playerCash = cashRef.current[playerIndex]
    const businessIncome = getRawBusinessIncomeForPlayer(playerIndex)
    const reserve = getAiLandReserve(playerIndex)

    if (businessIncome < aiLandMinimumBusinessIncome) {
      return false
    }

    if (playerCash < tile.landPrice * aiLandMinimumCashMultiple) {
      return false
    }

    if (playerCash - tile.landPrice < reserve) {
      return false
    }

    const tileBusinesses = businessesRef.current.filter((business) => business.tileId === tileId)
    const ownBusinessIncome = tileBusinesses
      .filter((business) => business.playerIndex === playerIndex)
      .reduce((total, business) => total + getBusinessHoldingIncome(business), 0)
    const tenantBusinessIncome = tileBusinesses
      .filter((business) => business.playerIndex !== playerIndex)
      .reduce((total, business) => total + getBusinessHoldingIncome(business), 0)
    const landingRentValue = Math.round(tile.landPrice * landRentRate)
    const leaseValue = Math.round(tenantBusinessIncome * openLeaseShareRate)
    const strategicValue = ownBusinessIncome > 0 ? Math.round(ownBusinessIncome * 0.04) : 0
    const projectedValue = landingRentValue + leaseValue + strategicValue
    const valueRatio = projectedValue / tile.landPrice

    return tenantBusinessIncome > 0 || ownBusinessIncome > 0 || valueRatio >= 0.035
  }

  async function applyAiLandChoice(playerIndex: number, tileId: number, runId: number) {
    if (!shouldAiBuyLand(playerIndex, tileId)) {
      return
    }

    const result = buyLandForPlayer(playerIndex, tileId)
    setStatus(
      result.success
        ? `AI land buyout: ${result.message}`
        : `${players[playerIndex].name} skipped land buyout. ${result.message}`,
    )
    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function applyAiBusinessChoice(playerIndex: number, tileId: number, context: string, runId: number) {
    const choice = getAiBusinessChoice(playerIndex, tileId)

    if (!choice) {
      setStatus(
        `${players[playerIndex].name} skipped ${context} at ${boardTiles[tileId].name} to keep cash reserve.`,
      )
      await wait(aiDelayMs)
      return
    }

    const result = purchaseBusinessCardForPlayer(playerIndex, choice.card, choice.tileId)
    setStatus(
      result.success
        ? `${context}: ${result.message}`
        : `${players[playerIndex].name} skipped ${context}. ${result.message}`,
    )
    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function applyAiInvestmentBankChoice(playerIndex: number, options: number[], runId: number) {
    const choice =
      options
        .map((tileId) => getAiBusinessChoice(playerIndex, tileId))
        .filter((option): option is NonNullable<typeof option> => option !== null)
        .sort((left, right) => {
          if (right.score !== left.score) {
            return right.score - left.score
          }

          return right.incomeGain - left.incomeGain
        })[0] ?? null

    if (!choice) {
      setStatus(`${players[playerIndex].name} skipped Investment Bank to keep cash reserve.`)
      await wait(aiDelayMs)
      return
    }

    const result = purchaseBusinessCardForPlayer(playerIndex, choice.card, choice.tileId)
    setStatus(
      result.success
        ? `Investment Bank AI choice: ${result.message}`
        : `${players[playerIndex].name} skipped Investment Bank. ${result.message}`,
    )
    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  function resolveInfluenceChoice(message: string) {
    setStatus(message)
    influenceChoiceResolverRef.current?.()
  }

  function buyInfluenceCard(card: InfluenceCard) {
    const playerIndex = currentPlayerIndex
    const playerCards = influenceHoldingsRef.current.filter(
      (holding) => holding.playerIndex === playerIndex,
    )

    if (playerCards.length >= maxInfluenceCards) {
      resolveInfluenceChoice(`${players[playerIndex].name} can hold only ${maxInfluenceCards} influence cards.`)
      return
    }

    const hasPrisonContactCoupon = prisonContactCouponsRef.current[playerIndex]
    const discount = hasPrisonContactCoupon ? Math.round(card.price * prisonContactDiscountRate) : 0
    const finalPrice = card.price - discount
    const playerCash = cashRef.current[playerIndex]

    if (playerCash < finalPrice) {
      resolveInfluenceChoice(
        `${players[playerIndex].name} needs ${formatMoney(finalPrice)} but only has ${formatMoney(playerCash)}.`,
      )
      return
    }

    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= finalPrice
    updateCash(nextCash)

    if (hasPrisonContactCoupon) {
      const nextCoupons = [...prisonContactCouponsRef.current]
      nextCoupons[playerIndex] = false
      updatePrisonContactCoupons(nextCoupons)
    }

    influenceCardIdRef.current += 1
    updateInfluenceHoldings([
      ...influenceHoldingsRef.current,
      {
        id: `${playerIndex}-${card.id}-${influenceCardIdRef.current}`,
        playerIndex,
        cardId: card.id,
        title: card.title,
        pricePaid: finalPrice,
        risk: card.risk,
        description: card.description,
        effect: card.effect,
      },
    ])
    resolveInfluenceChoice(
      `${players[playerIndex].name} bought ${card.title} for ${formatMoney(finalPrice)}${discount > 0 ? ` after ${formatMoney(discount)} Prison Contact discount` : ''}. It is now in their hand (${playerCards.length + 1}/${maxInfluenceCards}).`,
    )
  }

  function removeInfluenceCard(cardId: string) {
    updateInfluenceHoldings(
      influenceHoldingsRef.current.filter((holding) => holding.id !== cardId),
    )
    setInventoryDetail(null)
  }

  function resolveInfluenceJailRisk(playerIndex: number) {
    if (!rollInfluenceJailRisk()) {
      return ' Jail risk did not trigger.'
    }

    const nextPositions = [...positionsRef.current]
    nextPositions[playerIndex] = prisonTile
    updatePositions(nextPositions)

    const nextPrisonTurns = [...prisonTurnsRef.current]
    nextPrisonTurns[playerIndex] = Math.max(nextPrisonTurns[playerIndex], influenceJailTurns)
    updatePrisonTurns(nextPrisonTurns)

    return ` Jail risk triggered: ${players[playerIndex].name} was sent to ${boardTiles[prisonTile].name} for ${influenceJailTurns} skipped turns.`
  }

  function applyInfluenceCard(card: InfluenceHolding) {
    if (players[card.playerIndex].role !== 'Human') {
      setStatus('AI influence cards are manual-view only in Demo 1.')
      return
    }

    if (phase !== 'ready') {
      setStatus('Finish the current turn before using an influence card.')
      return
    }

    if (card.effect === 'eviction') {
      const hasTarget = businessesRef.current.some(
        (business) => business.playerIndex !== card.playerIndex,
      )

      if (!hasTarget) {
        setStatus('Influence Eviction needs at least one rival business on the board.')
        return
      }

      setEvictionCard(card)
      setInventoryDetail(null)
      setStatus('Choose one rival business to force closed.')
      return
    }

    if (card.effect === 'leasePressure') {
      updateLeasePressurePlayers(
        leasePressurePlayersRef.current.map((isPressured, playerIndex) =>
          playerIndex === card.playerIndex ? true : isPressured,
        ),
      )
      removeInfluenceCard(card.id)
      const riskText = resolveInfluenceJailRisk(card.playerIndex)
      setStatus(
        `${players[card.playerIndex].name} used Lease Pressure. Their next Open Lease collection is 20% instead of 10%.${riskText}`,
      )
      return
    }

    influenceCardIdRef.current += 1
    updateIncomeModifiers([
      ...incomeModifiersRef.current,
      {
        id: `${card.playerIndex}-${card.id}-port-${influenceCardIdRef.current}`,
        eventTitle: 'Port Connection',
        playerIndex: card.playerIndex,
        multiplier: 1.4,
        scope: 'industrial',
      },
    ])
    removeInfluenceCard(card.id)
    const riskText = resolveInfluenceJailRisk(card.playerIndex)
    setStatus(
      `${players[card.playerIndex].name} used Port Connection. Industrial and port income is 140% on the next tile 00 income collection.${riskText}`,
    )
  }

  function evictBusiness(card: InfluenceHolding, businessId: string) {
    const targetBusiness = businessesRef.current.find((business) => business.id === businessId)

    if (!targetBusiness || targetBusiness.playerIndex === card.playerIndex) {
      setStatus('That business can no longer be evicted.')
      setEvictionCard(null)
      return
    }

    const refund = Math.round(targetBusiness.pricePaid * 0.5)
    const nextCash = [...cashRef.current]
    nextCash[targetBusiness.playerIndex] += refund
    updateCash(nextCash)
    updateBusinesses(businessesRef.current.filter((business) => business.id !== businessId))
    removeInfluenceCard(card.id)
    setEvictionCard(null)
    const riskText = resolveInfluenceJailRisk(card.playerIndex)
    setStatus(
      `${players[card.playerIndex].name} used Influence Eviction on ${players[targetBusiness.playerIndex].name}'s ${targetBusiness.title} at ${boardTiles[targetBusiness.tileId].name}. The owner recovered ${formatMoney(refund)}.${riskText}`,
    )
  }

  function openInvestmentCards(tile: number) {
    setSelectedInvestmentTile(tile)
    setPhase('investment-card-choice')
    setStatus(`Choose an investment card for ${boardTiles[tile].name}, or skip.`)
  }

  function returnToInvestmentTileList() {
    setSelectedInvestmentTile(null)
    setPhase('investment-choice')
    setStatus('Investment Bank: choose another investment tile, or skip.')
  }

  function getStudyTuition(activeStudy: Exclude<ActiveStudy, 'none'>) {
    return educationTuition[activeStudy]
  }

  function startStudy(activeStudy: Exclude<ActiveStudy, 'none'>) {
    const playerIndex = educationPlayerIndex ?? currentPlayerIndex
    const tuition = getStudyTuition(activeStudy)
    const playerCash = cashRef.current[playerIndex]

    if (playerCash < tuition) {
      setStatus(
        `${players[playerIndex].name} needs ${formatMoney(tuition)} for ${activeStudy === 'bachelor' ? 'bachelor study' : 'master degree'} but only has ${formatMoney(playerCash)}.`,
      )
      return
    }

    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= tuition
    updateCash(nextCash)
    updateEducation({
      stage: educationRef.current.stage,
      activeStudy,
      skipTurns: studySkipTurns,
    })
    resolveEducationChoice(
      activeStudy === 'bachelor'
        ? `${players[playerIndex].name} paid ${formatMoney(tuition)} and started bachelor study at Burapha University. Skip ${studySkipTurns} turns, then business income becomes +${educationIncomeBonus.bachelorCompleted}%. Cash left: ${formatMoney(nextCash[playerIndex])}.`
        : `${players[playerIndex].name} paid ${formatMoney(tuition)} and started master degree at Burapha University. Skip ${studySkipTurns} turns, then business income becomes +${educationIncomeBonus.masterCompleted}%. Cash left: ${formatMoney(nextCash[playerIndex])}.`,
    )
  }

  function resetGame() {
    runIdRef.current += 1
    skipRequestedRef.current = true
    aiDelayResolverRef.current?.()
    cardChoiceResolverRef.current?.()
    educationChoiceResolverRef.current?.()
    investmentChoiceResolverRef.current?.()
    politicalEventResolverRef.current?.()
    influenceChoiceResolverRef.current?.()
    activeRunRef.current = false
    updatePositions(players.map(() => 0))
    updateEducation({
      stage: 'none',
      activeStudy: 'none',
      skipTurns: 0,
    })
    setBuraphaChoice(null)
    setEducationPlayerIndex(null)
    updateInvestmentVisits(players.map(() => 0))
    updateCash(players.map(() => startingCash))
    updateBusinesses([])
    updateLandHoldings([])
    updateIncomeModifiers([])
    updatePrisonJackpot(0)
    updatePrisonTurns(players.map(() => 0))
    updatePrisonContactCoupons(players.map(() => false))
    updateInfluenceHoldings([])
    updateLeasePressurePlayers(players.map(() => false))
    setInvestmentOffer(null)
    setSelectedInvestmentTile(null)
    setSelectedLandTile(null)
    setSelectedPoliticalEvent(null)
    setInfluenceOffer([])
    setEvictionCard(null)
    setCurrentPlayerIndex(0)
    setInventoryDetail(null)
    setIsNetWorthOpen(false)
    setIsWinnerDismissed(false)
    setIsDevMode(false)
    setPhase('ready')
    setLatestRoll(null)
    setStatus('Game reset. Roll to start the round.')
    setRollHistory([])
  }

  function clampInvestmentModalOffset(x: number, y: number) {
    const maxX = Math.max(120, window.innerWidth / 2 - 120)
    const maxY = Math.max(90, window.innerHeight / 2 - 90)

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }

  function startInvestmentModalDrag(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    investmentModalDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: investmentModalOffset.x,
      originY: investmentModalOffset.y,
    }
  }

  function moveInvestmentModal(event: PointerEvent<HTMLDivElement>) {
    const drag = investmentModalDragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    setInvestmentModalOffset(
      clampInvestmentModalOffset(
        drag.originX + event.clientX - drag.startX,
        drag.originY + event.clientY - drag.startY,
      ),
    )
  }

  function stopInvestmentModalDrag(event: PointerEvent<HTMLDivElement>) {
    if (investmentModalDragRef.current?.pointerId === event.pointerId) {
      investmentModalDragRef.current = null
    }
  }

  const primaryButtonText =
    phase === 'ready'
      ? 'Roll Dice'
      : phase === 'ai-delay'
        ? 'Fast Forward'
        : phase === 'card-choice'
          ? 'Choose Card'
          : phase === 'education-choice'
            ? 'Choose Option'
            : phase === 'study-skip'
              ? 'Studying'
              : phase === 'prison-skip'
                ? 'In Prison'
                : phase === 'investment-choice'
                  ? 'Choose Investment'
                  : phase === 'investment-card-choice'
                    ? 'Choose Plan'
                    : phase === 'political-event'
                      ? 'Event'
                      : phase === 'land-choice'
                        ? 'Buy Land'
                        : phase === 'influence-choice'
                          ? 'Choose Influence'
                          : 'Skip Move'
  const activeTile = boardTiles[positions[currentPlayerIndex]]
  const isInvestmentModalPhase =
    phase === 'investment-choice' || phase === 'investment-card-choice'
  const selectedLandTileData = selectedLandTile === null ? null : boardTiles[selectedLandTile]
  const selectedLandHolding =
    selectedLandTile === null ? undefined : landHoldingByTile[selectedLandTile]
  const selectedLandBusinesses =
    selectedLandTile === null ? [] : (businessesByTile[selectedLandTile] ?? [])
  const selectedLandOwnerBusinesses = selectedLandHolding
    ? selectedLandBusinesses.filter(
        (business) => business.playerIndex === selectedLandHolding.playerIndex,
      )
    : []
  const selectedLandTenantBusinesses = selectedLandHolding
    ? selectedLandBusinesses.filter(
        (business) => business.playerIndex !== selectedLandHolding.playerIndex,
      )
    : selectedLandBusinesses
  const selectedLandLeaseIncome = selectedLandTenantBusinesses.reduce(
    (total, business) =>
      total + Math.round(getBusinessHoldingIncome(business) * openLeaseShareRate),
    0,
  )
  const selectedLandRentDue = selectedLandTileData?.landPrice
    ? Math.round(selectedLandTileData.landPrice * landRentRate)
    : 0
  const selectedLandOwnerName = selectedLandHolding
    ? players[selectedLandHolding.playerIndex].name
    : 'Unowned'
  const selectedLandRentRuleText = selectedLandTileData?.landPrice
    ? `${Math.round(landRentRate * 100)}% of land price = ${formatMoney(selectedLandRentDue)}`
    : 'No rent rule on this tile'
  const businessCards = getBusinessCardsForTile(activeTile)
  const businessesOnActiveTile = businesses.filter((business) => business.tileId === activeTile.id)
  const selectedInvestmentTileData =
    selectedInvestmentTile === null ? null : boardTiles[selectedInvestmentTile]
  const investmentBusinessCards = selectedInvestmentTileData
    ? getBusinessCardsForTile(selectedInvestmentTileData)
    : []
  const businessesOnInvestmentTile =
    selectedInvestmentTile === null
      ? []
      : businesses.filter((business) => business.tileId === selectedInvestmentTile)
  const netWorthRows = players
    .map((player, playerIndex) => {
      const playerBusinesses = businesses.filter(
        (business) => business.playerIndex === playerIndex,
      )
      const businessValue = playerBusinesses.reduce(
        (total, business) => total + business.pricePaid,
        0,
      )
      const landValue = landHoldings
        .filter((holding) => holding.playerIndex === playerIndex)
        .reduce((total, holding) => total + holding.pricePaid, 0)
      const influenceValue = influenceHoldings
        .filter((holding) => holding.playerIndex === playerIndex)
        .reduce((total, holding) => total + holding.pricePaid, 0)
      const income = playerBusinesses.reduce(
        (total, business) => total + getBusinessHoldingIncome(business),
        0,
      )
      const total = cash[playerIndex] + businessValue + landValue + influenceValue

      return {
        player,
        playerIndex,
        cash: cash[playerIndex],
        businessValue,
        landValue,
        influenceValue,
        income,
        total,
      }
    })
    .sort((a, b) => b.total - a.total)
  const winnerRow =
    !isWinnerDismissed && netWorthRows[0]?.total >= netWorthWinTarget ? netWorthRows[0] : null

  const selectedPlayer = players[selectedPlayerIndex]
  const selectedPlayerBusinesses = businesses.filter(
    (business) => business.playerIndex === selectedPlayerIndex,
  )
  const selectedPlayerLandHoldings = landHoldings.filter(
    (holding) => holding.playerIndex === selectedPlayerIndex,
  )
  const selectedPlayerInfluenceCards = influenceHoldings.filter(
    (holding) => holding.playerIndex === selectedPlayerIndex,
  )
  const selectedPlayerIncomeModifiers = incomeModifiers.filter(
    (modifier) => modifier.playerIndex === selectedPlayerIndex,
  )
  const selectedPlayerIncome = selectedPlayerBusinesses.reduce(
    (total, business) => total + getBusinessHoldingIncome(business),
    0,
  )
  const selectedPlayerIncomeModifiersForPreview = incomeModifiers.filter(
    (modifier) => modifier.playerIndex === selectedPlayerIndex,
  )
  const selectedPlayerBusinessIncomesAtBank = selectedPlayerBusinesses.map((business) => {
    const baseIncome = getBusinessHoldingIncome(business)
    const modifiedIncome = selectedPlayerIncomeModifiersForPreview
      .filter((modifier) => isBusinessInScope(business, modifier.scope))
      .reduce((income, modifier) => Math.round(income * modifier.multiplier), baseIncome)

    return {
      business,
      income: modifiedIncome,
    }
  })
  const selectedPlayerBusinessIncomeAtBank = selectedPlayerBusinessIncomesAtBank.reduce(
    (total, item) => total + item.income,
    0,
  )
  const selectedPlayerEducationBonusRate =
    selectedPlayer.role === 'Human' && education.stage === 'masterCompleted'
      ? educationIncomeBonus.masterCompleted / 100
      : selectedPlayer.role === 'Human' && education.stage === 'bachelorCompleted'
        ? educationIncomeBonus.bachelorCompleted / 100
        : 0
  const selectedPlayerEducationBonusAtBank = Math.round(
    selectedPlayerBusinessIncomeAtBank * selectedPlayerEducationBonusRate,
  )
  const selectedPlayerLeaseShareTotalAtBank = selectedPlayerBusinessIncomesAtBank.reduce(
    (total, item) => {
      const landHolding = landHoldings.find((holding) => holding.tileId === item.business.tileId)

      if (!landHolding || landHolding.playerIndex === selectedPlayerIndex) {
        return total
      }

      const rate = leasePressurePlayers[landHolding.playerIndex]
        ? openLeaseShareRate * 2
        : openLeaseShareRate

      return total + Math.round(item.income * rate)
    },
    0,
  )
  const selectedPlayerEstimatedBankIncome =
    passStartIncome +
    selectedPlayerBusinessIncomeAtBank +
    selectedPlayerEducationBonusAtBank -
    selectedPlayerLeaseShareTotalAtBank
  const selectedPrisonStatus =
    prisonTurns[selectedPlayerIndex] > 0
      ? `In prison: ${prisonTurns[selectedPlayerIndex]} skipped turns left`
      : 'Free'
  const selectedPrisonCouponStatus = prisonContactCoupons[selectedPlayerIndex]
    ? `${Math.round(prisonContactDiscountRate * 100)}% influence discount ready`
    : 'No coupon'
  const selectedInventoryBusiness =
    inventoryDetail?.kind === 'business'
      ? selectedPlayerBusinesses.find((business) => business.id === inventoryDetail.id)
      : null
  const selectedInventoryLand =
    inventoryDetail?.kind === 'land'
      ? selectedPlayerLandHoldings.find((holding) => holding.tileId === inventoryDetail.tileId)
      : null
  const selectedInventoryInfluence =
    inventoryDetail?.kind === 'influence'
      ? selectedPlayerInfluenceCards.find((card) => card.id === inventoryDetail.id)
      : null
  const selectedInventoryBusinessTile = selectedInventoryBusiness
    ? boardTiles[selectedInventoryBusiness.tileId]
    : null
  const selectedInventoryBusinessLandHolding = selectedInventoryBusiness
    ? landHoldingByTile[selectedInventoryBusiness.tileId]
    : undefined
  const selectedInventoryBusinessIsTenant =
    Boolean(selectedInventoryBusiness && selectedInventoryBusinessLandHolding) &&
    selectedInventoryBusinessLandHolding?.playerIndex !== selectedInventoryBusiness?.playerIndex
  const selectedInventoryBusinessLeaseShare = selectedInventoryBusinessIsTenant && selectedInventoryBusiness
    ? Math.round(getBusinessHoldingIncome(selectedInventoryBusiness) * openLeaseShareRate)
    : 0
  const selectedInventoryLandBusinesses = selectedInventoryLand
    ? (businessesByTile[selectedInventoryLand.tileId] ?? [])
    : []
  const selectedInventoryLandOwnerBusinesses = selectedInventoryLandBusinesses.filter(
    (business) => business.playerIndex === selectedPlayerIndex,
  )
  const selectedInventoryLandTenantBusinesses = selectedInventoryLandBusinesses.filter(
    (business) => business.playerIndex !== selectedPlayerIndex,
  )
  const selectedInventoryLandLeaseIncome = selectedInventoryLandTenantBusinesses.reduce(
    (total, business) =>
      total + Math.round(getBusinessHoldingIncome(business) * openLeaseShareRate),
    0,
  )
  const bachelorTuition = getStudyTuition('bachelor')
  const masterTuition = getStudyTuition('master')
  const activeEducationPlayerIndex = educationPlayerIndex ?? currentPlayerIndex
  const activeEducationCash = cash[activeEducationPlayerIndex]
  const canAffordBachelorStudy = activeEducationCash >= bachelorTuition
  const canAffordMasterStudy = activeEducationCash >= masterTuition
  const evictionTargets = evictionCard
    ? businesses.filter((business) => business.playerIndex !== evictionCard.playerIndex)
    : []
  const selectedEducationStatus =
    selectedPlayer.role === 'Human'
      ? education.activeStudy === 'bachelor'
        ? `Bachelor study: ${education.skipTurns} skipped turn left`
        : education.activeStudy === 'master'
          ? `Master study: ${education.skipTurns} skipped turn left`
          : education.stage === 'masterCompleted'
            ? `Master completed: +${educationIncomeBonus.masterCompleted}% income`
            : education.stage === 'bachelorCompleted'
              ? `Bachelor completed: +${educationIncomeBonus.bachelorCompleted}% income`
              : 'Not enrolled'
      : 'No education track'

  return (
    <main className={`game-shell ${isLedgerVisible ? '' : 'board-focus'}`}>
      <button
        className="ledger-toggle"
        type="button"
        onClick={() => setIsLedgerVisible((value) => !value)}
      >
        {isLedgerVisible ? 'Hide Info' : 'Show Info'}
      </button>

      <div className={`game-layout ${isLedgerVisible ? '' : 'ledger-collapsed'}`}>
        <section className="board" aria-label="Monopoly style board prototype">
          {Array.from({ length: tileCount }, (_, tile) => {
            const occupants = tileOccupants[tile] ?? []
            const tileBusinesses = businessesByTile[tile] ?? []
            const tileBusinessMarkers = Object.values(
              tileBusinesses.reduce<
                Record<number, { playerIndex: number; count: number; maxLevel: number; titles: string[] }>
              >((groups, business) => {
                const current = groups[business.playerIndex] ?? {
                  playerIndex: business.playerIndex,
                  count: 0,
                  maxLevel: 0,
                  titles: [],
                }

                groups[business.playerIndex] = {
                  playerIndex: business.playerIndex,
                  count: current.count + 1,
                  maxLevel: Math.max(current.maxLevel, business.level),
                  titles: [...current.titles, `${business.title} Lv.${business.level}`],
                }

                return groups
              }, {}),
            )
            const landHolding = landHoldingByTile[tile]
            const isCorner = tile === 0 || tile === 10 || tile === 20 || tile === 30
            const tileData = boardTiles[tile]

            return (
              <div
                className={`tile tile-${tileData.category} ${isCorner ? 'corner-tile' : ''} ${tile === 0 ? 'start-tile' : ''}`}
                key={tile}
                onClick={() => openLandDetail(tile)}
                style={getTileGridPosition(tile)}
              >
                <span className="tile-number">{tile.toString().padStart(2, '0')}</span>
                <span className="tile-name">{tileData.name}</span>
                {tileData.landPrice && (
                  <span className="land-price">{formatCompactMoney(tileData.landPrice)}</span>
                )}
                {landHolding && (
                  <span
                    className={`land-owner ${players[landHolding.playerIndex].colorClass}`}
                    title={`Land owner: ${players[landHolding.playerIndex].name}`}
                  >
                    Owner {players[landHolding.playerIndex].name}
                  </span>
                )}
                {tileBusinessMarkers.length > 0 && (
                  <div className="business-markers" aria-label={`Businesses on ${tileData.name}`}>
                    {tileBusinessMarkers.map((marker) => {
                      const owner = players[marker.playerIndex]

                      return (
                        <span
                          className={`business-marker ${owner.colorClass}`}
                          key={`${tile}-${marker.playerIndex}`}
                          title={`${owner.name}: ${marker.titles.join(', ')}`}
                        >
                          {marker.count > 1 ? `${marker.count}x` : marker.maxLevel}
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="tokens">
                  {occupants.map((playerIndex) => {
                    const player = players[playerIndex]

                    return (
                      <span
                        aria-label={`${player.name} on tile ${tile}`}
                        className={`token ${player.shape} ${player.colorClass}`}
                        key={player.id}
                        title={`${player.name} - Tile ${tile}`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="turn-console">
          <div>
            <p className="eyebrow">Demo 0.1</p>
            <h1>Monopoly Movement Prototype</h1>
          </div>

          <div className="turn-display">
            <span>Turn</span>
            <strong>{players[currentPlayerIndex].name}</strong>
          </div>

          <div className="dice-row" aria-label="Latest dice roll">
            <div className="die">{latestRoll?.die1 ?? '-'}</div>
            <div className="die">{latestRoll?.die2 ?? '-'}</div>
            <div className="total">Total {latestRoll?.total ?? '-'}</div>
          </div>

          <button
            className="primary-action"
            type="button"
            disabled={
              phase === 'card-choice' ||
              phase === 'education-choice' ||
              phase === 'study-skip' ||
              phase === 'prison-skip' ||
              phase === 'investment-choice' ||
              phase === 'investment-card-choice' ||
              phase === 'political-event' ||
              phase === 'land-choice' ||
              phase === 'influence-choice'
            }
            onClick={handlePrimaryAction}
          >
            {primaryButtonText}
          </button>

          <div className="console-actions">
            <button className="secondary-action" type="button" onClick={resetGame}>
              Reset
            </button>
            <button className="secondary-action" type="button" onClick={() => setIsDevMode((value) => !value)}>
              {isDevMode ? 'Dev On' : 'Dev Mode'}
            </button>
          </div>

          {isDevMode && (
            <div className="dev-tools">
              <div className="test-move-panel" aria-label="Prototype test move controls">
                <span>Test Move</span>
                <div>
                  {testMoveOptions.map((steps) => (
                    <button
                      disabled={phase !== 'ready'}
                      key={steps}
                      type="button"
                      onClick={() => handleTestMove(steps)}
                    >
                      {steps}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dev-cash-panel" aria-label="Prototype cash controls">
                <span>Dev Cash</span>
                <div>
                  {devCashOptions.map((amount) => (
                    <button key={amount} type="button" onClick={() => addDevCashToPlayer(amount)}>
                      +{amount >= 1000000 ? '1M' : `${amount / 1000}K`}
                    </button>
                  ))}
                  <button type="button" onClick={() => addDevCashToAll(devAllCashAmount)}>
                    All +500K
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="status-text">{status}</p>

          <div className="jackpot-summary" aria-label="Prison Jackpot">
            <span>Prison Jackpot</span>
            <strong>{formatMoney(prisonJackpot)}</strong>
          </div>

          <button className="net-worth-button" type="button" onClick={() => setIsNetWorthOpen(true)}>
            <span>Net Worth</span>
            <strong>{players[netWorthRows[0].playerIndex].name}</strong>
            <em>{formatMoney(netWorthRows[0].total)}</em>
          </button>

          <div className="compact-tile-summary" aria-label="Current tile summary">
            <span>{activeTile.id.toString().padStart(2, '0')}</span>
            <strong>{activeTile.name}</strong>
          </div>

          </div>
        </section>

        <aside
          aria-hidden={!isLedgerVisible}
          className={`player-ledger ${isLedgerVisible ? '' : 'is-hidden'}`}
          aria-label="Player details"
        >
          <div className="player-tabs" role="tablist" aria-label="Players">
            {players.map((player, index) => (
              <button
                aria-selected={selectedPlayerIndex === index}
                className={selectedPlayerIndex === index ? 'active' : ''}
                key={player.id}
                onClick={() => {
                  setSelectedPlayerIndex(index)
                  setInventoryDetail(null)
                }}
                role="tab"
                type="button"
              >
                <span className={`token ledger-token ${player.shape} ${player.colorClass}`} />
                {player.name}
              </button>
            ))}
          </div>

          <div className="player-card">
            <div className="player-card-header">
              <span className={`token ledger-token ${selectedPlayer.shape} ${selectedPlayer.colorClass}`} />
              <div>
                <span>{selectedPlayer.role}</span>
                <strong>{selectedPlayer.name}</strong>
              </div>
            </div>

            <div className="ledger-stats">
              <div>
                <span>Cash</span>
                <strong>{formatMoney(cash[selectedPlayerIndex])}</strong>
              </div>
              <div>
                <span>Business income</span>
                <strong>{formatMoney(selectedPlayerIncome)}</strong>
              </div>
            </div>

            <div className="ledger-section">
              <span>Education</span>
              <strong>{selectedEducationStatus}</strong>
            </div>

            <div className="ledger-section income-breakdown">
              <span>Estimated Tile 00 Income</span>
              <strong>{formatMoney(selectedPlayerEstimatedBankIncome)}</strong>
              <div>
                <span>Base</span>
                <em>{formatMoney(passStartIncome)}</em>
              </div>
              <div>
                <span>Business</span>
                <em>{formatMoney(selectedPlayerBusinessIncomeAtBank)}</em>
              </div>
              <div>
                <span>Education bonus</span>
                <em>+{formatMoney(selectedPlayerEducationBonusAtBank)}</em>
              </div>
              <div>
                <span>Open Lease paid</span>
                <em>-{formatMoney(selectedPlayerLeaseShareTotalAtBank)}</em>
              </div>
            </div>

            <div className="ledger-section">
              <span>Next Income Event</span>
              {selectedPlayerIncomeModifiers.length === 0 && !leasePressurePlayers[selectedPlayerIndex] ? (
                <p>No active event.</p>
              ) : (
                <>
                  {selectedPlayerIncomeModifiers.map((modifier) => (
                    <p key={modifier.id}>
                      {modifier.eventTitle}: {Math.round(modifier.multiplier * 100)}% on {modifier.scope}
                    </p>
                  ))}
                  {leasePressurePlayers[selectedPlayerIndex] && (
                    <p>Lease Pressure: next Open Lease collection is 20%</p>
                  )}
                </>
              )}
            </div>

            <div className="inventory-panel" aria-label={`${selectedPlayer.name} card inventory`}>
              <section className="inventory-section property-inventory-section">
                <div className="inventory-heading">
                  <span>Property Cards</span>
                  <strong>{selectedPlayerBusinesses.length + selectedPlayerLandHoldings.length}</strong>
                </div>
                <div className="mini-card-list property-card-list">
                  {selectedPlayerBusinesses.map((business) => (
                    <button
                      className="mini-card business-mini-card"
                      key={business.id}
                      type="button"
                      onClick={() => setInventoryDetail({ kind: 'business', id: business.id })}
                    >
                      <strong>{business.title}</strong>
                      <span>
                        {boardTiles[business.tileId].id.toString().padStart(2, '0')} | Lv.{business.level}
                      </span>
                      <em>{formatMoney(getBusinessHoldingIncome(business))} / round</em>
                    </button>
                  ))}
                  {selectedPlayerLandHoldings.map((holding) => (
                    <button
                      className="mini-card land-mini-card"
                      key={holding.tileId}
                      type="button"
                      onClick={() => setInventoryDetail({ kind: 'land', tileId: holding.tileId })}
                    >
                      <strong>{boardTiles[holding.tileId].name}</strong>
                      <span>{boardTiles[holding.tileId].id.toString().padStart(2, '0')} | Land</span>
                      <em>{formatMoney(holding.pricePaid)}</em>
                    </button>
                  ))}
                  {selectedPlayerBusinesses.length === 0 && selectedPlayerLandHoldings.length === 0 && (
                    <p className="inventory-empty">No property cards.</p>
                  )}
                </div>
              </section>

              <div className="lower-inventory-grid">
                <section className="inventory-section">
                  <div className="inventory-heading">
                    <span>Influence Cards</span>
                    <strong>{selectedPlayerInfluenceCards.length}/{maxInfluenceCards}</strong>
                  </div>
                  <div className="mini-card-list influence-slot-list">
                    {selectedPlayerInfluenceCards.map((card) => (
                      <button
                        className="mini-card influence-mini-card"
                        key={card.id}
                        type="button"
                        onClick={() => setInventoryDetail({ kind: 'influence', id: card.id })}
                      >
                        <strong>{card.title}</strong>
                        <span>{card.risk}</span>
                        <em>Paid {formatMoney(card.pricePaid)}</em>
                      </button>
                    ))}
                    {Array.from({
                      length: Math.max(maxInfluenceCards - selectedPlayerInfluenceCards.length, 0),
                    }).map((_, index) => (
                      <div className="mini-card empty-slot" key={`empty-influence-${index}`}>
                        <strong>Empty slot</strong>
                        <span>Influence card</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="inventory-section">
                  <div className="inventory-heading">
                    <span>Prison Cards</span>
                    <strong>{prisonContactCoupons[selectedPlayerIndex] ? 1 : 0}</strong>
                  </div>
                  <div className="mini-card-list prison-slot-list">
                    <button
                      className={`mini-card ${
                        prisonContactCoupons[selectedPlayerIndex]
                          ? 'coupon-mini-card'
                          : 'prison-mini-card'
                      }`}
                      type="button"
                      onClick={() =>
                        setInventoryDetail(
                          prisonContactCoupons[selectedPlayerIndex]
                            ? { kind: 'prisonCoupon' }
                            : { kind: 'prisonStatus' },
                        )
                      }
                    >
                      <strong>
                        {prisonContactCoupons[selectedPlayerIndex]
                          ? 'Prison Coupon'
                          : 'Prison Status'}
                      </strong>
                      <span>
                        {prisonContactCoupons[selectedPlayerIndex]
                          ? `${Math.round(prisonContactDiscountRate * 100)}% influence discount`
                          : selectedPrisonStatus}
                      </span>
                      <em>Jackpot {formatMoney(prisonJackpot)}</em>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </aside>

        {(phase === 'card-choice' ||
          phase === 'education-choice' ||
          phase === 'investment-choice' ||
          phase === 'investment-card-choice' ||
          phase === 'political-event' ||
          phase === 'land-choice' ||
          phase === 'influence-choice') && (
          <div className="choice-modal-backdrop">
            <div
              className={`choice-modal ${isInvestmentModalPhase ? 'draggable-choice-modal' : ''}`}
              role="dialog"
              aria-modal="true"
              style={
                isInvestmentModalPhase
                  ? {
                      transform: `translate(${investmentModalOffset.x}px, ${investmentModalOffset.y}px)`,
                    }
                  : undefined
              }
            >
          {isInvestmentModalPhase && (
            <div
              aria-label="Drag investment window"
              className="modal-drag-handle"
              onPointerCancel={stopInvestmentModalDrag}
              onPointerDown={startInvestmentModalDrag}
              onPointerMove={moveInvestmentModal}
              onPointerUp={stopInvestmentModalDrag}
              role="button"
              tabIndex={0}
              title="Drag to move this window"
            >
              <span>Move window</span>
              <strong>Drag to view the board</strong>
            </div>
          )}
          {phase === 'card-choice' && (
            <div className="card-choice" aria-label="Action card choices">
              <span>Choose one business card</span>
              <div className="action-cards">
                {businessCards.map((card) => {
                  const existingBusiness = businessesOnActiveTile.find(
                    (business) => business.cardId === card.id,
                  )
                  const isOwnedByCurrentPlayer = existingBusiness?.playerIndex === currentPlayerIndex
                  const isOwnedByRival = Boolean(existingBusiness && !isOwnedByCurrentPlayer)
                  const nextLevel = existingBusiness ? existingBusiness.level + 1 : 1
                  const isMaxLevel = Boolean(
                    existingBusiness && existingBusiness.level >= maxBusinessLevel,
                  )
                  const canAfford = cash[currentPlayerIndex] >= card.price
                  const nextIncome = getBusinessIncomeAtLevel(
                    card,
                    Math.min(nextLevel, maxBusinessLevel),
                  )

                  return (
                    <button
                      className="action-card"
                      disabled={!canAfford || isMaxLevel || isOwnedByRival}
                      key={card.id}
                      type="button"
                      onClick={() => buyOrUpgradeBusinessCard(card)}
                    >
                      <strong>{card.title}</strong>
                      <span>
                        {isOwnedByRival
                          ? `Owned by ${players[existingBusiness!.playerIndex].name}`
                          : existingBusiness
                            ? `Current Lv.${existingBusiness.level}`
                            : 'New business'}
                      </span>
                      <span>
                        {isOwnedByRival
                          ? 'Unavailable'
                          : isMaxLevel
                            ? 'Max Level'
                            : `${existingBusiness ? 'Upgrade' : 'Cost'} ${formatMoney(card.price)}`}
                      </span>
                      <span>
                        {isMaxLevel
                          ? `Income ${formatMoney(getBusinessIncomeAtLevel(card, maxBusinessLevel))} / round`
                          : `Next income ${formatMoney(nextIncome)} / round`}
                      </span>
                      <p>{card.description}</p>
                      {!canAfford && !isMaxLevel && <em>Not enough cash</em>}
                      {isOwnedByRival && <em>This stall is already owned</em>}
                    </button>
                  )
                })}
              </div>
              <button
                className="skip-card"
                type="button"
                onClick={() => resolveCardChoice('Skipped card choice.')}
              >
                ไม่เล่นการ์ด
              </button>
            </div>
          )}

          {phase === 'investment-choice' && investmentOffer && (
            <div className="investment-choice" aria-label="Investment Bank choices">
              <span>Investment Bank</span>
              <div className="investment-card">
                <strong>Investment right #{investmentOffer.visitCount}</strong>
                <p>
                  Choose any normal tile from 01-{investmentOffer.maxTile.toString().padStart(2, '0')}.
                  Special tiles are excluded.
                </p>
                <div className="investment-options">
                  {investmentOffer.options.map((tile) => (
                    <button
                      key={tile}
                      type="button"
                      onClick={() => openInvestmentCards(tile)}
                    >
                      <span>{tile.toString().padStart(2, '0')}</span>
                      <strong>{boardTiles[tile].name}</strong>
                    </button>
                  ))}
                </div>
                <button
                  className="skip-investment"
                  type="button"
                  onClick={() => resolveInvestmentChoice('Skipped Investment Bank choice.')}
                >
                  Skip investment
                </button>
              </div>
            </div>
          )}

          {phase === 'investment-card-choice' && selectedInvestmentTile !== null && (
            <div className="investment-plan-choice" aria-label="Investment card choices">
              <span>Invest at {selectedInvestmentTile.toString().padStart(2, '0')}</span>
              <div className="investment-plan-card">
                <strong>{boardTiles[selectedInvestmentTile].name}</strong>
                <p>{boardTiles[selectedInvestmentTile].description}</p>
                <div className="investment-plans">
                  {investmentBusinessCards.map((card) => {
                    const existingBusiness = businessesOnInvestmentTile.find(
                      (business) => business.cardId === card.id,
                    )
                    const isOwnedByCurrentPlayer = existingBusiness?.playerIndex === currentPlayerIndex
                    const isOwnedByRival = Boolean(existingBusiness && !isOwnedByCurrentPlayer)
                    const nextLevel = existingBusiness ? existingBusiness.level + 1 : 1
                    const isMaxLevel = Boolean(
                      existingBusiness && existingBusiness.level >= maxBusinessLevel,
                    )
                    const canAfford = cash[currentPlayerIndex] >= card.price
                    const nextIncome = getBusinessIncomeAtLevel(
                      card,
                      Math.min(nextLevel, maxBusinessLevel),
                    )

                    return (
                      <button
                        disabled={!canAfford || isMaxLevel || isOwnedByRival}
                        key={card.id}
                        type="button"
                        onClick={() => buyOrUpgradeInvestmentCard(card, selectedInvestmentTile)}
                      >
                        <strong>{card.title}</strong>
                        <span>
                          {isOwnedByRival
                            ? `Owned by ${players[existingBusiness!.playerIndex].name}`
                            : existingBusiness
                              ? `Current Lv.${existingBusiness.level}`
                              : 'New business'}
                        </span>
                        <span>
                          {isOwnedByRival
                            ? 'Unavailable'
                            : isMaxLevel
                              ? 'Max Level'
                              : `${existingBusiness ? 'Upgrade' : 'Cost'} ${formatMoney(card.price)}`}
                        </span>
                        <span>
                          {isMaxLevel
                            ? `Income ${formatMoney(getBusinessIncomeAtLevel(card, maxBusinessLevel))} / round`
                            : `Next income ${formatMoney(nextIncome)} / round`}
                        </span>
                        <p>{card.description}</p>
                        {!canAfford && !isMaxLevel && <em>Not enough cash</em>}
                        {isOwnedByRival && <em>This stall is already owned</em>}
                      </button>
                    )
                  })}
                </div>
                <div className="investment-plan-actions">
                  <button type="button" onClick={returnToInvestmentTileList}>
                    Back to tile list
                  </button>
                  <button
                    className="skip-investment"
                    type="button"
                    onClick={() =>
                      resolveInvestmentChoice(
                        `Skipped Investment Bank choice after viewing ${selectedInvestmentTile.toString().padStart(2, '0')} ${boardTiles[selectedInvestmentTile].name}.`,
                      )
                    }
                  >
                    Skip investment
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'influence-choice' && (
            <div className="influence-choice" aria-label="Local Power Broker card choices">
              <span>Local Power Broker</span>
              <div className="influence-card">
                <strong>Choose one influence card</strong>
                <p>Buy one card to keep in hand. You can hold up to {maxInfluenceCards} influence cards. Risk happens later when the card is used.</p>
                <div className="influence-cards">
                  {influenceOffer.map((card) => {
                    const playerCardCount = influenceHoldings.filter(
                      (holding) => holding.playerIndex === currentPlayerIndex,
                    ).length
                    const hasCoupon = prisonContactCoupons[currentPlayerIndex]
                    const discount = hasCoupon ? Math.round(card.price * prisonContactDiscountRate) : 0
                    const finalPrice = card.price - discount
                    const canAfford = cash[currentPlayerIndex] >= finalPrice
                    const handFull = playerCardCount >= maxInfluenceCards

                    return (
                      <button
                        disabled={!canAfford || handFull}
                        key={card.id}
                        type="button"
                        onClick={() => buyInfluenceCard(card)}
                      >
                        <strong>{card.title}</strong>
                        <span>
                          Price {formatMoney(finalPrice)}
                          {discount > 0 ? ` (-${formatMoney(discount)})` : ''}
                        </span>
                        <span>{card.risk}</span>
                        <p>{card.description}</p>
                        {!canAfford && <em>Not enough cash</em>}
                        {handFull && <em>Influence hand is full</em>}
                      </button>
                    )
                  })}
                </div>
                <button
                  className="skip-influence"
                  type="button"
                  onClick={() => resolveInfluenceChoice('Walked away from Local Power Broker.')}
                >
                  Walk away
                </button>
              </div>
            </div>
          )}

          {phase === 'political-event' && selectedPoliticalEvent && (
            <div className="political-event-choice" aria-label="Political Event">
              <span>Political Event</span>
              <div className={`political-event-card event-${selectedPoliticalEvent.tone}`}>
                <strong>{selectedPoliticalEvent.title}</strong>
                <p>{selectedPoliticalEvent.description}</p>
                <div className="event-effect">
                  <span>Effect</span>
                  <strong>{selectedPoliticalEvent.effectText}</strong>
                </div>
                {selectedPoliticalEvent.jackpotClaim && (
                  <div className="event-effect">
                    <span>Current Jackpot</span>
                    <strong>{formatMoney(prisonJackpot)}</strong>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    resolvePoliticalEvent(`Political Event resolved: ${selectedPoliticalEvent.title}.`)
                  }
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {phase === 'land-choice' && (
            <div className="land-choice" aria-label="Land purchase choice">
              <span>Land Buyout</span>
              <div className="land-buy-card">
                <strong>{selectedLandTileData?.name ?? 'No land selected'}</strong>
                <p>{selectedLandTileData?.description ?? 'Choose a board tile to inspect land details.'}</p>
                <div className="land-buy-price">
                  <span>Buyout Price</span>
                  <strong>
                    {selectedLandTileData?.landPrice
                      ? formatMoney(selectedLandTileData.landPrice)
                      : 'Not purchasable'}
                  </strong>
                </div>
                <div className="land-rule-grid">
                  <div>
                    <span>Current Owner</span>
                    <strong>{selectedLandOwnerName}</strong>
                    <p>
                      {selectedLandHolding
                        ? `Owned by ${selectedLandOwnerName}. Other players pay landing rent here.`
                        : 'No owner yet. Buying this land makes future visitors pay rent to the buyer.'}
                    </p>
                  </div>
                  <div>
                    <span>Landing Rent</span>
                    <strong>{selectedLandRentRuleText}</strong>
                    <p>Paid immediately when another player lands on this owned tile.</p>
                  </div>
                  <div>
                    <span>Open Lease Rule</span>
                    <strong>{Math.round(openLeaseShareRate * 100)}% of tenant income</strong>
                    <p>Paid when tenant businesses collect income at tile 00.</p>
                  </div>
                  <div>
                    <span>Projected Open Lease</span>
                    <strong>{formatMoney(selectedLandLeaseIncome)} / round</strong>
                    <p>
                      {selectedLandTenantBusinesses.length > 0
                        ? 'Based on businesses on this tile that are not owned by the land owner.'
                        : 'No tenant business income on this tile yet.'}
                    </p>
                  </div>
                </div>
                <div className="land-business-summary">
                  <div>
                    <span>Businesses on this tile</span>
                    <strong>{selectedLandBusinesses.length}</strong>
                  </div>
                  {selectedLandHolding && (
                    <div>
                      <span>Expected Open Lease</span>
                      <strong>{formatMoney(selectedLandLeaseIncome)} / round</strong>
                    </div>
                  )}
                </div>
                {selectedLandOwnerBusinesses.length > 0 && (
                  <div className="tenant-list">
                    <strong>Owner Business</strong>
                    {selectedLandOwnerBusinesses.map((business) => (
                      <span key={business.id}>
                        {business.title} | Lv.{business.level} |{' '}
                        {formatMoney(getBusinessHoldingIncome(business))} / round
                      </span>
                    ))}
                  </div>
                )}
                {selectedLandTenantBusinesses.length > 0 && (
                  <div className="tenant-list">
                    <strong>{selectedLandHolding ? 'Tenant Business' : 'Existing Business'}</strong>
                    {selectedLandTenantBusinesses.map((business) => (
                      <span key={business.id}>
                        {players[business.playerIndex].name}: {business.title} | Lv.{business.level} |{' '}
                        {formatMoney(getBusinessHoldingIncome(business))} / round
                        {selectedLandHolding &&
                          ` | Open Lease ${formatMoney(
                            Math.round(getBusinessHoldingIncome(business) * openLeaseShareRate),
                          )}`}
                      </span>
                    ))}
                  </div>
                )}
                <div className="land-buy-actions">
                  <button
                    disabled={
                      !selectedLandTileData?.landPrice ||
                      Boolean(selectedLandHolding) ||
                      cash[currentPlayerIndex] < selectedLandTileData.landPrice
                    }
                    type="button"
                    onClick={buyCurrentLand}
                  >
                    Buy Land
                  </button>
                  <button
                    className="land-skip"
                    type="button"
                    onClick={() => closeLandDetail()}
                  >
                    Close
                  </button>
                </div>
                {selectedLandTileData?.landPrice &&
                  !selectedLandHolding &&
                  cash[currentPlayerIndex] < selectedLandTileData.landPrice && (
                  <em>
                    Need {formatMoney(selectedLandTileData.landPrice)}, cash{' '}
                    {formatMoney(cash[currentPlayerIndex])}
                  </em>
                )}
              </div>
            </div>
          )}

          {phase === 'education-choice' && buraphaChoice && (
            <div className="education-choice" aria-label="Burapha University choice">
              <span>Burapha University</span>
              <div className="education-card">
                {buraphaChoice === 'bachelor' && (
                  <>
                    <strong>เรียนต่อไหม?</strong>
                    <p>ถ้าเลือกเรียนต่อ ผู้เล่นจะข้ามคิวตัวเอง 5 ครั้ง แล้วรายได้ธุรกิจทั้งหมดจะเพิ่ม 15%</p>
                    <p>Tuition: {formatMoney(bachelorTuition)} | Cash: {formatMoney(activeEducationCash)}</p>
                    {!canAffordBachelorStudy && (
                      <div className="education-warning" role="alert">
                        เงินไม่พอเรียนต่อ ต้องมี {formatMoney(bachelorTuition)} แต่ตอนนี้มี{' '}
                        {formatMoney(activeEducationCash)}
                      </div>
                    )}
                    <div className="education-actions">
                      <button
                        disabled={!canAffordBachelorStudy}
                        type="button"
                        onClick={() => startStudy('bachelor')}
                      >
                        เรียนต่อ
                      </button>
                      <button
                        className="education-skip"
                        type="button"
                        onClick={() => resolveEducationChoice('Skipped Burapha University study option.')}
                      >
                        ไม่เรียน
                      </button>
                    </div>
                  </>
                )}

                {buraphaChoice === 'master' && (
                  <>
                    <strong>เรียนปริญญาโทไหม?</strong>
                    <p>ต้องกลับมาตกช่องนี้อีกครั้งจึงมีตัวเลือกนี้ ถ้าเลือกเรียนจะข้ามคิวตัวเอง 5 ครั้ง แล้วโบนัสรายได้ธุรกิจจะเพิ่มเป็น 30%</p>
                    <p>Tuition: {formatMoney(masterTuition)} | Cash: {formatMoney(activeEducationCash)}</p>
                    {!canAffordMasterStudy && (
                      <div className="education-warning" role="alert">
                        เงินไม่พอเรียนปริญญาโท ต้องมี {formatMoney(masterTuition)} แต่ตอนนี้มี{' '}
                        {formatMoney(activeEducationCash)}
                      </div>
                    )}
                    <div className="education-actions">
                      <button
                        disabled={!canAffordMasterStudy}
                        type="button"
                        onClick={() => startStudy('master')}
                      >
                        เรียนปริญญาโท
                      </button>
                      <button
                        className="education-skip"
                        type="button"
                        onClick={() => resolveEducationChoice('Skipped master degree option.')}
                      >
                        ไม่เรียน
                      </button>
                    </div>
                  </>
                )}

                {buraphaChoice === 'alumni' && (
                  <>
                    <strong>ค่าธรรมเนียมศิษย์เก่า 0000</strong>
                    <p>ระบบเงินยังไม่ถูกนำมาใช้ ตอนนี้เป็นการ์ดแจ้งผลชั่วคราวก่อน</p>
                    <div className="education-actions">
                      <button
                        type="button"
                        onClick={() => resolveEducationChoice('Alumni fee acknowledged.')}
                      >
                        รับทราบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
            </div>
          </div>
        )}

        {inventoryDetail && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal inventory-detail-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>{selectedPlayer.name}</span>
                  <strong>
                    {inventoryDetail.kind === 'business'
                      ? selectedInventoryBusiness?.title ?? 'Business Card'
                      : inventoryDetail.kind === 'land'
                        ? selectedInventoryLand
                          ? boardTiles[selectedInventoryLand.tileId].name
                          : 'Land Card'
                        : inventoryDetail.kind === 'influence'
                          ? selectedInventoryInfluence?.title ?? 'Influence Card'
                          : inventoryDetail.kind === 'prisonCoupon'
                            ? 'Prison Contact Coupon'
                            : 'Prison Status'}
                  </strong>
                </div>
                <button type="button" onClick={() => setInventoryDetail(null)}>
                  Close
                </button>
              </div>

              {inventoryDetail.kind === 'business' && selectedInventoryBusiness && (
                <div className="detail-list">
                  <div className="detail-row">
                    <strong>
                      {selectedInventoryBusinessTile?.id.toString().padStart(2, '0')}{' '}
                      {selectedInventoryBusinessTile?.name}
                    </strong>
                    <span>Zone: {selectedInventoryBusinessTile?.zone}</span>
                    <span>Tier: {selectedInventoryBusiness.tier}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Business Level</strong>
                    <span>Current level: {selectedInventoryBusiness.level}/{maxBusinessLevel}</span>
                    <span>
                      Current income {formatMoney(getBusinessHoldingIncome(selectedInventoryBusiness))} / round
                    </span>
                    <span>Base income {formatMoney(selectedInventoryBusiness.baseIncome)} / round</span>
                  </div>
                  <div className="detail-row">
                    <strong>Cost</strong>
                    <span>Paid {formatMoney(selectedInventoryBusiness.pricePaid)}</span>
                    <p>{selectedInventoryBusinessTile?.description}</p>
                  </div>
                  <div className="detail-row">
                    <strong>Land Relation</strong>
                    {selectedInventoryBusinessLandHolding ? (
                      <>
                        <span>
                          Land owner:{' '}
                          {players[selectedInventoryBusinessLandHolding.playerIndex].name}
                        </span>
                        {selectedInventoryBusinessIsTenant ? (
                          <span>
                            Tenant business: pays {formatMoney(selectedInventoryBusinessLeaseShare)} Open Lease
                            when collecting income at tile 00
                          </span>
                        ) : (
                          <span>Owner business: no Open Lease payment on this tile</span>
                        )}
                      </>
                    ) : (
                      <span>No land owner yet</span>
                    )}
                  </div>
                </div>
              )}

              {inventoryDetail.kind === 'land' && selectedInventoryLand && (
                <div className="detail-list">
                  <div className="detail-row">
                    <strong>
                      {boardTiles[selectedInventoryLand.tileId].id.toString().padStart(2, '0')}{' '}
                      {boardTiles[selectedInventoryLand.tileId].name}
                    </strong>
                    <span>{boardTiles[selectedInventoryLand.tileId].zone}</span>
                    <span>Bought for {formatMoney(selectedInventoryLand.pricePaid)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Land Rent</strong>
                    <span>
                      Current rule: {Math.round(landRentRate * 100)}% of land price when another player lands here
                    </span>
                    <span>
                      Rent due: {formatMoney(Math.round(selectedInventoryLand.pricePaid * landRentRate))}
                    </span>
                    <span>
                      Open Lease: owner receives {Math.round(openLeaseShareRate * 100)}% of tenant business income when that tenant collects at tile 00
                    </span>
                    <p>{boardTiles[selectedInventoryLand.tileId].description}</p>
                  </div>
                  <div className="detail-row">
                    <strong>Businesses on Land</strong>
                    <span>Owner businesses: {selectedInventoryLandOwnerBusinesses.length}</span>
                    <span>Tenant businesses: {selectedInventoryLandTenantBusinesses.length}</span>
                    <span>
                      Expected Open Lease: {formatMoney(selectedInventoryLandLeaseIncome)} / round
                    </span>
                    {selectedInventoryLandBusinesses.length === 0 ? (
                      <p>No business has been opened on this land yet.</p>
                    ) : (
                      <div className="tenant-list detail-tenant-list">
                        {selectedInventoryLandBusinesses.map((business) => {
                          const isTenant = business.playerIndex !== selectedPlayerIndex

                          return (
                            <span key={business.id}>
                              {players[business.playerIndex].name}: {business.title} | Lv.{business.level} |{' '}
                              {formatMoney(getBusinessHoldingIncome(business))} / round
                              {isTenant &&
                                ` | Open Lease ${formatMoney(
                                  Math.round(getBusinessHoldingIncome(business) * openLeaseShareRate),
                                )}`}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inventoryDetail.kind === 'influence' && selectedInventoryInfluence && (
                <div className="detail-list">
                  <div className="detail-row">
                    <strong>{selectedInventoryInfluence.title}</strong>
                    <span>Paid {formatMoney(selectedInventoryInfluence.pricePaid)}</span>
                    <span>{selectedInventoryInfluence.risk}</span>
                    <p>{selectedInventoryInfluence.description}</p>
                  </div>
                  <div className="detail-row">
                    <strong>Status</strong>
                    <span>Held in hand</span>
                    <span>
                      {selectedPlayer.role === 'Human'
                        ? 'Can be used while the board is ready.'
                        : 'AI card use is not automated yet.'}
                    </span>
                    {selectedPlayer.role === 'Human' && (
                      <button
                        className="detail-action-button"
                        disabled={phase !== 'ready'}
                        type="button"
                        onClick={() => applyInfluenceCard(selectedInventoryInfluence)}
                      >
                        Use Card
                      </button>
                    )}
                  </div>
                </div>
              )}

              {inventoryDetail.kind === 'prisonCoupon' && (
                <div className="detail-list">
                  <div className="detail-row coupon-row">
                    <strong>Prison Contact Coupon</strong>
                    <span>
                      {Math.round(prisonContactDiscountRate * 100)}% off your next influence card purchase
                    </span>
                    <span>Received from Chonburi Prison Bazaar</span>
                    <p>The coupon is consumed automatically when this player buys an influence card.</p>
                  </div>
                </div>
              )}

              {inventoryDetail.kind === 'prisonStatus' && (
                <div className="detail-list">
                  <div className="detail-row">
                    <strong>{selectedPrisonStatus}</strong>
                    <span>{selectedPrisonCouponStatus}</span>
                    <span>Prison Jackpot: {formatMoney(prisonJackpot)}</span>
                    <p>
                      Influence cards have a {Math.round(influenceJailRiskRate * 100)}% jail risk on use.
                      While in prison, skipped-turn income feeds the jackpot.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {evictionCard && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal eviction-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Influence Eviction</span>
                  <strong>Choose Rival Business</strong>
                </div>
                <button type="button" onClick={() => setEvictionCard(null)}>
                  Cancel
                </button>
              </div>

              <div className="eviction-target-list">
                {evictionTargets.length === 0 ? (
                  <p>No rival business is available.</p>
                ) : (
                  evictionTargets.map((business) => (
                    <button
                      className="eviction-target-card"
                      key={business.id}
                      type="button"
                      onClick={() => evictBusiness(evictionCard, business.id)}
                    >
                      <strong>{business.title}</strong>
                      <span>
                        {players[business.playerIndex].name} | {boardTiles[business.tileId].id.toString().padStart(2, '0')}{' '}
                        {boardTiles[business.tileId].name}
                      </span>
                      <span>
                        Lv.{business.level} | Paid {formatMoney(business.pricePaid)} | Refund{' '}
                        {formatMoney(Math.round(business.pricePaid * 0.5))}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {winnerRow && !isWinnerDismissed && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal winner-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Demo 1 Winner</span>
                  <strong>{winnerRow.player.name}</strong>
                </div>
              </div>

              <div className="winner-summary">
                <span>Target Net Worth</span>
                <strong>{formatMoney(netWorthWinTarget)}</strong>
                <span>Winner Net Worth</span>
                <strong>{formatMoney(winnerRow.total)}</strong>
              </div>

              <div className="net-worth-list">
                {netWorthRows.map((row, index) => (
                  <div className="net-worth-row" key={`winner-${row.player.id}`}>
                    <span className="rank-badge">{index + 1}</span>
                    <div className="rank-player">
                      <span className={`token ledger-token ${row.player.shape} ${row.player.colorClass}`} />
                      <div>
                        <strong>{row.player.name}</strong>
                        <span>{row.player.role}</span>
                      </div>
                    </div>
                    <div className="rank-total">
                      <span>Net Worth</span>
                      <strong>{formatMoney(row.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="winner-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsWinnerDismissed(true)
                    setStatus('Winner popup dismissed. Continue testing Demo 1 balance.')
                  }}
                >
                  Continue Testing
                </button>
                <button className="winner-reset" type="button" onClick={resetGame}>
                  Reset Game
                </button>
              </div>
            </div>
          </div>
        )}

        {isNetWorthOpen && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal net-worth-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Current Ranking</span>
                  <strong>Net Worth</strong>
                </div>
                <button type="button" onClick={() => setIsNetWorthOpen(false)}>
                  Close
                </button>
              </div>

              <div className="net-worth-list">
                {netWorthRows.map((row, index) => (
                  <div className="net-worth-row" key={row.player.id}>
                    <div className="rank-badge">{index + 1}</div>
                    <div className="rank-player">
                      <span className={`token ledger-token ${row.player.shape} ${row.player.colorClass}`} />
                      <div>
                        <strong>{row.player.name}</strong>
                        <span>{row.player.role}</span>
                      </div>
                    </div>
                    <div className="rank-total">
                      <span>Total</span>
                      <strong>{formatMoney(row.total)}</strong>
                    </div>
                    <dl className="rank-breakdown">
                      <div>
                        <dt>Cash</dt>
                        <dd>{formatMoney(row.cash)}</dd>
                      </div>
                      <div>
                        <dt>Business</dt>
                        <dd>{formatMoney(row.businessValue)}</dd>
                      </div>
                      <div>
                        <dt>Land</dt>
                        <dd>{formatMoney(row.landValue)}</dd>
                      </div>
                      <div>
                        <dt>Influence</dt>
                        <dd>{formatMoney(row.influenceValue)}</dd>
                      </div>
                      <div>
                        <dt>Income / round</dt>
                        <dd>{formatMoney(row.income)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
