"use client"

import { useEffect, useState } from "react"
import { Zap } from "lucide-react"

interface SkillsSectionProps {
  skills: string[]
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm sm:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.65_0.25_300/0.15)] to-[oklch(0.72_0.19_55/0.1)] ring-1 ring-[oklch(0.65_0.25_300/0.2)]">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Skills You Need</h2>
              <p className="text-sm text-muted-foreground">Master these to become job-ready</p>
            </div>
          </div>

          {/* Skill pills */}
          <div className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-[oklch(0.65_0.25_300/0.25)] bg-[oklch(0.65_0.25_300/0.08)] px-4 py-2 text-sm font-semibold text-[oklch(0.82_0.15_300)] transition-all duration-500"
                style={{
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(8px)",
                  transitionDelay: `${index * 80 + 200}ms`,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
