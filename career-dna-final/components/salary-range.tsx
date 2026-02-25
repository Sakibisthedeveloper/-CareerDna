"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"

interface SalaryMarker {
  label: string
  salary: string
  position: number
}

interface SalaryRangeProps {
  markers: SalaryMarker[]
}

export function SalaryRange({ markers }: SalaryRangeProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm sm:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.65_0.25_300/0.15)] to-[oklch(0.72_0.19_55/0.1)] ring-1 ring-[oklch(0.65_0.25_300/0.2)]">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Salary Range in India</h2>
              <p className="text-sm text-muted-foreground">What you can expect to earn at each level</p>
            </div>
          </div>

          {/* Range bar */}
          <div className="relative">
            {/* Track */}
            <div className="relative h-3 overflow-hidden rounded-full bg-secondary/80">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] transition-all duration-1000 ease-out"
                style={{ width: animated ? "100%" : "0%" }}
              />
            </div>

            {/* Markers */}
            <div className="relative mt-2 h-24">
              {markers.map((marker) => (
                <div
                  key={marker.label}
                  className="absolute flex flex-col items-center transition-all duration-700 ease-out"
                  style={{
                    left: `${marker.position}%`,
                    transform: "translateX(-50%)",
                    opacity: animated ? 1 : 0,
                    transitionDelay: `${marker.position * 6 + 400}ms`,
                  }}
                >
                  {/* Dot */}
                  <div className="h-4 w-4 rounded-full border-[3px] border-background bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] shadow-[0_0_12px_oklch(0.65_0.25_300/0.4)]" />

                  {/* Line */}
                  <div className="h-4 w-px bg-border/60" />

                  {/* Label */}
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-sm font-bold text-accent">{marker.salary}</span>
                    <span className="text-[11px] text-muted-foreground">{marker.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
