// Procedural Web Audio Synthesizer for Monopoly Chonburi
// Zero external asset dependencies - 100% offline & instantaneous

let audioCtx: AudioContext | null = null
let soundEnabled = true

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled
}

export function isSoundEnabled(): boolean {
  return soundEnabled
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled
  return soundEnabled
}

// 🎲 Dice Roll Sound: Fast tumbling rattles and stop thud
export function playDiceRollSound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const numRattles = 4

  for (let i = 0; i < numRattles; i += 1) {
    const time = now + i * 0.05
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = i === numRattles - 1 ? 'triangle' : 'square'
    osc.frequency.setValueAtTime(i === numRattles - 1 ? 120 : 250 + Math.random() * 200, time)

    gain.gain.setValueAtTime(0.08, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.04)
  }
}

// 🪙 Money Sound: Crisp coin clinking & cash register chime
export function playMoneySound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const freqs = [987.77, 1318.51] // B5 -> E6

  freqs.forEach((freq, idx) => {
    const time = now + idx * 0.07
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)

    gain.gain.setValueAtTime(0.12, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.18)
  })
}

// 🏢 Business Upgrade Sound: Ascending 3-tone arpeggio
export function playUpgradeSound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 -> E5 -> G5 -> C6

  notes.forEach((freq, idx) => {
    const time = now + idx * 0.06
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    gain.gain.setValueAtTime(0.14, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.16)
  })
}

// 🏰 Land Buy Sound: Rich triumphant major chord
export function playLandBuySound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const chord = [261.63, 329.63, 392.0, 523.25] // C4, E4, G4, C5

  chord.forEach((freq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.45)
  })
}

// 🚨 Police Raid Sound: Urgent two-tone alert siren
export function playPoliceRaidSound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const sirens = [880, 659.25, 880, 659.25]

  sirens.forEach((freq, idx) => {
    const time = now + idx * 0.09
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)

    gain.gain.setValueAtTime(0.09, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.08)
  })
}

// 🎓 Graduation Sound: Academic fanfare sequence
export function playGraduationSound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const melody = [
    { freq: 392.0, dur: 0.12 }, // G4
    { freq: 523.25, dur: 0.12 }, // C5
    { freq: 659.25, dur: 0.12 }, // E5
    { freq: 783.99, dur: 0.25 }, // G5
    { freq: 1046.5, dur: 0.4 },  // C6
  ]

  let offset = 0
  melody.forEach((note) => {
    const time = now + offset
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(note.freq, time)

    gain.gain.setValueAtTime(0.12, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + note.dur)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + note.dur)

    offset += note.dur * 0.75
  })
}

// 🛡 Shield Sound: Protective barrier deflection whoosh
export function playShieldSound() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, now)
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.15)
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.3)

  gain.gain.setValueAtTime(0.15, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.3)
}

// 🏆 Victory Fanfare: Glorious celebratory brass fanfare
export function playVictoryFanfare() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const fanfare = [
    { freq: 523.25, time: 0.0, dur: 0.15 },  // C5
    { freq: 523.25, time: 0.16, dur: 0.15 }, // C5
    { freq: 523.25, time: 0.32, dur: 0.15 }, // C5
    { freq: 659.25, time: 0.48, dur: 0.35 }, // E5
    { freq: 587.33, time: 0.85, dur: 0.15 }, // D5
    { freq: 783.99, time: 1.02, dur: 0.6 },  // G5
    { freq: 1046.5, time: 1.65, dur: 0.9 },  // C6
  ]

  fanfare.forEach((note) => {
    const time = now + note.time
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(note.freq, time)

    gain.gain.setValueAtTime(0.18, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + note.dur)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + note.dur)
  })
}

// 🔘 Button Click
export function playButtonBeep() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(600, now)

  gain.gain.setValueAtTime(0.04, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.04)
}
