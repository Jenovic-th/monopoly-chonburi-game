import { useMemo, useRef, useState } from 'react'
import { boardTiles } from './boardData'
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

type EducationStage = 'none' | 'bachelorCompleted' | 'masterCompleted'

type ActiveStudy = 'none' | 'bachelor' | 'master'

type EducationState = {
  stage: EducationStage
  activeStudy: ActiveStudy
  skipTurns: number
}

type BuraphaChoice = 'bachelor' | 'master' | 'alumni'

type InvestmentOffer = {
  playerIndex: number
  visitCount: number
  maxTile: number
  options: number[]
}

type ActionCard = {
  id: string
  title: string
  description: string
}

type InvestmentCard = {
  id: string
  title: string
  cost: string
  income: string
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
const investmentBankTile = 0
const buraphaTile = 10
const walkDelayMs = 55
const aiDelayMs = 140
const noCardTiles = new Set([0, 5, 10, 20, 30])
const investmentUnlockRanges = [9, 19, 29, 39]
const actionCards: ActionCard[] = [
  {
    id: 'street-trade',
    title: 'Street Trade',
    description: 'Prepare a small local business option for this tile.',
  },
  {
    id: 'local-deal',
    title: 'Local Deal',
    description: 'Reserve this choice for future buying or negotiation systems.',
  },
  {
    id: 'area-scout',
    title: 'Area Scout',
    description: 'Review this location before future investment decisions.',
  },
]
const investmentCards: InvestmentCard[] = [
  {
    id: 'small-stall',
    title: 'Small Stall',
    cost: '30,000',
    income: '3,000 / round',
    description: 'A low-risk starter business for testing local demand.',
  },
  {
    id: 'local-shop',
    title: 'Local Shop',
    cost: '120,000',
    income: '12,000 / round',
    description: 'A steady shop with better visibility and stronger repeat income.',
  },
  {
    id: 'anchor-business',
    title: 'Anchor Business',
    cost: '500,000',
    income: '55,000 / round',
    description: 'A large investment placeholder for the main business slot.',
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

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
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

function App() {
  const [positions, setPositions] = useState<number[]>(() => players.map(() => 0))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [latestRoll, setLatestRoll] = useState<DiceRoll | null>(null)
  const [status, setStatus] = useState('Ready. Roll to start the round.')
  const [rollHistory, setRollHistory] = useState<string[]>([])
  const [education, setEducation] = useState<EducationState>({
    stage: 'none',
    activeStudy: 'none',
    skipTurns: 0,
  })
  const [buraphaChoice, setBuraphaChoice] = useState<BuraphaChoice | null>(null)
  const [investmentVisits, setInvestmentVisits] = useState<number[]>(() => players.map(() => 0))
  const [investmentOffer, setInvestmentOffer] = useState<InvestmentOffer | null>(null)
  const [selectedInvestmentTile, setSelectedInvestmentTile] = useState<number | null>(null)

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
  const aiDelayResolverRef = useRef<(() => void) | null>(null)
  const cardChoiceResolverRef = useRef<(() => void) | null>(null)
  const educationChoiceResolverRef = useRef<(() => void) | null>(null)
  const investmentChoiceResolverRef = useRef<(() => void) | null>(null)

  const tileOccupants = useMemo(() => {
    return positions.reduce<Record<number, number[]>>((occupants, position, index) => {
      occupants[position] = [...(occupants[position] ?? []), index]
      return occupants
    }, {})
  }, [positions])

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

  async function movePlayer(playerIndex: number, steps: number, runId: number) {
    skipRequestedRef.current = false
    setPhase('moving')
    let finalPosition = positionsRef.current[playerIndex]

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
    setStatus(`${players[playerIndex].name} stopped at ${boardTiles[finalPosition].name}.`)
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

    const roll = rollDice()
    setLatestRoll(roll)
    setStatus(`${player.name} rolled ${roll.die1} + ${roll.die2} = ${roll.total}.`)
    setRollHistory((history) => [
      `${player.name}: ${roll.die1} + ${roll.die2} = ${roll.total}`,
      ...history,
    ].slice(0, 5))

    const finalPosition = await movePlayer(playerIndex, roll.total, runId)

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
      player.role === 'Human' &&
      finalPosition === buraphaTile
    ) {
      await handleBuraphaTile()
      return
    }

    if (
      runId === runIdRef.current &&
      player.role === 'Human' &&
      typeof finalPosition === 'number' &&
      !noCardTiles.has(finalPosition)
    ) {
      setPhase('card-choice')
      setStatus(`Choose a card for ${boardTiles[finalPosition].name}, or skip.`)
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
      setStatus('Player finished studying at Burapha University.')
    } else {
      setStatus(`Player is studying at Burapha University. ${remainingTurns} turn left.`)
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
      phase === 'investment-card-choice'
    ) {
      return
    }

    skipRequestedRef.current = true
    setStatus('Skipping movement.')
  }

  function resolveCardChoice(message: string) {
    setStatus(message)
    cardChoiceResolverRef.current?.()
  }

  function resolveEducationChoice(message: string) {
    setStatus(message)
    educationChoiceResolverRef.current?.()
  }

  function resolveInvestmentChoice(message: string) {
    setStatus(message)
    investmentChoiceResolverRef.current?.()
  }

  function openInvestmentCards(tile: number) {
    setSelectedInvestmentTile(tile)
    setPhase('investment-card-choice')
    setStatus(`Choose an investment card for ${boardTiles[tile].name}, or skip.`)
  }

  function startStudy(activeStudy: Exclude<ActiveStudy, 'none'>) {
    updateEducation({
      stage: educationRef.current.stage,
      activeStudy,
      skipTurns: 2,
    })
    resolveEducationChoice(
      activeStudy === 'bachelor'
        ? 'Player started studying at Burapha University. Skip 2 turns.'
        : 'Player started master degree at Burapha University. Skip 2 turns.',
    )
  }

  function resetGame() {
    runIdRef.current += 1
    skipRequestedRef.current = true
    aiDelayResolverRef.current?.()
    cardChoiceResolverRef.current?.()
    educationChoiceResolverRef.current?.()
    investmentChoiceResolverRef.current?.()
    activeRunRef.current = false
    updatePositions(players.map(() => 0))
    updateEducation({
      stage: 'none',
      activeStudy: 'none',
      skipTurns: 0,
    })
    setBuraphaChoice(null)
    updateInvestmentVisits(players.map(() => 0))
    setInvestmentOffer(null)
    setSelectedInvestmentTile(null)
    setCurrentPlayerIndex(0)
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
          : 'Skip Move'
  const activeTile = boardTiles[positions[currentPlayerIndex]]

  return (
    <main className="game-shell">
      <section className="board" aria-label="Monopoly style board prototype">
        {Array.from({ length: tileCount }, (_, tile) => {
          const occupants = tileOccupants[tile] ?? []
          const isCorner = tile === 0 || tile === 10 || tile === 20 || tile === 30
          const tileData = boardTiles[tile]

          return (
            <div
              className={`tile tile-${tileData.category} ${isCorner ? 'corner-tile' : ''} ${tile === 0 ? 'start-tile' : ''}`}
              key={tile}
              style={getTileGridPosition(tile)}
            >
              <span className="tile-number">{tile.toString().padStart(2, '0')}</span>
              <span className="tile-name">{tileData.name}</span>
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

        <div className="control-panel">
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
              phase === 'investment-card-choice'
            }
            onClick={handlePrimaryAction}
          >
            {primaryButtonText}
          </button>

          {phase === 'card-choice' && (
            <div className="card-choice" aria-label="Action card choices">
              <span>Choose one card</span>
              <div className="action-cards">
                {actionCards.map((card) => (
                  <button
                    className="action-card"
                    key={card.id}
                    type="button"
                    onClick={() => resolveCardChoice(`Selected ${card.title}.`)}
                  >
                    <strong>{card.title}</strong>
                    <p>{card.description}</p>
                  </button>
                ))}
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
                  {investmentCards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() =>
                        resolveInvestmentChoice(
                          `Selected ${card.title} at ${selectedInvestmentTile.toString().padStart(2, '0')} ${boardTiles[selectedInvestmentTile].name}.`,
                        )
                      }
                    >
                      <strong>{card.title}</strong>
                      <span>Invest {card.cost}</span>
                      <span>Income {card.income}</span>
                      <p>{card.description}</p>
                    </button>
                  ))}
                </div>
                <button
                  className="skip-investment"
                  type="button"
                  onClick={() =>
                    resolveInvestmentChoice(
                      `Skipped investment cards for ${selectedInvestmentTile.toString().padStart(2, '0')} ${boardTiles[selectedInvestmentTile].name}.`,
                    )
                  }
                >
                  Skip this tile
                </button>
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
                    <p>ถ้าเลือกเรียนต่อ ผู้เล่นจะหยุด 2 เทิร์น แล้วจึงกลับมาทอยได้อีกครั้ง</p>
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
                    <p>ต้องกลับมาตกช่องนี้อีกครั้งจึงมีตัวเลือกนี้ ถ้าเลือกเรียนจะหยุด 2 เทิร์น</p>
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

          <button className="secondary-action" type="button" onClick={resetGame}>
            Reset
          </button>

          <p className="status-text">{status}</p>

          <div className="tile-detail" aria-label="Current tile details">
            <span>{activeTile.zone}</span>
            <strong>{activeTile.name}</strong>
            <p>{activeTile.description}</p>
          </div>

          <div className="player-list" aria-label="Players">
            {players.map((player, index) => (
              <div className="player-row" key={player.id}>
                <span className={`token legend-token ${player.shape} ${player.colorClass}`} />
                <span>{player.name}</span>
                <strong>Tile {positions[index]}</strong>
              </div>
            ))}
          </div>

          <div className="education-status" aria-label="Burapha University study status">
            <span>Burapha</span>
            <strong>
              {education.activeStudy === 'bachelor'
                ? `Bachelor study: ${education.skipTurns} turn left`
                : education.activeStudy === 'master'
                  ? `Master study: ${education.skipTurns} turn left`
                  : education.stage === 'masterCompleted'
                    ? 'Master completed'
                    : education.stage === 'bachelorCompleted'
                      ? 'Bachelor completed'
                      : 'Not enrolled'}
            </strong>
          </div>

          <div className="investment-status" aria-label="Investment Bank visit status">
            <span>Invest</span>
            <strong>
              {players
                .map((player, index) => `${player.name} ${investmentVisits[index]}`)
                .join(' | ')}
            </strong>
          </div>

          <div className="history">
            <span>Recent Rolls</span>
            {rollHistory.length === 0 ? (
              <p>No rolls yet.</p>
            ) : (
              rollHistory.map((item) => <p key={item}>{item}</p>)
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
