"use client"

import { useEffect, useState } from "react"
import { Map, CheckCircle2 } from "lucide-react"

interface RoadmapStep {
  title: string
  detail: string
  duration: string
  cost: string
}

interface RoadmapTimelineProps {
  steps: RoadmapStep[]
}

export function RoadmapTimeline({ steps }: RoadmapTimelineProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative px-6 py-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.05)] blur-[100px]" />

      <div className="relative mx-auto max-w-4xl">
        {/* Section header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.65_0.25_300/0.15)] to-[oklch(0.72_0.19_55/0.1)] ring-1 ring-[oklch(0.65_0.25_300/0.2)]">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Roadmap</h2>
            <p className="text-sm text-muted-foreground">A step-by-step plan to get started</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[oklch(0.65_0.25_300/0.4)] via-[oklch(0.65_0.25_300/0.2)] to-transparent sm:left-6" />

          <div className="flex flex-col gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex gap-5 sm:gap-6 transition-all duration-600"
                style={{
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateX(0)" : "translateX(-16px)",
                  transitionDelay: `${index * 150 + 300}ms`,
                  transitionDuration: "600ms",
                }}
              >
                {/* Step number node */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] text-sm font-bold text-primary-foreground shadow-[0_0_16px_oklch(0.65_0.25_300/0.3)] sm:h-12 sm:w-12">
                  {index + 1}
                </div>

                {/* Content card */}
                <div className="group flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.65_0.25_300/0.3)] hover:bg-card/80 sm:p-6">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[oklch(0.65_0.25_300/0.03)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative z-10">
                    <h3 className="text-base font-bold text-foreground sm:text-lg">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>

                    {/* Meta badges */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.72_0.19_55/0.1)] px-3 py-1 text-xs font-semibold text-accent">
                        <CheckCircle2 className="h-3 w-3" />
                        {step.cost}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {step.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
