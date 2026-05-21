import { useMemo, useRef, useState } from 'react'
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

type Phase = 'ready' | 'ai-delay' | 'moving'

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
const walkDelayMs = 55
const aiDelayMs = 140

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
  const [positions, setPositions] = useState<number[]>(players.map(() => 0))
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [latestRoll, setLatestRoll] = useState<DiceRoll | null>(null)
  const [status, setStatus] = useState('Ready. Roll to start the round.')
  const [rollHistory, setRollHistory] = useState<string[]>([])

  const skipRequestedRef = useRef(false)
  const activeRunRef = useRef(false)
  const runIdRef = useRef(0)
  const aiDelayResolverRef = useRef<(() => void) | null>(null)

  const tileOccupants = useMemo(() => {
    return positions.reduce<Record<number, number[]>>((occupants, position, index) => {
      occupants[position] = [...(occupants[position] ?? []), index]
      return occupants
    }, {})
  }, [positions])

  async function movePlayer(playerIndex: number, steps: number, runId: number) {
    skipRequestedRef.current = false
    setPhase('moving')

    let finalPosition = 0

    setPositions((currentPositions) => {
      finalPosition = currentPositions[playerIndex]
      return currentPositions
    })

    for (let step = 0; step < steps; step += 1) {
      if (runId !== runIdRef.current) {
        return
      }

      if (skipRequestedRef.current) {
        setPositions((currentPositions) => {
          const nextPositions = [...currentPositions]
          nextPositions[playerIndex] = (nextPositions[playerIndex] + (steps - step)) % tileCount
          finalPosition = nextPositions[playerIndex]
          return nextPositions
        })
        break
      }

      await wait(walkDelayMs)

      if (runId !== runIdRef.current) {
        return
      }

      setPositions((currentPositions) => {
        const nextPositions = [...currentPositions]
        nextPositions[playerIndex] = (nextPositions[playerIndex] + 1) % tileCount
        finalPosition = nextPositions[playerIndex]
        return nextPositions
      })
    }

    skipRequestedRef.current = false
    setStatus(`${players[playerIndex].name} stopped at tile ${finalPosition}.`)
  }

  async function playTurn(playerIndex: number, runId: number) {
    const player = players[playerIndex]
    setCurrentPlayerIndex(playerIndex)

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

    await movePlayer(playerIndex, roll.total, runId)
  }

  async function playRound() {
    if (activeRunRef.current) {
      return
    }

    activeRunRef.current = true
    const runId = runIdRef.current

    for (let playerIndex = 0; playerIndex < players.length; playerIndex += 1) {
      if (runId !== runIdRef.current) {
        return
      }

      await playTurn(playerIndex, runId)
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

    skipRequestedRef.current = true
    setStatus('Skipping movement.')
  }

  function resetGame() {
    runIdRef.current += 1
    skipRequestedRef.current = true
    aiDelayResolverRef.current?.()
    activeRunRef.current = false
    setPositions(players.map(() => 0))
    setCurrentPlayerIndex(0)
    setPhase('ready')
    setLatestRoll(null)
    setStatus('Game reset. Roll to start the round.')
    setRollHistory([])
  }

  const primaryButtonText =
    phase === 'ready' ? 'Roll Dice' : phase === 'ai-delay' ? 'Fast Forward' : 'Skip Move'

  return (
    <main className="game-shell">
      <section className="board" aria-label="Monopoly style board prototype">
        {Array.from({ length: tileCount }, (_, tile) => {
          const occupants = tileOccupants[tile] ?? []
          const isCorner = tile === 0 || tile === 10 || tile === 20 || tile === 30

          return (
            <div
              className={`tile ${isCorner ? 'corner-tile' : ''} ${tile === 0 ? 'start-tile' : ''}`}
              key={tile}
              style={getTileGridPosition(tile)}
            >
              <span className="tile-number">{tile.toString().padStart(2, '0')}</span>
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

          <button className="primary-action" type="button" onClick={handlePrimaryAction}>
            {primaryButtonText}
          </button>

          <button className="secondary-action" type="button" onClick={resetGame}>
            Reset
          </button>

          <p className="status-text">{status}</p>

          <div className="player-list" aria-label="Players">
            {players.map((player, index) => (
              <div className="player-row" key={player.id}>
                <span className={`token legend-token ${player.shape} ${player.colorClass}`} />
                <span>{player.name}</span>
                <strong>Tile {positions[index]}</strong>
              </div>
            ))}
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
