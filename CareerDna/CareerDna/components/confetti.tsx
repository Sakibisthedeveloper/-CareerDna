"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  delay: number
  duration: number
}

const COLORS = [
  "oklch(0.65 0.25 300)",
  "oklch(0.72 0.19 55)",
  "oklch(0.55 0.2 280)",
  "oklch(0.8 0.15 55)",
  "oklch(0.7 0.22 310)",
]

export function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -(Math.random() * 20 + 5),
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.8,
      duration: Math.random() * 2 + 2,
    }))
    setParticles(generated)
  }, [])

  if (particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <div
            className="h-3 w-2 rounded-sm"
            style={{
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
