import { useMemo, useRef, useState } from 'react'
import { boardTiles, type TileCategory } from './boardData'
import {
  businessLevelMultipliers,
  getBusinessCardsForTile,
  type BusinessCard,
} from './businessData'
import { runSimulationBatch, type SimBatchSummary } from './simulationEngine'
import {
  playDiceRollSound,
  playMoneySound,
  playUpgradeSound,
  playLandBuySound,
  playPoliceRaidSound,
  playGraduationSound,
  playShieldSound,
  playVictoryFanfare,
  toggleSound,
} from './soundEngine'
import { ConfettiCanvas } from './ConfettiCanvas'
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
  | 'game-over'

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

type InfluenceCard = {
  id: string
  title: string
  price: number
  risk: string
  description: string
  effect: InfluenceEffect
}

type InfluenceEffect =
  | 'eviction'
  | 'leasePressure'
  | 'portConnection'
  | 'taxRelief'
  | 'zoningPermit'

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

type LandPolicy = 'openLease' | 'ownerOnly'

type LandHolding = {
  tileId: number
  playerIndex: number
  pricePaid: number
  policy: LandPolicy
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

type NetWorthRow = {
  player: Player
  playerIndex: number
  cash: number
  businessValue: number
  landValue: number
  influenceValue: number
  income: number
  total: number
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
const landPolicyLabels = {
  openLease: 'Open Lease',
  ownerOnly: 'Owner Only',
} satisfies Record<LandPolicy, string>
const prisonJackpotMinimum = 20000
const prisonContactDiscountRate = 0.05
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
const aiBusinessCashReserve = 20000
const aiLandCashReserve = 50000
const targetNetWorth = 10000000
const studySkipTurns = 5
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
    price: 450000,
    risk: '🚨 20% jail risk on deal',
    description: 'Remove one rival business from any normal tile. The rival gets 50% of its invested cost back.',
    effect: 'eviction',
  },
  {
    id: 'lease-pressure',
    title: 'Lease Pressure',
    price: 350000,
    risk: '🚨 20% jail risk on deal',
    description: 'Your next Open Lease collection uses 20% tenant share instead of 10%.',
    effect: 'leasePressure',
  },
  {
    id: 'port-connection',
    title: 'Port Connection',
    price: 400000,
    risk: '🚨 20% jail risk on deal',
    description: 'Your next industrial and port business income collection increases by 40%.',
    effect: 'portConnection',
  },
  {
    id: 'tax-relief',
    title: 'Tax Relief',
    price: 300000,
    risk: '🚨 20% jail risk on deal',
    description: 'Immunity from land rent on rival lands for your next 3 rent landings.',
    effect: 'taxRelief',
  },
  {
    id: 'zoning-permit',
    title: 'Zoning Permit',
    price: 500000,
    risk: '🚨 20% jail risk on deal',
    description: 'Upgrade 1 of your existing businesses by 1 level for free immediately.',
    effect: 'zoningPermit',
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

function rollJailRisk(): boolean {
  return Math.random() < 0.20
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

let floatCounter = 0
function getNextFloatId(): number {
  floatCounter += 1
  return floatCounter
}

function App() {
  const [positions, setPositions] = useState<number[]>(() => players.map(() => 0))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [latestRoll, setLatestRoll] = useState<DiceRoll | null>(null)
  const [status, setStatus] = useState('Ready. Roll to start the round.')
  const [, setRollHistory] = useState<string[]>([])
  const [toastMessage, setToastMessage] = useState<{
    text: string
    tone: 'success' | 'warning' | 'info' | 'danger'
  } | null>(null)
  const [education, setEducation] = useState<EducationState[]>(() =>
    players.map(() => ({
      stage: 'none',
      activeStudy: 'none',
      skipTurns: 0,
    })),
  )
  const [buraphaChoice, setBuraphaChoice] = useState<BuraphaChoice | null>(null)
  const [, setInvestmentVisits] = useState<number[]>(() => players.map(() => 0))
  const [investmentOffer, setInvestmentOffer] = useState<InvestmentOffer | null>(null)
  const [selectedInvestmentTile, setSelectedInvestmentTile] = useState<number | null>(null)
  const [selectedLandTile, setSelectedLandTile] = useState<number | null>(null)
  const [selectedPoliticalEvent, setSelectedPoliticalEvent] = useState<PoliticalEventCard | null>(null)
  const [incomeModifiers, setIncomeModifiers] = useState<IncomeModifier[]>([])
  const [prisonJackpot, setPrisonJackpot] = useState(0)
  const [isNetWorthOpen, setIsNetWorthOpen] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [prisonTurns, setPrisonTurns] = useState<number[]>(() => players.map(() => 0))
  const [prisonContactCoupons, setPrisonContactCoupons] = useState<boolean[]>(() =>
    players.map(() => false),
  )
  const [influenceOffer, setInfluenceOffer] = useState<InfluenceCard[]>([])
  const [influenceHoldings, setInfluenceHoldings] = useState<InfluenceHolding[]>([])
  const [leasePressurePlayers, setLeasePressurePlayers] = useState<boolean[]>(() =>
    players.map(() => false),
  )
  const [taxReliefTurns, setTaxReliefTurns] = useState<number[]>(() => players.map(() => 0))
  const [zoningPermitCardId, setZoningPermitCardId] = useState<string | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [cashFloats, setCashFloats] = useState<Array<{ id: number; text: string; tone: 'positive' | 'negative' }>>([])
  const [simResults, setSimResults] = useState<SimBatchSummary | null>(null)
  const [isSimRunning, setIsSimRunning] = useState(false)
  const [simBatchSize, setSimBatchSize] = useState(50)
  const [simTargetNW, setSimTargetNW] = useState(10000000)
  const [isSimModalOpen, setIsSimModalOpen] = useState(false)
  const [evictionCardId, setEvictionCardId] = useState<string | null>(null)
  const [cash, setCash] = useState<number[]>(() => players.map(() => startingCash))
  const [businesses, setBusinesses] = useState<BusinessHolding[]>([])
  const [landHoldings, setLandHoldings] = useState<LandHolding[]>([])
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0)
  const [inventoryDetail, setInventoryDetail] = useState<InventoryDetail>(null)

  const skipRequestedRef = useRef(false)
  const activeRunRef = useRef(false)
  const runIdRef = useRef(0)
  const positionsRef = useRef<number[]>(players.map(() => 0))
  const educationRef = useRef<EducationState[]>(
    players.map(() => ({
      stage: 'none',
      activeStudy: 'none',
      skipTurns: 0,
    })),
  )
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
  const taxReliefTurnsRef = useRef<number[]>(players.map(() => 0))
  const influenceCardIdRef = useRef(0)
  const forcedMoveRef = useRef<number | null>(null)
  const aiDelayResolverRef = useRef<(() => void) | null>(null)
  const cardChoiceResolverRef = useRef<(() => void) | null>(null)
  const educationChoiceResolverRef = useRef<(() => void) | null>(null)
  const investmentChoiceResolverRef = useRef<(() => void) | null>(null)
  const politicalEventResolverRef = useRef<(() => void) | null>(null)
  const influenceChoiceResolverRef = useRef<(() => void) | null>(null)

  const tileOccupants = useMemo(() => {
    return positions.reduce<Record<number, number[]>>((occupants, position, index) => {
      occupants[position] = [...(occupants[position] ?? []), index]
      return occupants
    }, {})
  }, [positions])

  function runSimulations(count: number, target: number) {
    setIsSimRunning(true)
    window.setTimeout(() => {
      const summary = runSimulationBatch(count, target)
      setSimResults(summary)
      setIsSimRunning(false)
    }, 40)
  }

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

  function showToast(
    text: string,
    tone: 'success' | 'warning' | 'info' | 'danger' = 'info',
  ) {
    setToastMessage({ text, tone })
    window.setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current))
    }, 4500)
  }

  function triggerCashFloat(text: string, tone: 'positive' | 'negative' = 'positive') {
    const id = getNextFloatId()
    setCashFloats((prev) => [...prev, { id, text, tone }])
    window.setTimeout(() => {
      setCashFloats((prev) => prev.filter((f) => f.id !== id))
    }, 1600)
  }

  function updatePositions(nextPositions: number[]) {
    positionsRef.current = nextPositions
    setPositions(nextPositions)
  }

  function updateEducation(nextEducation: EducationState[]) {
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

  function updateTaxReliefTurns(nextTaxReliefTurns: number[]) {
    taxReliefTurnsRef.current = nextTaxReliefTurns
    setTaxReliefTurns(nextTaxReliefTurns)
  }

  function getNetWorthRowsFromState(
    cashValues: number[],
    businessValues: BusinessHolding[],
    landValues: LandHolding[],
    influenceValues: InfluenceHolding[],
  ): NetWorthRow[] {
    return players
      .map((player, playerIndex) => {
        const playerBusinesses = businessValues.filter(
          (business) => business.playerIndex === playerIndex,
        )
        const businessValue = playerBusinesses.reduce(
          (total, business) => total + business.pricePaid,
          0,
        )
        const landValue = landValues
          .filter((holding) => holding.playerIndex === playerIndex)
          .reduce((total, holding) => total + holding.pricePaid, 0)
        const influenceValue = influenceValues
          .filter((holding) => holding.playerIndex === playerIndex)
          .reduce((total, holding) => total + holding.pricePaid, 0)
        const income = playerBusinesses.reduce(
          (total, business) => total + getBusinessHoldingIncome(business),
          0,
        )
        const total = cashValues[playerIndex] + businessValue + landValue + influenceValue

        return {
          player,
          playerIndex,
          cash: cashValues[playerIndex],
          businessValue,
          landValue,
          influenceValue,
          income,
          total,
        }
      })
      .sort((a, b) => b.total - a.total)
  }

  function checkWinCondition() {
    if (winnerIndex !== null) {
      return true
    }

    const ranking = getNetWorthRowsFromState(
      cashRef.current,
      businessesRef.current,
      landHoldingsRef.current,
      influenceHoldingsRef.current,
    )
    const winner = ranking.find((row) => row.total >= targetNetWorth)

    if (!winner) {
      return false
    }

    setWinnerIndex(winner.playerIndex)
    setSelectedPlayerIndex(winner.playerIndex)
    setIsNetWorthOpen(false)
    setInventoryDetail(null)
    setPhase('game-over')
    setStatus(`${winner.player.name} reached ${formatMoney(winner.total)} Net Worth and won Demo 1.`)
    return true
  }

  function getEducationIncomeBonusRate(playerIndex: number) {
    const playerEdu = educationRef.current[playerIndex]
    if (!playerEdu) {
      return 0
    }

    if (playerEdu.stage === 'masterCompleted') {
      return educationIncomeBonus.masterCompleted / 100
    }

    if (playerEdu.stage === 'bachelorCompleted') {
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

      const leaseShareRate = leasePressurePlayersRef.current[landHolding.playerIndex]
        ? openLeaseShareRate * 2
        : openLeaseShareRate
      const amount = Math.round(item.income * passCount * leaseShareRate)

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

    if (leaseShares.length > 0) {
      const ownersPaid = new Set(leaseShares.map((payment) => payment.ownerIndex))
      const nextLeasePressurePlayers = leasePressurePlayersRef.current.map(
        (hasPressure, ownerIndex) => hasPressure && !ownersPaid.has(ownerIndex),
      )
      updateLeasePressurePlayers(nextLeasePressurePlayers)
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
    const boardTile = boardTiles[tileId]

    if (!landHolding || landHolding.playerIndex === playerIndex || !boardTile.landPrice) {
      return null
    }

    const currentTaxRelief = taxReliefTurnsRef.current[playerIndex]
    if (currentTaxRelief > 0) {
      const nextTax = [...taxReliefTurnsRef.current]
      nextTax[playerIndex] = Math.max(0, currentTaxRelief - 1)
      updateTaxReliefTurns(nextTax)
      playShieldSound()
      showToast(
        `🛡 ${players[playerIndex].name} used Tax Relief! Land rent waived at ${boardTile.name}. (${nextTax[playerIndex]} charges left)`,
        'warning',
      )
      return {
        rentDue: 0,
        rentPaid: 0,
        ownerIndex: landHolding.playerIndex,
      }
    }

    const rentDue = Math.round(boardTile.landPrice * landRentRate)
    const payerCash = cashRef.current[playerIndex]
    const rentPaid = Math.min(payerCash, rentDue)
    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= rentPaid
    nextCash[landHolding.playerIndex] += rentPaid
    updateCash(nextCash)
    playMoneySound()
    triggerCashFloat(`-${formatMoney(rentPaid)}`, 'negative')

    return {
      ownerIndex: landHolding.playerIndex,
      rentDue,
      rentPaid,
      taxReliefActive: false,
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
      playMoneySound()
      triggerCashFloat(`+${formatMoney(payout.totalIncome)}`, 'positive')
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

  function executeAIInfluenceCards(aiIndex: number) {
    const aiCards = influenceHoldingsRef.current.filter((h) => h.playerIndex === aiIndex)
    if (aiCards.length === 0) return

    // 1. Tax Relief if low on cash
    const taxCard = aiCards.find((c) => c.effect === 'taxRelief')
    if (taxCard && cashRef.current[aiIndex] < 150000 && taxReliefTurnsRef.current[aiIndex] === 0) {
      const nextTax = [...taxReliefTurnsRef.current]
      nextTax[aiIndex] += 3
      updateTaxReliefTurns(nextTax)
      removeInfluenceHolding(taxCard.id)
      showToast(`🛡 ${players[aiIndex].name} activated Tax Relief! (3 charges)`, 'warning')
      setStatus(`🛡 ${players[aiIndex].name} used Tax Relief to protect against rent!`)
      return
    }

    // 2. Zoning Permit to upgrade highest tier business
    const zoningCard = aiCards.find((c) => c.effect === 'zoningPermit')
    if (zoningCard) {
      const playerBusinesses = businessesRef.current.filter(
        (b) => b.playerIndex === aiIndex && b.level < maxBusinessLevel,
      )
      if (playerBusinesses.length > 0) {
        const bestBusiness = [...playerBusinesses].sort((a, b) => b.pricePaid - a.pricePaid)[0]
        const nextBusinesses = businessesRef.current.map((b) =>
          b.id === bestBusiness.id ? { ...b, level: b.level + 1 } : b,
        )
        updateBusinesses(nextBusinesses)
        removeInfluenceHolding(zoningCard.id)
        showToast(`🏛 ${players[aiIndex].name} used Zoning Permit on ${bestBusiness.title}!`, 'info')
        setStatus(
          `🏛 ${players[aiIndex].name} used Zoning Permit! Upgraded ${bestBusiness.title} at ${boardTiles[bestBusiness.tileId].name} to Level ${bestBusiness.level + 1} for free!`,
        )
        return
      }
    }

    // 3. Port Connection
    const portCard = aiCards.find((c) => c.effect === 'portConnection')
    if (portCard) {
      const hasIndustrial = businessesRef.current.some(
        (b) => b.playerIndex === aiIndex && industrialCategories.has(boardTiles[b.tileId].category),
      )
      const hasModifier = incomeModifiersRef.current.some(
        (m) => m.playerIndex === aiIndex && m.scope === 'industrial',
      )
      if (hasIndustrial && !hasModifier) {
        updateIncomeModifiers([
          ...incomeModifiersRef.current,
          {
            id: `port-connection-${portCard.id}`,
            eventTitle: 'Port Connection',
            playerIndex: aiIndex,
            multiplier: 1.4,
            scope: 'industrial',
          },
        ])
        removeInfluenceHolding(portCard.id)
        showToast(`⚓ ${players[aiIndex].name} activated Port Connection (+40% income)!`, 'info')
        setStatus(`${players[aiIndex].name} activated Port Connection for +40% industrial income!`)
        return
      }
    }

    // 4. Lease Pressure
    const leaseCard = aiCards.find((c) => c.effect === 'leasePressure')
    if (leaseCard && !leasePressurePlayersRef.current[aiIndex]) {
      const ownedLandTiles = new Set(
        landHoldingsRef.current.filter((l) => l.playerIndex === aiIndex).map((l) => l.tileId),
      )
      const hasTenants = businessesRef.current.some(
        (b) => b.playerIndex !== aiIndex && ownedLandTiles.has(b.tileId),
      )
      if (hasTenants) {
        const nextLease = [...leasePressurePlayersRef.current]
        nextLease[aiIndex] = true
        updateLeasePressurePlayers(nextLease)
        removeInfluenceHolding(leaseCard.id)
        showToast(`📜 ${players[aiIndex].name} activated Lease Pressure (20% share)!`, 'warning')
        setStatus(
          `${players[aiIndex].name} activated Lease Pressure! 20% Open Lease tenant share on next lap.`,
        )
        return
      }
    }

    // 5. Influence Eviction
    const evictionCard = aiCards.find((c) => c.effect === 'eviction')
    if (evictionCard) {
      const rivalBusinesses = businessesRef.current.filter((b) => b.playerIndex !== aiIndex)
      if (rivalBusinesses.length > 0) {
        const target = [...rivalBusinesses].sort((a, b) => b.pricePaid - a.pricePaid)[0]
        const refund = Math.round(target.pricePaid * 0.5)
        const nextCash = [...cashRef.current]
        nextCash[target.playerIndex] += refund
        updateCash(nextCash)
        updateBusinesses(businessesRef.current.filter((b) => b.id !== target.id))
        removeInfluenceHolding(evictionCard.id)
        showToast(`💼 ${players[aiIndex].name} evicted rival ${target.title}!`, 'danger')
        setStatus(
          `💼 ${players[aiIndex].name} used Influence Eviction on ${target.title} at ${boardTiles[target.tileId].name}! ${players[target.playerIndex].name} received ${formatMoney(refund)} refund.`,
        )
      }
    }
  }

  async function playTurn(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    setCurrentPlayerIndex(playerIndex)

    if (prisonTurnsRef.current[playerIndex] > 0) {
      await skipPrisonTurn(playerIndex, runId)
      return
    }

    if (educationRef.current[playerIndex].skipTurns > 0) {
      await skipStudyTurn(playerIndex, runId)
      return
    }

    if (player.role === 'AI') {
      executeAIInfluenceCards(playerIndex)
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
    playDiceRollSound()
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
      ? rentResult.rentDue === 0
        ? `🛡 Tax Relief Active! ${player.name} paid 0 rent to ${players[rentResult.ownerIndex].name} for ${boardTiles[finalPosition as number].name}.`
        : `${player.name} paid ${formatMoney(rentResult.rentPaid)} rent to ${players[rentResult.ownerIndex].name} for ${boardTiles[finalPosition as number].name}.`
      : ''

    if (rentResult && rentResult.rentDue > 0) {
      setStatus(
        rentResult.rentPaid < rentResult.rentDue
          ? `${rentMessage} Rent due was ${formatMoney(rentResult.rentDue)}, but ${player.name} only had enough to pay ${formatMoney(rentResult.rentPaid)}.`
          : rentMessage,
      )
    } else if (rentResult) {
      setStatus(rentMessage)
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
      typeof finalPosition === 'number' &&
      finalPosition === buraphaTile
    ) {
      await handleBuraphaTile(playerIndex, runId)
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
      player.role === 'AI' &&
      typeof finalPosition === 'number' &&
      !noCardTiles.has(finalPosition)
    ) {
      await handleAiNormalTile(playerIndex, finalPosition, rentMessage)
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

  function handleAIInvestmentBank(playerIndex: number, options: number[]) {
    const aiCash = cashRef.current[playerIndex]
    if (aiCash < 100000) return false

    for (const tileId of options) {
      const tile = boardTiles[tileId]
      const cards = getBusinessCardsForTile(tile)
      const policyBlock = getLandPolicyBlock(tileId, playerIndex)
      if (policyBlock) continue

      // Look for existing business to upgrade first
      const existing = businessesRef.current.find(
        (b) => b.playerIndex === playerIndex && b.tileId === tileId && b.level < maxBusinessLevel,
      )

      if (existing) {
        const card = cards.find((c) => c.id === existing.cardId)
        if (card && aiCash >= card.price) {
          buyOrUpgradeBusinessCard(card, tileId)
          return true
        }
      }

      // Otherwise try buying a new business card
      for (const card of cards) {
        if (aiCash >= card.price + aiBusinessCashReserve) {
          buyOrUpgradeBusinessCard(card, tileId)
          return true
        }
      }
    }

    return false
  }

  async function handleInvestmentBankTile(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    const nextVisits = [...investmentVisitsRef.current]
    nextVisits[playerIndex] += 1
    updateInvestmentVisits(nextVisits)

    const visitCount = nextVisits[playerIndex]
    const { maxTile, options } = getInvestmentOptions(visitCount)

    if (player.role === 'AI') {
      const didInvest = handleAIInvestmentBank(playerIndex, options)
      if (!didInvest) {
        setStatus(
          `${player.name} reached Investment Bank visit ${visitCount} (unlocked 01-${maxTile.toString().padStart(2, '0')}) and saved cash.`,
        )
      }
      await wait(aiDelayMs)
      return
    }

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
      const offer = getRandomInfluenceOffer()
      const aiCards = influenceHoldingsRef.current.filter((h) => h.playerIndex === playerIndex)
      const affordableCard = offer.find((card) => {
        const hasCoupon = prisonContactCouponsRef.current[playerIndex]
        const discount = hasCoupon ? Math.round(card.price * prisonContactDiscountRate) : 0
        return cashRef.current[playerIndex] - (card.price - discount) >= 300000
      })

      if (affordableCard && aiCards.length < maxInfluenceCards) {
        buyInfluenceCardForAI(playerIndex, affordableCard)
        await wait(aiDelayMs)
        return
      }

      setStatus(`${player.name} reached Local Power Broker and walked away.`)
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

  async function skipStudyTurn(playerIndex: number, runId: number) {
    const currentEducation = educationRef.current[playerIndex]
    const remainingTurns = Math.max(currentEducation.skipTurns - 1, 0)
    const completedStudy = currentEducation.activeStudy
    const nextEduList = [...educationRef.current]
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

    nextEduList[playerIndex] = nextEducation
    updateEducation(nextEduList)
    setPhase('study-skip')

    if (remainingTurns === 0) {
      playGraduationSound()
      const bonus =
        completedStudy === 'master'
          ? educationIncomeBonus.masterCompleted
          : educationIncomeBonus.bachelorCompleted
      showToast(
        `🎓 ${players[playerIndex].name} graduated with ${completedStudy === 'master' ? "Master's" : "Bachelor's"} degree! (+${bonus}% income bonus)`,
        'success',
      )
      setStatus(
        `${players[playerIndex].name} finished studying at Burapha University. Business income bonus is now +${bonus}%.`,
      )
    } else {
      setStatus(
        `${players[playerIndex].name} is studying at Burapha University. ${remainingTurns} skipped turn(s) left.`,
      )
    }

    await wait(aiDelayMs)

    if (runId !== runIdRef.current) {
      return
    }
  }

  async function handleBuraphaTile(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    const currentEducation = educationRef.current[playerIndex]

    if (player.role === 'AI') {
      const aiCash = cashRef.current[playerIndex]
      if (currentEducation.stage === 'none' && aiCash >= 120000) {
        const nextEduList = [...educationRef.current]
        nextEduList[playerIndex] = {
          stage: 'none',
          activeStudy: 'bachelor',
          skipTurns: studySkipTurns,
        }
        updateEducation(nextEduList)
        showToast(
          `🎓 ${player.name} enrolled in Bachelor Degree at Burapha University! (+${educationIncomeBonus.bachelorCompleted}% income)`,
          'info',
        )
        setStatus(
          `${player.name} started Bachelor degree at Burapha University. Skipped ${studySkipTurns} turns for +${educationIncomeBonus.bachelorCompleted}% income bonus.`,
        )
        await wait(aiDelayMs)
        return
      }

      if (currentEducation.stage === 'bachelorCompleted' && aiCash >= 220000) {
        const nextEduList = [...educationRef.current]
        nextEduList[playerIndex] = {
          stage: 'bachelorCompleted',
          activeStudy: 'master',
          skipTurns: studySkipTurns,
        }
        updateEducation(nextEduList)
        showToast(
          `🎓 ${player.name} enrolled in Master Degree at Burapha University! (+${educationIncomeBonus.masterCompleted}% income)`,
          'info',
        )
        setStatus(
          `${player.name} started Master degree at Burapha University. Skipped ${studySkipTurns} turns for +${educationIncomeBonus.masterCompleted}% income bonus.`,
        )
        await wait(aiDelayMs)
        return
      }

      setStatus(`${player.name} visited Burapha University and continued without enrolling.`)
      await wait(aiDelayMs)
      return
    }

    const nextChoice: BuraphaChoice =
      currentEducation.stage === 'none'
        ? 'bachelor'
        : currentEducation.stage === 'bachelorCompleted'
          ? 'master'
          : 'alumni'

    setBuraphaChoice(nextChoice)
    setPhase('education-choice')

    if (nextChoice === 'bachelor') {
      setStatus('Burapha University: choose whether to start a bachelor degree.')
    } else if (nextChoice === 'master') {
      setStatus('Burapha University: choose whether to start a master degree.')
    } else {
      setStatus('Burapha University: alumni fee card is available.')
    }

    await new Promise<void>((resolve) => {
      educationChoiceResolverRef.current = resolve
    })
    educationChoiceResolverRef.current = null
    setBuraphaChoice(null)

    if (runId !== runIdRef.current) {
      return
    }
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

        const winner = checkWinCondition()
        if (runId === runIdRef.current && winner) {
          playVictoryFanfare()
          activeRunRef.current = false
          return
        }
      }

      continueStudyRounds =
        educationRef.current[0].skipTurns > 0 || prisonTurnsRef.current[0] > 0
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
    if (phase === 'game-over') {
      return
    }

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
    if (phase !== 'ready' || activeRunRef.current || winnerIndex !== null) {
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

  function getLandPolicyBlockFromHoldings(
    tileId: number,
    playerIndex: number,
    holdings: LandHolding[],
  ) {
    const landHolding = holdings.find((holding) => holding.tileId === tileId)

    if (
      !landHolding ||
      landHolding.playerIndex === playerIndex ||
      landHolding.policy !== 'ownerOnly'
    ) {
      return null
    }

    return `${boardTiles[tileId].name} is Owner Only. ${players[landHolding.playerIndex].name} blocks other players from buying or upgrading businesses here.`
  }

  function getLandPolicyBlock(tileId: number, playerIndex: number) {
    return getLandPolicyBlockFromHoldings(tileId, playerIndex, landHoldingsRef.current)
  }

  function getAffordableBusinessCard(cards: BusinessCard[], playerCash: number) {
    return [...cards]
      .sort((a, b) => b.price - a.price)
      .find((card) => playerCash - card.price >= aiBusinessCashReserve)
  }

  function getAiBusinessAction(playerIndex: number, tileId: number) {
    const policyBlock = getLandPolicyBlock(tileId, playerIndex)

    if (policyBlock) {
      return null
    }

    const tile = boardTiles[tileId]
    const cards = getBusinessCardsForTile(tile)
    const playerBusinessesOnTile = businessesRef.current.filter(
      (business) => business.playerIndex === playerIndex && business.tileId === tileId,
    )
    const upgradeCandidate = playerBusinessesOnTile
      .filter((business) => business.level < maxBusinessLevel)
      .map((business) => ({
        business,
        card: cards.find((card) => card.id === business.cardId),
      }))
      .filter((item): item is { business: BusinessHolding; card: BusinessCard } =>
        Boolean(item.card),
      )
      .sort((a, b) => b.card.price - a.card.price)
      .find((item) => cashRef.current[playerIndex] - item.card.price >= aiBusinessCashReserve)

    if (upgradeCandidate) {
      return {
        type: 'upgrade' as const,
        card: upgradeCandidate.card,
        business: upgradeCandidate.business,
      }
    }

    const ownedCardIds = new Set(playerBusinessesOnTile.map((business) => business.cardId))
    const newCard = getAffordableBusinessCard(
      cards.filter((card) => !ownedCardIds.has(card.id)),
      cashRef.current[playerIndex],
    )

    if (!newCard) {
      return null
    }

    return {
      type: 'buy' as const,
      card: newCard,
    }
  }

  function runAiBusinessDecision(playerIndex: number, tileId: number) {
    const action = getAiBusinessAction(playerIndex, tileId)

    if (!action) {
      return null
    }

    const tile = boardTiles[tileId]
    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= action.card.price
    updateCash(nextCash)

    if (action.type === 'upgrade') {
      const nextLevel = action.business.level + 1
      updateBusinesses(
        businessesRef.current.map((business) =>
          business.id === action.business.id
            ? {
                ...business,
                level: nextLevel,
                pricePaid: business.pricePaid + action.card.price,
              }
            : business,
        ),
      )
      playUpgradeSound()
      triggerCashFloat(`-${formatMoney(action.card.price)}`, 'negative')

      return `${players[playerIndex].name} upgraded ${action.card.title} at ${tile.name} to level ${nextLevel}.`
    }

    const nextBusiness: BusinessHolding = {
      id: `${playerIndex}-${tileId}-${action.card.id}`,
      playerIndex,
      tileId,
      cardId: action.card.id,
      title: action.card.title,
      tier: action.card.tier,
      level: 1,
      pricePaid: action.card.price,
      baseIncome: action.card.baseIncome,
    }
    updateBusinesses([...businessesRef.current, nextBusiness])
    playMoneySound()
    triggerCashFloat(`-${formatMoney(action.card.price)}`, 'negative')

    return `${players[playerIndex].name} bought ${action.card.title} at ${tile.name}.`
  }

  function runAiLandDecision(playerIndex: number, tileId: number) {
    const tile = boardTiles[tileId]

    if (
      !tile.landPrice ||
      landHoldingsRef.current.some((holding) => holding.tileId === tileId) ||
      cashRef.current[playerIndex] - tile.landPrice < aiLandCashReserve
    ) {
      return null
    }

    const aiOwnsBusinessHere = businessesRef.current.some(
      (business) => business.playerIndex === playerIndex && business.tileId === tileId,
    )
    const policy: LandPolicy = aiOwnsBusinessHere ? 'ownerOnly' : 'openLease'
    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= tile.landPrice
    updateCash(nextCash)
    updateLandHoldings([
      ...landHoldingsRef.current,
      {
        tileId,
        playerIndex,
        pricePaid: tile.landPrice,
        policy,
      },
    ])
    playLandBuySound()
    triggerCashFloat(`-${formatMoney(tile.landPrice)}`, 'negative')

    return `${players[playerIndex].name} bought land at ${tile.name} and set ${landPolicyLabels[policy]}.`
  }

  async function handleAiNormalTile(playerIndex: number, tileId: number, rentMessage: string) {
    const businessMessage = runAiBusinessDecision(playerIndex, tileId)
    const landMessage = runAiLandDecision(playerIndex, tileId)
    const messages = [rentMessage, businessMessage, landMessage].filter(Boolean)

    if (messages.length > 0) {
      setStatus(messages.join(' '))
    } else {
      setStatus(`${players[playerIndex].name} skipped business decisions at ${boardTiles[tileId].name}.`)
    }

    await wait(aiDelayMs)
  }

  function updateLandPolicy(tileId: number, policy: LandPolicy) {
    const landHolding = landHoldingsRef.current.find((holding) => holding.tileId === tileId)

    if (!landHolding) {
      setStatus('No land owner found for this tile.')
      return
    }

    if (landHolding.playerIndex !== currentPlayerIndex) {
      setStatus(`${players[currentPlayerIndex].name} cannot change ${players[landHolding.playerIndex].name}'s land policy.`)
      return
    }

    updateLandHoldings(
      landHoldingsRef.current.map((holding) =>
        holding.tileId === tileId ? { ...holding, policy } : holding,
      ),
    )
    setStatus(`${boardTiles[tileId].name} policy changed to ${landPolicyLabels[policy]}.`)
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

    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= tile.landPrice
    updateCash(nextCash)
    updateLandHoldings([
      ...landHoldingsRef.current,
      {
        tileId: tile.id,
        playerIndex,
        pricePaid: tile.landPrice,
        policy: 'openLease',
      },
    ])
    playLandBuySound()
    triggerCashFloat(`-${formatMoney(tile.landPrice)}`, 'negative')
    closeLandDetail(
      `${players[playerIndex].name} bought land at ${tile.name} for ${formatMoney(tile.landPrice)}. Cash left: ${formatMoney(nextCash[playerIndex])}.`,
    )
  }

  function getBusinessIncomeAtLevel(card: BusinessCard, level: number) {
    const multiplier = businessLevelMultipliers[level - 1] ?? businessLevelMultipliers[0]
    return Math.round(card.baseIncome * multiplier)
  }

  function buyOrUpgradeBusinessCard(card: BusinessCard, tileId = activeTile.id) {
    const playerIndex = currentPlayerIndex
    const tile = boardTiles[tileId]
    const policyBlock = getLandPolicyBlock(tileId, playerIndex)

    if (policyBlock) {
      setStatus(policyBlock)
      return false
    }

    const existingBusiness = businessesRef.current.find(
      (business) =>
        business.playerIndex === playerIndex &&
        business.tileId === tileId &&
        business.cardId === card.id,
    )

    if (existingBusiness && existingBusiness.level >= maxBusinessLevel) {
      setStatus(`${existingBusiness.title} at ${tile.name} is already max level.`)
      return false
    }

    const playerCash = cashRef.current[playerIndex]

    if (playerCash < card.price) {
      setStatus(`${players[playerIndex].name} needs ${formatMoney(card.price)} but only has ${formatMoney(playerCash)}.`)
      return false
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
      playUpgradeSound()
      triggerCashFloat(`-${formatMoney(card.price)}`, 'negative')
      resolveCardChoice(
        `${players[playerIndex].name} upgraded ${card.title} at ${tile.name} to level ${nextLevel} for ${formatMoney(card.price)}. New income: ${formatMoney(getBusinessIncomeAtLevel(card, nextLevel))} / round.`,
      )
      return true
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
    playMoneySound()
    triggerCashFloat(`-${formatMoney(card.price)}`, 'negative')
    resolveCardChoice(
      `${players[playerIndex].name} bought ${card.title} at ${tile.name} for ${formatMoney(card.price)}. Cash left: ${formatMoney(nextCash[playerIndex])}.`,
    )
    return true
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
    const didBuyOrUpgrade = buyOrUpgradeBusinessCard(card, tileId)

    if (didBuyOrUpgrade) {
      investmentChoiceResolverRef.current?.()
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

    // 20% Jail Risk check on deal
    if (rollJailRisk()) {
      const nextPositions = [...positionsRef.current]
      nextPositions[playerIndex] = prisonTile
      updatePositions(nextPositions)

      const nextPrisonTurns = [...prisonTurnsRef.current]
      nextPrisonTurns[playerIndex] = 2
      updatePrisonTurns(nextPrisonTurns)
      playPoliceRaidSound()

      resolveInfluenceChoice(
        `🚨 POLICE RAID! ${players[playerIndex].name} bought ${card.title} but got arrested in the raid! Sent to Chonburi Prison for 2 turns!`,
      )
      return
    }

    resolveInfluenceChoice(
      `${players[playerIndex].name} bought ${card.title} for ${formatMoney(finalPrice)}${discount > 0 ? ` after ${formatMoney(discount)} Prison Contact discount` : ''}. It is now in their hand (${playerCards.length + 1}/${maxInfluenceCards}).`,
    )
  }

  function buyInfluenceCardForAI(aiIndex: number, card: InfluenceCard) {
    const aiCards = influenceHoldingsRef.current.filter((h) => h.playerIndex === aiIndex)
    if (aiCards.length >= maxInfluenceCards) return

    const hasCoupon = prisonContactCouponsRef.current[aiIndex]
    const discount = hasCoupon ? Math.round(card.price * prisonContactDiscountRate) : 0
    const finalPrice = card.price - discount

    if (cashRef.current[aiIndex] < finalPrice) return

    const nextCash = [...cashRef.current]
    nextCash[aiIndex] -= finalPrice
    updateCash(nextCash)

    if (hasCoupon) {
      const nextCoupons = [...prisonContactCouponsRef.current]
      nextCoupons[aiIndex] = false
      updatePrisonContactCoupons(nextCoupons)
    }

    influenceCardIdRef.current += 1
    updateInfluenceHoldings([
      ...influenceHoldingsRef.current,
      {
        id: `${aiIndex}-${card.id}-${influenceCardIdRef.current}`,
        playerIndex: aiIndex,
        cardId: card.id,
        title: card.title,
        pricePaid: finalPrice,
        risk: card.risk,
        description: card.description,
        effect: card.effect,
      },
    ])

    if (rollJailRisk()) {
      const nextPositions = [...positionsRef.current]
      nextPositions[aiIndex] = prisonTile
      updatePositions(nextPositions)

      const nextPrisonTurns = [...prisonTurnsRef.current]
      nextPrisonTurns[aiIndex] = 2
      updatePrisonTurns(nextPrisonTurns)
      playPoliceRaidSound()

      setStatus(
        `🚨 POLICE RAID! ${players[aiIndex].name} bought ${card.title} but got arrested! Sent to Chonburi Prison for 2 turns!`,
      )
      return
    }

    setStatus(
      `${players[aiIndex].name} bought ${card.title} from Local Power Broker for ${formatMoney(finalPrice)}.`,
    )
  }

  function removeInfluenceHolding(cardId: string) {
    updateInfluenceHoldings(
      influenceHoldingsRef.current.filter((holding) => holding.id !== cardId),
    )
  }

  function playInfluenceCard(card: InfluenceHolding) {
    if (card.playerIndex !== 0) {
      setStatus('Only Player can use influence cards in Demo 1.')
      return
    }

    if (card.effect === 'eviction') {
      const hasTargets = businessesRef.current.some((business) => business.playerIndex !== card.playerIndex)

      if (!hasTargets) {
        setStatus('Influence Eviction has no rival business target right now.')
        return
      }

      setEvictionCardId(card.id)
      setInventoryDetail(null)
      setStatus('Influence Eviction: choose one rival business to remove.')
      return
    }

    if (card.effect === 'leasePressure') {
      const nextLeasePressurePlayers = [...leasePressurePlayersRef.current]
      nextLeasePressurePlayers[card.playerIndex] = true
      updateLeasePressurePlayers(nextLeasePressurePlayers)
      removeInfluenceHolding(card.id)
      setInventoryDetail(null)
      setStatus(
        `${players[card.playerIndex].name} used Lease Pressure. Their next Open Lease collection uses ${Math.round(openLeaseShareRate * 200)}%.`,
      )
      return
    }

    if (card.effect === 'taxRelief') {
      const nextTaxRelief = [...taxReliefTurnsRef.current]
      nextTaxRelief[card.playerIndex] += 3
      updateTaxReliefTurns(nextTaxRelief)
      removeInfluenceHolding(card.id)
      setInventoryDetail(null)
      setStatus(
        `🛡 ${players[card.playerIndex].name} activated Tax Relief! Rent immunity for next 3 landings on rival land.`,
      )
      return
    }

    if (card.effect === 'zoningPermit') {
      const playerBusinesses = businessesRef.current.filter(
        (b) => b.playerIndex === card.playerIndex && b.level < maxBusinessLevel,
      )

      if (playerBusinesses.length === 0) {
        setStatus('Zoning Permit requires at least 1 upgradable business owned by you.')
        return
      }

      setZoningPermitCardId(card.id)
      setInventoryDetail(null)
      setStatus('Zoning Permit: Choose one of your businesses to upgrade by +1 level for free.')
      return
    }

    const nextModifiers = incomeModifiersRef.current.filter(
      (modifier) => modifier.id !== `port-connection-${card.id}`,
    )
    updateIncomeModifiers([
      ...nextModifiers,
      {
        id: `port-connection-${card.id}`,
        eventTitle: 'Port Connection',
        playerIndex: card.playerIndex,
        multiplier: 1.4,
        scope: 'industrial',
      },
    ])
    removeInfluenceHolding(card.id)
    setInventoryDetail(null)
    setStatus(
      `${players[card.playerIndex].name} used Port Connection. Industrial and port income pays 140% on the next income collection.`,
    )
  }

  function resolveInfluenceEviction(targetBusinessId: string) {
    const card = influenceHoldingsRef.current.find((holding) => holding.id === evictionCardId)
    const targetBusiness = businessesRef.current.find(
      (business) => business.id === targetBusinessId,
    )

    if (!card || !targetBusiness || targetBusiness.playerIndex === card.playerIndex) {
      setEvictionCardId(null)
      setStatus('Influence Eviction could not find a valid target.')
      return
    }

    const refund = Math.round(targetBusiness.pricePaid * 0.5)
    const nextCash = [...cashRef.current]
    nextCash[targetBusiness.playerIndex] += refund
    updateCash(nextCash)
    updateBusinesses(
      businessesRef.current.filter((business) => business.id !== targetBusiness.id),
    )
    removeInfluenceHolding(card.id)
    setEvictionCardId(null)
    setStatus(
      `${players[card.playerIndex].name} used Influence Eviction on ${targetBusiness.title} at ${boardTiles[targetBusiness.tileId].name}. ${players[targetBusiness.playerIndex].name} received ${formatMoney(refund)} refund.`,
    )
  }

  function resolveZoningPermitUpgrade(businessId: string) {
    const cardHolding = influenceHoldingsRef.current.find((h) => h.id === zoningPermitCardId)
    const targetBusiness = businessesRef.current.find((b) => b.id === businessId)

    if (!cardHolding || !targetBusiness || targetBusiness.level >= maxBusinessLevel) {
      setZoningPermitCardId(null)
      setStatus('Zoning Permit upgrade cancelled.')
      return
    }

    const nextBusinesses = businessesRef.current.map((b) => {
      if (b.id === targetBusiness.id) {
        return {
          ...b,
          level: b.level + 1,
        }
      }
      return b
    })

    updateBusinesses(nextBusinesses)
    removeInfluenceHolding(cardHolding.id)
    setZoningPermitCardId(null)
    setStatus(
      `🏛 Zoning Permit used! ${targetBusiness.title} at ${boardTiles[targetBusiness.tileId].name} upgraded to Level ${targetBusiness.level + 1} for free!`,
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

  function startStudy(activeStudy: Exclude<ActiveStudy, 'none'>) {
    const playerIndex = 0
    const currentEdu = educationRef.current[playerIndex]
    const nextEduList = [...educationRef.current]
    nextEduList[playerIndex] = {
      stage: currentEdu.stage,
      activeStudy,
      skipTurns: studySkipTurns,
    }
    updateEducation(nextEduList)
    showToast(
      `🎓 Enrolled in ${activeStudy === 'master' ? "Master's" : "Bachelor's"} degree at Burapha University!`,
      'info',
    )
    resolveEducationChoice(
      activeStudy === 'bachelor'
        ? `Player started bachelor study at Burapha University. Skip ${studySkipTurns} turns, then business income becomes +${educationIncomeBonus.bachelorCompleted}%.`
        : `Player started master degree at Burapha University. Skip ${studySkipTurns} turns, then business income becomes +${educationIncomeBonus.masterCompleted}%.`,
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
    updateEducation(
      players.map(() => ({
        stage: 'none',
        activeStudy: 'none',
        skipTurns: 0,
      })),
    )
    setBuraphaChoice(null)
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
    updateTaxReliefTurns(players.map(() => 0))
    setZoningPermitCardId(null)
    setInvestmentOffer(null)
    setSelectedInvestmentTile(null)
    setSelectedLandTile(null)
    setSelectedPoliticalEvent(null)
    setInfluenceOffer([])
    setEvictionCardId(null)
    setWinnerIndex(null)
    setCurrentPlayerIndex(0)
    setInventoryDetail(null)
    setIsNetWorthOpen(false)
    setPhase('ready')
    setLatestRoll(null)
    setStatus('Game reset. Roll to start the round.')
    setRollHistory([])
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
                          : phase === 'game-over'
                            ? 'Game Over'
                            : 'Skip Move'
  const activeTile = boardTiles[positions[currentPlayerIndex]]
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
  const businessCards = getBusinessCardsForTile(activeTile)
  const currentPlayerBusinessesOnActiveTile = businesses.filter(
    (business) =>
      business.playerIndex === currentPlayerIndex && business.tileId === activeTile.id,
  )
  const activeTilePolicyBlock = getLandPolicyBlockFromHoldings(
    activeTile.id,
    currentPlayerIndex,
    landHoldings,
  )
  const selectedInvestmentTileData =
    selectedInvestmentTile === null ? null : boardTiles[selectedInvestmentTile]
  const investmentBusinessCards = selectedInvestmentTileData
    ? getBusinessCardsForTile(selectedInvestmentTileData)
    : []
  const selectedInvestmentTilePolicyBlock =
    selectedInvestmentTile === null
      ? null
      : getLandPolicyBlockFromHoldings(
          selectedInvestmentTile,
          currentPlayerIndex,
          landHoldings,
        )
  const currentPlayerBusinessesOnInvestmentTile =
    selectedInvestmentTile === null
      ? []
      : businesses.filter(
          (business) =>
            business.playerIndex === currentPlayerIndex &&
            business.tileId === selectedInvestmentTile,
        )
  const netWorthRows = getNetWorthRowsFromState(
    cash,
    businesses,
    landHoldings,
    influenceHoldings,
  )
  const winnerRow = winnerIndex === null
    ? null
    : netWorthRows.find((row) => row.playerIndex === winnerIndex) ?? null
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
  const canUseSelectedInfluence =
    Boolean(selectedInventoryInfluence) && selectedInventoryInfluence?.playerIndex === 0
  const evictionCard = evictionCardId === null
    ? null
    : influenceHoldings.find((holding) => holding.id === evictionCardId) ?? null
  const evictionTargets = evictionCard
    ? businesses.filter(
        (business) =>
          business.playerIndex !== evictionCard.playerIndex &&
          !noCardTiles.has(business.tileId),
      )
    : []
  const selectedPlayerLeasePressureStatus = leasePressurePlayers[selectedPlayerIndex]
    ? `Lease Pressure ready: next Open Lease collection uses ${Math.round(openLeaseShareRate * 200)}%`
    : 'No lease pressure'
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
  const canCurrentPlayerEditSelectedLandPolicy =
    Boolean(selectedLandHolding) && selectedLandHolding?.playerIndex === currentPlayerIndex
  const canCurrentPlayerEditInventoryLandPolicy =
    Boolean(selectedInventoryLand) && selectedInventoryLand?.playerIndex === currentPlayerIndex
  const selectedEdu = education[selectedPlayerIndex]
  const selectedEducationStatus =
    selectedEdu?.activeStudy === 'bachelor'
      ? `Bachelor study: ${selectedEdu.skipTurns} skipped turn(s) left`
      : selectedEdu?.activeStudy === 'master'
        ? `Master study: ${selectedEdu.skipTurns} skipped turn(s) left`
        : selectedEdu?.stage === 'masterCompleted'
          ? `Master completed: +${educationIncomeBonus.masterCompleted}% income`
          : selectedEdu?.stage === 'bachelorCompleted'
            ? `Bachelor completed: +${educationIncomeBonus.bachelorCompleted}% income`
            : 'Not enrolled'

  return (
    <main className="game-shell">
      <div className="game-layout">
        <section className="board" aria-label="Monopoly style board prototype">
          {Array.from({ length: tileCount }, (_, tile) => {
            const occupants = tileOccupants[tile] ?? []
            const tileBusinesses = businessesByTile[tile] ?? []
            const tileBusinessMarkers = tileBusinesses.reduce<
              Record<number, { count: number; maxLevel: number; owner: Player }>
            >((markers, business) => {
              const existingMarker = markers[business.playerIndex]

              markers[business.playerIndex] = {
                count: (existingMarker?.count ?? 0) + 1,
                maxLevel: Math.max(existingMarker?.maxLevel ?? 0, business.level),
                owner: players[business.playerIndex],
              }

              return markers
            }, {})
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
                {tileBusinesses.length > 0 && (
                  <div className="business-markers" aria-label={`Businesses on ${tileData.name}`}>
                    {Object.entries(tileBusinessMarkers).map(
                      ([playerIndex, marker]) => (
                        <span
                          className={`business-marker ${marker.owner.colorClass}`}
                          key={`${tile}-${playerIndex}`}
                          title={`${marker.owner.name}: ${marker.count} business${marker.count > 1 ? 'es' : ''}, max level ${marker.maxLevel}`}
                        >
                          {marker.maxLevel}
                        </span>
                      ),
                    )}
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
              phase === 'game-over' ||
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

          <div className="console-toggles">
            <button
              className={`dev-mode-toggle ${devMode ? 'active' : ''}`}
              type="button"
              onClick={() => setDevMode(!devMode)}
            >
              🛠 Dev Mode: {devMode ? 'ON' : 'OFF'}
            </button>
            <button
              className={`sound-toggle-btn ${soundOn ? 'active' : 'muted'}`}
              type="button"
              onClick={() => setSoundOn(toggleSound())}
            >
              {soundOn ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
            </button>
          </div>

          {devMode && (
            <>
              <div className="test-move-panel" aria-label="Prototype test move controls">
                <span>Test Move</span>
                <div>
                  {testMoveOptions.map((steps) => (
                    <button
                      disabled={phase !== 'ready' || winnerIndex !== null}
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
                    <button
                      disabled={winnerIndex !== null}
                      key={amount}
                      type="button"
                      onClick={() => addDevCashToPlayer(amount)}
                    >
                      +{amount >= 1000000 ? '1M' : `${amount / 1000}K`}
                    </button>
                  ))}
                  <button
                    disabled={winnerIndex !== null}
                    type="button"
                    onClick={() => addDevCashToAll(devAllCashAmount)}
                  >
                    All +500K
                  </button>
                </div>
              </div>

              <div className="dev-sim-panel" aria-label="Economy simulation controls">
                <span>Balance Simulator</span>
                <div>
                  <button
                    className="dev-sim-trigger-btn"
                    type="button"
                    onClick={() => {
                      setIsSimModalOpen(true)
                      if (!simResults) {
                        runSimulations(simBatchSize, simTargetNW)
                      }
                    }}
                  >
                    📊 Run Balance Sim
                  </button>
                </div>
              </div>
            </>
          )}

          <button className="secondary-action" type="button" onClick={resetGame}>
            Reset
          </button>

          <p className="status-text">{status}</p>

          <div className="jackpot-summary" aria-label="Prison Jackpot">
            <span>Prison Jackpot</span>
            <strong>{formatMoney(prisonJackpot)}</strong>
          </div>

          <button className="net-worth-button" type="button" onClick={() => setIsNetWorthOpen(true)}>
            <span>Net Worth / Target {formatCompactMoney(targetNetWorth)}</span>
            <strong>{players[netWorthRows[0].playerIndex].name}</strong>
            <em>{formatMoney(netWorthRows[0].total)}</em>
          </button>

          <div className="compact-tile-summary" aria-label="Current tile summary">
            <span>{activeTile.id.toString().padStart(2, '0')}</span>
            <strong>{activeTile.name}</strong>
          </div>

          </div>
        </section>

        <aside className="player-ledger" aria-label="Player details">
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
              <dl className="player-quick-stats">
                <div>
                  <dt>Cash</dt>
                  <dd>{formatMoney(cash[selectedPlayerIndex])}</dd>
                </div>
                <div>
                  <dt>Income</dt>
                  <dd>{formatMoney(selectedPlayerIncome)}</dd>
                </div>
                <div className="education-stat">
                  <dt>Education</dt>
                  <dd>{selectedEducationStatus}</dd>
                </div>
              </dl>
              <div className="player-badges">
                {education[selectedPlayerIndex]?.stage === 'masterCompleted' && (
                  <span className="player-badge badge-education">🎓 Master (+30%)</span>
                )}
                {education[selectedPlayerIndex]?.stage === 'bachelorCompleted' && (
                  <span className="player-badge badge-education">🎓 Bachelor (+15%)</span>
                )}
                {education[selectedPlayerIndex]?.activeStudy !== 'none' && (
                  <span className="player-badge badge-studying">
                    📚 Studying ({education[selectedPlayerIndex]?.skipTurns} left)
                  </span>
                )}
                {taxReliefTurns[selectedPlayerIndex] > 0 && (
                  <span className="player-badge badge-shield">
                    🛡 Tax Relief ({taxReliefTurns[selectedPlayerIndex]})
                  </span>
                )}
                {prisonContactCoupons[selectedPlayerIndex] && (
                  <span className="player-badge badge-coupon">🎟 5% Coupon</span>
                )}
                {prisonTurns[selectedPlayerIndex] > 0 && (
                  <span className="player-badge badge-jail">
                    🔒 Jail ({prisonTurns[selectedPlayerIndex]} left)
                  </span>
                )}
              </div>
            </div>

            <div className="ledger-section">
              <span>Next Income Event</span>
              {selectedPlayerIncomeModifiers.length === 0 ? (
                <p>No active event.</p>
              ) : (
                selectedPlayerIncomeModifiers.map((modifier) => (
                  <p key={modifier.id}>
                    {modifier.eventTitle}: {Math.round(modifier.multiplier * 100)}% on {modifier.scope}
                  </p>
                ))
              )}
              {leasePressurePlayers[selectedPlayerIndex] && (
                <p>{selectedPlayerLeasePressureStatus}</p>
              )}
              {taxReliefTurns[selectedPlayerIndex] > 0 && (
                <p>🛡 Tax Relief: {taxReliefTurns[selectedPlayerIndex]} rent immunity charge(s) left</p>
              )}
            </div>

            <div className="inventory-panel" aria-label={`${selectedPlayer.name} card inventory`}>
              <section className="inventory-section">
                <div className="inventory-heading">
                  <span>Property Cards</span>
                  <strong>{selectedPlayerBusinesses.length + selectedPlayerLandHoldings.length}</strong>
                </div>
                <div className="mini-card-list property-card-grid">
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
                      <em>{formatMoney(getBusinessHoldingIncome(business))}</em>
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
                      <em>{landPolicyLabels[holding.policy]}</em>
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
            <div className="choice-modal" role="dialog" aria-modal="true">
          {phase === 'card-choice' && (
            <div className="card-choice" aria-label="Action card choices">
              <span>Choose one business card</span>
              <div className="action-cards">
                {businessCards.map((card) => {
                  const existingBusiness = currentPlayerBusinessesOnActiveTile.find(
                    (business) => business.cardId === card.id,
                  )
                  const nextLevel = existingBusiness ? existingBusiness.level + 1 : 1
                  const isMaxLevel = Boolean(
                    existingBusiness && existingBusiness.level >= maxBusinessLevel,
                  )
                  const canAfford = cash[currentPlayerIndex] >= card.price
                  const isPolicyBlocked = Boolean(activeTilePolicyBlock)
                  const nextIncome = getBusinessIncomeAtLevel(
                    card,
                    Math.min(nextLevel, maxBusinessLevel),
                  )

                  return (
                    <button
                      className="action-card"
                      disabled={!canAfford || isMaxLevel || isPolicyBlocked}
                      key={card.id}
                      type="button"
                      onClick={() => buyOrUpgradeBusinessCard(card)}
                    >
                      <strong>{card.title}</strong>
                      <span>{existingBusiness ? `Current Lv.${existingBusiness.level}` : 'New business'}</span>
                      <span>
                        {isMaxLevel ? 'Max Level' : `${existingBusiness ? 'Upgrade' : 'Cost'} ${formatMoney(card.price)}`}
                      </span>
                      <span>
                        {isMaxLevel
                          ? `Income ${formatMoney(getBusinessIncomeAtLevel(card, maxBusinessLevel))} / round`
                          : `Next income ${formatMoney(nextIncome)} / round`}
                      </span>
                      <p>{card.description}</p>
                      {isPolicyBlocked && <em>{activeTilePolicyBlock}</em>}
                      {!canAfford && !isMaxLevel && <em>Not enough cash</em>}
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
                    const existingBusiness = currentPlayerBusinessesOnInvestmentTile.find(
                      (business) => business.cardId === card.id,
                    )
                    const nextLevel = existingBusiness ? existingBusiness.level + 1 : 1
                    const isMaxLevel = Boolean(
                      existingBusiness && existingBusiness.level >= maxBusinessLevel,
                    )
                    const canAfford = cash[currentPlayerIndex] >= card.price
                    const isPolicyBlocked = Boolean(selectedInvestmentTilePolicyBlock)
                    const nextIncome = getBusinessIncomeAtLevel(
                      card,
                      Math.min(nextLevel, maxBusinessLevel),
                    )

                    return (
                      <button
                        disabled={!canAfford || isMaxLevel || isPolicyBlocked}
                        key={card.id}
                        type="button"
                        onClick={() => buyOrUpgradeInvestmentCard(card, selectedInvestmentTile)}
                      >
                        <strong>{card.title}</strong>
                        <span>{existingBusiness ? `Current Lv.${existingBusiness.level}` : 'New business'}</span>
                        <span>
                          {isMaxLevel ? 'Max Level' : `${existingBusiness ? 'Upgrade' : 'Cost'} ${formatMoney(card.price)}`}
                        </span>
                        <span>
                          {isMaxLevel
                            ? `Income ${formatMoney(getBusinessIncomeAtLevel(card, maxBusinessLevel))} / round`
                            : `Next income ${formatMoney(nextIncome)} / round`}
                        </span>
                        <p>{card.description}</p>
                        {isPolicyBlocked && <em>{selectedInvestmentTilePolicyBlock}</em>}
                        {!canAfford && !isMaxLevel && <em>Not enough cash</em>}
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
                <p>
                  Buy one card to keep in hand. You can hold up to {maxInfluenceCards} influence cards.{' '}
                  <strong style={{ color: '#d9534f' }}>🚨 20% risk of police raid!</strong>
                </p>
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
                {selectedLandHolding && (
                  <div className="land-buy-price">
                    <span>Current Owner</span>
                    <strong>{players[selectedLandHolding.playerIndex].name}</strong>
                  </div>
                )}
                {selectedLandHolding && (
                  <div className="land-policy-panel">
                    <div>
                      <span>Land Policy</span>
                      <strong>{landPolicyLabels[selectedLandHolding.policy]}</strong>
                    </div>
                    {canCurrentPlayerEditSelectedLandPolicy && (
                      <div className="land-policy-actions" aria-label="Land policy controls">
                        <button
                          className={selectedLandHolding.policy === 'openLease' ? 'active' : ''}
                          type="button"
                          onClick={() => updateLandPolicy(selectedLandHolding.tileId, 'openLease')}
                        >
                          Open Lease
                        </button>
                        <button
                          className={selectedLandHolding.policy === 'ownerOnly' ? 'active' : ''}
                          type="button"
                          onClick={() => updateLandPolicy(selectedLandHolding.tileId, 'ownerOnly')}
                        >
                          Owner Only
                        </button>
                      </div>
                    )}
                    <p>
                      {selectedLandHolding.policy === 'openLease'
                        ? `Other players can buy or upgrade businesses here. Owner receives ${Math.round(openLeaseShareRate * 100)}% of tenant income at tile 00.`
                        : 'Other players cannot buy or upgrade businesses here. Existing tenant businesses remain on the land.'}
                    </p>
                  </div>
                )}
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
                    <div className="education-actions">
                      <button type="button" onClick={() => startStudy('bachelor')}>
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
                    <div className="education-actions">
                      <button type="button" onClick={() => startStudy('master')}>
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
                    <strong>Land Policy</strong>
                    <span>{landPolicyLabels[selectedInventoryLand.policy]}</span>
                    <span>
                      {selectedInventoryLand.policy === 'openLease'
                        ? `Open Lease: other players may buy or upgrade businesses here.`
                        : 'Owner Only: other players cannot buy or upgrade businesses here.'}
                    </span>
                    {canCurrentPlayerEditInventoryLandPolicy && (
                      <div className="land-policy-actions detail-policy-actions" aria-label="Land policy controls">
                        <button
                          className={selectedInventoryLand.policy === 'openLease' ? 'active' : ''}
                          type="button"
                          onClick={() => updateLandPolicy(selectedInventoryLand.tileId, 'openLease')}
                        >
                          Open Lease
                        </button>
                        <button
                          className={selectedInventoryLand.policy === 'ownerOnly' ? 'active' : ''}
                          type="button"
                          onClick={() => updateLandPolicy(selectedInventoryLand.tileId, 'ownerOnly')}
                        >
                          Owner Only
                        </button>
                      </div>
                    )}
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
                    <span>{canUseSelectedInfluence ? 'Ready to use' : 'AI-held card. Manual use is Player-only in Demo 1.'}</span>
                    <span>Jail-risk roll will be added later.</span>
                    {canUseSelectedInfluence && (
                      <button
                        className="use-card-button"
                        type="button"
                        onClick={() => playInfluenceCard(selectedInventoryInfluence)}
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
                      Future influence-card risk can send players here. While in prison, skipped-turn income
                      feeds the jackpot.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

          {zoningPermitCardId !== null && (
            <div className="zoning-permit-choice" aria-label="Zoning Permit Upgrade Choice">
              <span>Zoning Permit Free Upgrade</span>
              <div className="zoning-card">
                <strong>Select one business to upgrade by +1 level for free</strong>
                <div className="zoning-options">
                  {businesses
                    .filter((b) => b.playerIndex === currentPlayerIndex)
                    .map((b) => (
                      <button
                        disabled={b.level >= maxBusinessLevel}
                        key={b.id}
                        type="button"
                        onClick={() => resolveZoningPermitUpgrade(b.id)}
                      >
                        <strong>{b.title}</strong>
                        <span>{boardTiles[b.tileId].name}</span>
                        <span>
                          {b.level >= maxBusinessLevel
                            ? 'Max Level'
                            : `Lv.${b.level} ➔ Lv.${b.level + 1}`}
                        </span>
                      </button>
                    ))}
                </div>
                <button
                  className="skip-zoning"
                  type="button"
                  onClick={() => setZoningPermitCardId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {evictionCardId !== null && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal eviction-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Influence Eviction</span>
                  <strong>Choose Target</strong>
                </div>
                <button type="button" onClick={() => setEvictionCardId(null)}>
                  Cancel
                </button>
              </div>

              <div className="eviction-target-list">
                {evictionTargets.length === 0 ? (
                  <p className="empty-detail">No rival business can be removed right now.</p>
                ) : (
                  evictionTargets.map((business) => (
                    <button
                      className="eviction-target"
                      key={business.id}
                      type="button"
                      onClick={() => resolveInfluenceEviction(business.id)}
                    >
                      <strong>{business.title}</strong>
                      <span>
                        {players[business.playerIndex].name} |{' '}
                        {boardTiles[business.tileId].id.toString().padStart(2, '0')}{' '}
                        {boardTiles[business.tileId].name}
                      </span>
                      <span>
                        Lv.{business.level} | Refund {formatMoney(Math.round(business.pricePaid * 0.5))}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {winnerRow && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal winner-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Demo 1 Winner</span>
                  <strong>{winnerRow.player.name}</strong>
                </div>
                <button type="button" onClick={resetGame}>
                  New Game
                </button>
              </div>

              <div className="winner-summary">
                <span className={`token ledger-token ${winnerRow.player.shape} ${winnerRow.player.colorClass}`} />
                <div>
                  <span>Target Net Worth</span>
                  <strong>{formatMoney(targetNetWorth)}</strong>
                </div>
                <div>
                  <span>Final Net Worth</span>
                  <strong>{formatMoney(winnerRow.total)}</strong>
                </div>
              </div>

              <div className="net-worth-list">
                {netWorthRows.map((row, index) => (
                  <div className="net-worth-row compact-rank-row" key={row.player.id}>
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isSimModalOpen && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal sim-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Economy Balance Tester & Multi-Game Simulation</span>
                  <strong>📊 Simulation Analytics</strong>
                </div>
                <button type="button" onClick={() => setIsSimModalOpen(false)}>
                  Close
                </button>
              </div>

              <div className="sim-controls">
                <div className="sim-setting-group">
                  <span>Batch Size:</span>
                  <div className="sim-btn-group">
                    {[10, 50, 100].map((size) => (
                      <button
                        key={size}
                        className={simBatchSize === size ? 'active' : ''}
                        type="button"
                        onClick={() => {
                          setSimBatchSize(size)
                          runSimulations(size, simTargetNW)
                        }}
                      >
                        {size} Games
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sim-setting-group">
                  <span>Target Net Worth:</span>
                  <div className="sim-btn-group">
                    {[5000000, 10000000, 15000000].map((tgt) => (
                      <button
                        key={tgt}
                        className={simTargetNW === tgt ? 'active' : ''}
                        type="button"
                        onClick={() => {
                          setSimTargetNW(tgt)
                          runSimulations(simBatchSize, tgt)
                        }}
                      >
                        {tgt / 1000000}M
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="sim-run-btn"
                  disabled={isSimRunning}
                  type="button"
                  onClick={() => runSimulations(simBatchSize, simTargetNW)}
                >
                  {isSimRunning ? '⏳ Simulating Games...' : '🔄 Re-run Simulation'}
                </button>
              </div>

              {simResults && (
                <div className="sim-results-grid">
                  <div className="sim-card win-rates-card">
                    <h4>🏆 Win Distribution ({simResults.totalGames} Games)</h4>
                    <div className="win-bars">
                      {players.map((p, idx) => (
                        <div key={p.id} className="win-bar-row">
                          <span className="win-bar-label">{p.name}</span>
                          <div className="win-bar-track">
                            <div
                              className={`win-bar-fill ${p.colorClass}`}
                              style={{ width: `${simResults.winPercentages[idx]}%` }}
                            />
                          </div>
                          <span className="win-bar-val">
                            {simResults.winPercentages[idx]}% ({simResults.winCounts[idx]})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sim-card stats-summary-card">
                    <h4>⏱ Game Length & Pacing</h4>
                    <dl className="sim-dl">
                      <div>
                        <dt>Avg Rounds to Win</dt>
                        <dd>{simResults.avgRoundsToWin} rounds</dd>
                      </div>
                      <div>
                        <dt>Fastest Win</dt>
                        <dd>{simResults.minRoundsToWin} rounds</dd>
                      </div>
                      <div>
                        <dt>Longest Game</dt>
                        <dd>{simResults.maxRoundsToWin} rounds</dd>
                      </div>
                      <div>
                        <dt>Avg Winner Net Worth</dt>
                        <dd>{formatMoney(simResults.avgWinnerNetWorth)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="sim-card zone-heatmap-card">
                    <h4>🗺 Zone Revenue Heatmap</h4>
                    <dl className="sim-dl">
                      {Object.entries(simResults.zoneRevenuePercentages).map(([zone, pct]) => (
                        <div key={zone}>
                          <dt>{zone}</dt>
                          <dd>{pct}%</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="sim-card economy-velocity-card">
                    <h4>💼 Economy Velocity & Metrics</h4>
                    <dl className="sim-dl">
                      <div>
                        <dt>Avg Winner Businesses</dt>
                        <dd>{simResults.avgWinnerBusinesses} stores</dd>
                      </div>
                      <div>
                        <dt>Avg Winner Lands</dt>
                        <dd>{simResults.avgWinnerLands} lands</dd>
                      </div>
                      <div>
                        <dt>Avg Rent Flow / Game</dt>
                        <dd>{formatMoney(simResults.avgRentPerGame)}</dd>
                      </div>
                      <div>
                        <dt>Avg Open Lease Flow</dt>
                        <dd>{formatMoney(simResults.avgLeaseSharePerGame)}</dd>
                      </div>
                      <div>
                        <dt>Avg Police Raids</dt>
                        <dd>{simResults.avgPoliceRaidsPerGame} raids</dd>
                      </div>
                      <div>
                        <dt>Avg Degrees Completed</dt>
                        <dd>{simResults.avgDegreesPerGame} degrees</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isNetWorthOpen && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal net-worth-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>Current Ranking / Target {formatMoney(targetNetWorth)}</span>
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

        {toastMessage && (
          <div className={`toast-notification toast-${toastMessage.tone}`} role="status">
            <span>{toastMessage.text}</span>
          </div>
        )}

        <div className="cash-float-container" aria-hidden="true">
          {cashFloats.map((cf) => (
            <div key={cf.id} className={`cash-float-chip float-${cf.tone}`}>
              {cf.text}
            </div>
          ))}
        </div>

        {winnerRow && <ConfettiCanvas />}
      </div>
    </main>
  )
}

export default App
