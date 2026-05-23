import { useMemo, useRef, useState } from 'react'
import { boardTiles, type TileCategory } from './boardData'
import {
  businessLevelMultipliers,
  getBusinessCardsForTile,
  type BusinessCard,
} from './businessData'
import './App.css'

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

type PlayerDetailModal = 'businesses' | 'land' | 'influence' | null

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
const investmentBankTile = 0
const politicalEventTile = 5
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
    id: 'clean-exit',
    title: 'Clean Exit Pass',
    price: 300000,
    risk: '20% jail risk when used later',
    description: 'Future effect: leave prison without paying a fee.',
  },
  {
    id: 'half-rent',
    title: 'Half Rent Deal',
    price: 350000,
    risk: '20% jail risk when used later',
    description: 'Future effect: pay only half rent one time.',
  },
  {
    id: 'quiet-permit',
    title: 'Quiet Permit',
    price: 400000,
    risk: '20% jail risk when used later',
    description: 'Future effect: protect one business from a penalty.',
  },
  {
    id: 'land-pressure',
    title: 'Land Pressure',
    price: 500000,
    risk: '20% jail risk when used later',
    description: 'Future effect: pressure a land deal. High-impact placeholder.',
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
  const [, setInvestmentVisits] = useState<number[]>(() => players.map(() => 0))
  const [investmentOffer, setInvestmentOffer] = useState<InvestmentOffer | null>(null)
  const [selectedInvestmentTile, setSelectedInvestmentTile] = useState<number | null>(null)
  const [selectedLandTile, setSelectedLandTile] = useState<number | null>(null)
  const [selectedPoliticalEvent, setSelectedPoliticalEvent] = useState<PoliticalEventCard | null>(null)
  const [incomeModifiers, setIncomeModifiers] = useState<IncomeModifier[]>([])
  const [prisonJackpot, setPrisonJackpot] = useState(0)
  const [influenceOffer, setInfluenceOffer] = useState<InfluenceCard[]>([])
  const [influenceHoldings, setInfluenceHoldings] = useState<InfluenceHolding[]>([])
  const [cash, setCash] = useState<number[]>(() => players.map(() => startingCash))
  const [businesses, setBusinesses] = useState<BusinessHolding[]>([])
  const [landHoldings, setLandHoldings] = useState<LandHolding[]>([])
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0)
  const [playerDetailModal, setPlayerDetailModal] = useState<PlayerDetailModal>(null)

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
  const influenceHoldingsRef = useRef<InfluenceHolding[]>([])
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

  function updateInfluenceHoldings(nextInfluenceHoldings: InfluenceHolding[]) {
    influenceHoldingsRef.current = nextInfluenceHoldings
    setInfluenceHoldings(nextInfluenceHoldings)
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
    const businessIncome = playerBusinesses.reduce((total, business) => {
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

      return total + modifiedIncome
    }, 0)

    return {
      businessIncome,
      modifierSummary: [...modifierSummary],
      usedModifierIds: playerModifiers.map((modifier) => modifier.id),
    }
  }

  function payStartIncome(playerIndex: number, passCount: number) {
    if (passCount <= 0) {
      return null
    }

    const modifiedIncome = getModifiedBusinessIncomeForPlayer(playerIndex)
    const baseRoundIncome = passStartIncome * passCount
    const businessIncome = modifiedIncome.businessIncome * passCount
    const educationBonus = Math.round(businessIncome * getEducationIncomeBonusRate(playerIndex))
    const totalIncome = baseRoundIncome + businessIncome + educationBonus
    const nextCash = [...cashRef.current]
    nextCash[playerIndex] += totalIncome
    updateCash(nextCash)

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
      setStatus(
        `${players[playerIndex].name} passed Investment Bank and received ${formatMoney(payout.totalIncome)}.${eventText} Cash: ${formatMoney(payout.nextCash)}.`,
      )
    } else {
      setStatus(`${players[playerIndex].name} stopped at ${boardTiles[finalPosition].name}.`)
    }
    return finalPosition
  }

  async function playTurn(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    setCurrentPlayerIndex(playerIndex)

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
      await handleBuraphaTile()
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
      setStatus(
        `${player.name} reached Investment Bank visit ${visitCount}. Investment range unlocked: 01-${maxTile}.`,
      )
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

  async function handleBuraphaTile() {
    const currentEducation = educationRef.current
    const nextChoice: BuraphaChoice =
      currentEducation.stage === 'none'
        ? 'bachelor'
        : currentEducation.stage === 'bachelorCompleted'
          ? 'master'
          : 'alumni'

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

      continueStudyRounds = educationRef.current.skipTurns > 0
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
    const existingBusiness = businessesRef.current.find(
      (business) =>
        business.playerIndex === playerIndex &&
        business.tileId === tileId &&
        business.cardId === card.id,
    )

    if (existingBusiness && existingBusiness.level >= maxBusinessLevel) {
      setStatus(`${existingBusiness.title} at ${tile.name} is already max level.`)
      return
    }

    const playerCash = cashRef.current[playerIndex]

    if (playerCash < card.price) {
      setStatus(`${players[playerIndex].name} needs ${formatMoney(card.price)} but only has ${formatMoney(playerCash)}.`)
      return
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
      resolveCardChoice(
        `${players[playerIndex].name} upgraded ${card.title} at ${tile.name} to level ${nextLevel} for ${formatMoney(card.price)}. New income: ${formatMoney(getBusinessIncomeAtLevel(card, nextLevel))} / round.`,
      )
      return
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
    resolveCardChoice(
      `${players[playerIndex].name} bought ${card.title} at ${tile.name} for ${formatMoney(card.price)}. Cash left: ${formatMoney(nextCash[playerIndex])}.`,
    )
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
    buyOrUpgradeBusinessCard(card, tileId)
    investmentChoiceResolverRef.current?.()
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

    const playerCash = cashRef.current[playerIndex]

    if (playerCash < card.price) {
      resolveInfluenceChoice(
        `${players[playerIndex].name} needs ${formatMoney(card.price)} but only has ${formatMoney(playerCash)}.`,
      )
      return
    }

    const nextCash = [...cashRef.current]
    nextCash[playerIndex] -= card.price
    updateCash(nextCash)
    influenceCardIdRef.current += 1
    updateInfluenceHoldings([
      ...influenceHoldingsRef.current,
      {
        id: `${playerIndex}-${card.id}-${influenceCardIdRef.current}`,
        playerIndex,
        cardId: card.id,
        title: card.title,
        pricePaid: card.price,
        risk: card.risk,
        description: card.description,
      },
    ])
    resolveInfluenceChoice(
      `${players[playerIndex].name} bought ${card.title} for ${formatMoney(card.price)}. It is now in their hand (${playerCards.length + 1}/${maxInfluenceCards}).`,
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
    updateEducation({
      stage: educationRef.current.stage,
      activeStudy,
      skipTurns: studySkipTurns,
    })
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
    updateEducation({
      stage: 'none',
      activeStudy: 'none',
      skipTurns: 0,
    })
    setBuraphaChoice(null)
    updateInvestmentVisits(players.map(() => 0))
    updateCash(players.map(() => startingCash))
    updateBusinesses([])
    updateLandHoldings([])
    updateIncomeModifiers([])
    updatePrisonJackpot(0)
    updateInfluenceHoldings([])
    setInvestmentOffer(null)
    setSelectedInvestmentTile(null)
    setSelectedLandTile(null)
    setSelectedPoliticalEvent(null)
    setInfluenceOffer([])
    setCurrentPlayerIndex(0)
    setPlayerDetailModal(null)
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
  const selectedLandTileData = selectedLandTile === null ? null : boardTiles[selectedLandTile]
  const selectedLandHolding =
    selectedLandTile === null ? undefined : landHoldingByTile[selectedLandTile]
  const businessCards = getBusinessCardsForTile(activeTile)
  const currentPlayerBusinessesOnActiveTile = businesses.filter(
    (business) =>
      business.playerIndex === currentPlayerIndex && business.tileId === activeTile.id,
  )
  const selectedInvestmentTileData =
    selectedInvestmentTile === null ? null : boardTiles[selectedInvestmentTile]
  const investmentBusinessCards = selectedInvestmentTileData
    ? getBusinessCardsForTile(selectedInvestmentTileData)
    : []
  const currentPlayerBusinessesOnInvestmentTile =
    selectedInvestmentTile === null
      ? []
      : businesses.filter(
          (business) =>
            business.playerIndex === currentPlayerIndex &&
            business.tileId === selectedInvestmentTile,
        )
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
  const selectedPlayerLandValue = selectedPlayerLandHoldings.reduce(
    (total, holding) => total + holding.pricePaid,
    0,
  )
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
    <main className="game-shell">
      <div className="game-layout">
        <section className="board" aria-label="Monopoly style board prototype">
          {Array.from({ length: tileCount }, (_, tile) => {
            const occupants = tileOccupants[tile] ?? []
            const tileBusinesses = businessesByTile[tile] ?? []
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
                  <span className="land-price">Land {formatMoney(tileData.landPrice)}</span>
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
                    {tileBusinesses.map((business) => {
                      const owner = players[business.playerIndex]

                      return (
                        <span
                          className={`business-marker ${owner.colorClass}`}
                          key={business.id}
                          title={`${owner.name}: ${business.title} level ${business.level}`}
                        >
                          {business.level}
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

          <button className="secondary-action" type="button" onClick={resetGame}>
            Reset
          </button>

          <p className="status-text">{status}</p>

          <div className="jackpot-summary" aria-label="Prison Jackpot">
            <span>Prison Jackpot</span>
            <strong>{formatMoney(prisonJackpot)}</strong>
          </div>

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
                onClick={() => setSelectedPlayerIndex(index)}
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
                <span>Income / round</span>
                <strong>{formatMoney(selectedPlayerIncome)}</strong>
              </div>
            </div>

            <div className="ledger-section">
              <span>Education</span>
              <strong>{selectedEducationStatus}</strong>
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
            </div>

            <div className="ledger-actions">
              <button type="button" onClick={() => setPlayerDetailModal('businesses')}>
                <span>Businesses</span>
                <strong>{selectedPlayerBusinesses.length}</strong>
                <em>{formatMoney(selectedPlayerIncome)} / round</em>
              </button>
              <button type="button" onClick={() => setPlayerDetailModal('land')}>
                <span>Land</span>
                <strong>{selectedPlayerLandHoldings.length}</strong>
                <em>{formatMoney(selectedPlayerLandValue)}</em>
              </button>
              <button type="button" onClick={() => setPlayerDetailModal('influence')}>
                <span>Influence</span>
                <strong>{selectedPlayerInfluenceCards.length}/{maxInfluenceCards}</strong>
                <em>Cards held</em>
              </button>
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
                  const nextIncome = getBusinessIncomeAtLevel(
                    card,
                    Math.min(nextLevel, maxBusinessLevel),
                  )

                  return (
                    <button
                      className="action-card"
                      disabled={!canAfford || isMaxLevel}
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
                    const nextIncome = getBusinessIncomeAtLevel(
                      card,
                      Math.min(nextLevel, maxBusinessLevel),
                    )

                    return (
                      <button
                        disabled={!canAfford || isMaxLevel}
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
                <p>Buy one card to keep in hand. You can hold up to {maxInfluenceCards} influence cards. Risk happens later when the card is used.</p>
                <div className="influence-cards">
                  {influenceOffer.map((card) => {
                    const playerCardCount = influenceHoldings.filter(
                      (holding) => holding.playerIndex === currentPlayerIndex,
                    ).length
                    const canAfford = cash[currentPlayerIndex] >= card.price
                    const handFull = playerCardCount >= maxInfluenceCards

                    return (
                      <button
                        disabled={!canAfford || handFull}
                        key={card.id}
                        type="button"
                        onClick={() => buyInfluenceCard(card)}
                      >
                        <strong>{card.title}</strong>
                        <span>Price {formatMoney(card.price)}</span>
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

        {playerDetailModal && (
          <div className="choice-modal-backdrop">
            <div className="choice-modal player-detail-modal" role="dialog" aria-modal="true">
              <div className="detail-modal-header">
                <div>
                  <span>{selectedPlayer.name}</span>
                  <strong>
                    {playerDetailModal === 'businesses'
                      ? 'Businesses'
                      : playerDetailModal === 'land'
                        ? 'Land Owned'
                        : 'Influence Cards'}
                  </strong>
                </div>
                <button type="button" onClick={() => setPlayerDetailModal(null)}>
                  Close
                </button>
              </div>

              {playerDetailModal === 'businesses' && (
                selectedPlayerBusinesses.length === 0 ? (
                  <p className="empty-detail">No businesses yet.</p>
                ) : (
                  <div className="detail-list">
                    {selectedPlayerBusinesses.map((business) => (
                      <div className="detail-row" key={business.id}>
                        <strong>
                          {boardTiles[business.tileId].id.toString().padStart(2, '0')} {business.title}
                        </strong>
                        <span>
                          Lv.{business.level} | {boardTiles[business.tileId].name}
                        </span>
                        <span>Income {formatMoney(getBusinessHoldingIncome(business))} / round</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {playerDetailModal === 'land' && (
                selectedPlayerLandHoldings.length === 0 ? (
                  <p className="empty-detail">No land owned yet.</p>
                ) : (
                  <div className="detail-list">
                    {selectedPlayerLandHoldings.map((holding) => (
                      <div className="detail-row" key={holding.tileId}>
                        <strong>
                          {boardTiles[holding.tileId].id.toString().padStart(2, '0')}{' '}
                          {boardTiles[holding.tileId].name}
                        </strong>
                        <span>{boardTiles[holding.tileId].zone}</span>
                        <span>Bought for {formatMoney(holding.pricePaid)}</span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {playerDetailModal === 'influence' && (
                selectedPlayerInfluenceCards.length === 0 ? (
                  <p className="empty-detail">No influence cards yet.</p>
                ) : (
                  <div className="detail-list">
                    {selectedPlayerInfluenceCards.map((card) => (
                      <div className="detail-row" key={card.id}>
                        <strong>{card.title}</strong>
                        <span>Paid {formatMoney(card.pricePaid)}</span>
                        <span>{card.risk}</span>
                        <p>{card.description}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
