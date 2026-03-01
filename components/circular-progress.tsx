"use client"

import { useEffect, useState } from "react"

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  percentage,
  size = 140,
  strokeWidth = 10,
}: CircularProgressProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedPercent / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percentage), 300)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow behind the ring */}
      <div
        className="absolute rounded-full blur-xl"
        style={{
          width: size * 0.8,
          height: size * 0.8,
          background: "oklch(0.65 0.25 300 / 0.2)",
        }}
      />
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.22 0.02 280)"
          strokeWidth={strokeWidth}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.65 0.25 300)" />
            <stop offset="100%" stopColor="oklch(0.72 0.19 55)" />
          </linearGradient>
        </defs>
        {/* Animated progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-foreground">
          {animatedPercent}
          <span className="text-lg text-muted-foreground">%</span>
        </span>
        <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Match
        </span>
      </div>
    </div>
  )
}
