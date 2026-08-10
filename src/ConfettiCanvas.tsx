import { useEffect, useRef } from 'react'

type ConfettiPiece = {
  x: number
  y: number
  w: number
  h: number
  color: string
  vx: number
  vy: number
  rot: number
  vRot: number
  opacity: number
}

const COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa',
]

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const width = (canvas.width = window.innerWidth)
    const height = (canvas.height = window.innerHeight)

    const pieces: ConfettiPiece[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 3 + Math.random() * 5,
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
    }))

    function render() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, width, height)

      for (const p of pieces) {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vRot

        if (p.y > height) {
          p.y = -20
          p.x = Math.random() * width
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  )
}
