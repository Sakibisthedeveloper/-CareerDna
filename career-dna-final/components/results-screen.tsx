"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Dna,
  RotateCcw,
  Share2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { CircularProgress } from "@/components/circular-progress"
import { Confetti } from "@/components/confetti"
import { careers, Career } from "@/lib/career-data"
import { PersonalityType } from "@/lib/quiz-data"

export function ResultsScreen() {
  const searchParams = useSearchParams()
  const resultType = (searchParams.get("type") as PersonalityType) || "creative"
  const userName = searchParams.get("name") || "Explorer"

  const [showConfetti, setShowConfetti] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [primaryMatch, setPrimaryMatch] = useState<Career | null>(null)
  const [altMatches, setAltMatches] = useState<Career[]>([])

  useEffect(() => {
    // Find matches based on result type
    const matches = careers
      .filter((c) => c.matchType === resultType)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)

    if (matches.length > 0) {
      // Calculate dynamic match percentage based on score
      // Score of 3-4 -> ~85%, 5-6 -> ~92%, 7-8 -> ~96%, 9-10 -> 99%
      const winningScore = parseInt(searchParams.get(resultType.charAt(0)) || "0")
      const dynamicMatch = Math.min(99, 80 + winningScore * 3)

      setPrimaryMatch({ ...matches[0], matchPercentage: dynamicMatch })
      setAltMatches(matches.slice(1, 3))
    } else {
      setPrimaryMatch(careers[0])
      setAltMatches([careers[1], careers[2]])
    }

    const t1 = setTimeout(() => setRevealed(true), 200)
    const t2 = setTimeout(() => setShowConfetti(false), 4000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [resultType, searchParams])

  function handleShare() {
    const text = `I just discovered my CareerDNA! My top match is ${primaryMatch?.title} with a ${primaryMatch?.matchPercentage}% match. Take the quiz: ${typeof window !== "undefined" ? window.location.origin : ""}/quiz`
    if (navigator.share) {
      navigator.share({ title: "My CareerDNA Result", text }).catch(() => { })
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  if (!primaryMatch) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showConfetti && <Confetti />}

      {/* Sticky header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)]">
              <Dna className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              {"Career"}
              <span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">
                {"DNA"}
              </span>
            </span>
          </Link>
          <div className="flex gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[oklch(0.65_0.25_300/0.3)] bg-[oklch(0.65_0.25_300/0.1)] px-4 py-2 text-sm font-medium text-[oklch(0.65_0.25_300)]">
              <CheckCircle2 className="h-4 w-4" />
              Saved to Cloud
            </div>
            <Link
              href="/quiz"
              className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Retake Quiz</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.1)] blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_55/0.06)] blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-24">
        {/* Celebration header */}
        <div
          className={`mb-12 text-center transition-all duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Results Ready
            </span>
          </div>
          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            <span suppressHydrationWarning>{"\uD83C\uDF89"}</span> Ready,{" "}
            {userName}!
          </h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
            We've analyzed your responses. Here is your unique Career DNA breakdown.
          </p>
        </div>

        {/* Personality Breakdown */}
        <div
          className={`mb-12 grid gap-4 grid-cols-2 sm:grid-cols-4 transition-all delay-100 duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          {[
            { label: "Creative", key: "c", color: "oklch(0.65 0.25 300)" },
            { label: "Analytical", key: "a", color: "oklch(0.72 0.19 55)" },
            { label: "Social", key: "s", color: "oklch(0.55 0.2 280)" },
            { label: "Technical", key: "t", color: "oklch(0.6 0.22 330)" },
          ].map((item) => {
            const score = parseInt(searchParams.get(item.key) || "0")
            const percent = (score / 10) * 100
            return (
              <div key={item.key} className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm">
                <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${revealed ? percent : 0}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}40`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{item.label}</span>
                  <span className="text-xs font-bold text-foreground">{score}/10</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Primary match card */}
        <div
          className={`relative mb-8 overflow-hidden rounded-3xl border border-[oklch(0.65_0.25_300/0.3)] bg-card/60 p-6 backdrop-blur-sm transition-all delay-300 duration-700 sm:p-8 ${revealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          {/* Card background glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[oklch(0.65_0.25_300/0.06)] via-transparent to-[oklch(0.72_0.19_55/0.04)]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[oklch(0.65_0.25_300/0.08)] blur-[80px]" />

          {/* Top badge */}
          <div className="relative mb-6 flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-3 py-1 text-xs font-bold tracking-wide text-primary-foreground uppercase">
              Best Match
            </span>
          </div>

          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-start">
            {/* Circular progress */}
            <div className="shrink-0">
              <CircularProgress percentage={primaryMatch.matchPercentage} />
            </div>

            {/* Career details */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {primaryMatch.title}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {primaryMatch.description}
              </p>

              {/* Traits */}
              <div className="mt-5 flex flex-col gap-2">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Why you matched
                </span>
                {primaryMatch.traits.map((trait) => (
                  <div key={trait} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[oklch(0.65_0.25_300)]" />
                    <span className="text-sm font-medium text-secondary-foreground">
                      {trait}
                    </span>
                  </div>
                ))}
              </div>

              {/* Salary + CTA row */}
              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-2.5">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm font-bold text-accent">
                    {primaryMatch.salaryRange}
                  </span>
                  <span className="text-xs text-muted-foreground">/ year</span>
                </div>
                <Link
                  href={`/career/${primaryMatch.id}?name=${encodeURIComponent(userName)}&type=${resultType}`}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_24px_oklch(0.65_0.25_300/0.3)] transition-all duration-300 hover:shadow-[0_0_40px_oklch(0.65_0.25_300/0.5)] hover:scale-[1.03]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10 flex items-center gap-2">
                    Explore This Career
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* "Also Great For You" section */}
        <div
          className={`mb-12 transition-all delay-400 duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <h3 className="mb-4 text-center text-sm font-semibold tracking-widest text-muted-foreground uppercase sm:text-left">
            Also great for you
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {altMatches.map((match) => (
              <div
                key={match.title}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.65_0.25_300/0.3)] hover:bg-card/80 hover:shadow-[0_0_24px_oklch(0.65_0.25_300/0.06)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[oklch(0.65_0.25_300/0.03)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="text-base font-bold text-foreground">
                          {match.title}
                        </h4>
                      </div>
                    </div>
                    <span className="rounded-full bg-[oklch(0.65_0.25_300/0.12)] px-3 py-1 text-xs font-bold text-[oklch(0.75_0.2_300)]">
                      {match.matchPercentage}%
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                    {match.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-semibold text-accent">
                      {match.salaryRange}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      / year
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div
          className={`flex flex-col items-center gap-4 transition-all delay-600 duration-700 sm:flex-row sm:justify-center ${revealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
        >
          <Link
            href="/quiz"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-6 py-3.5 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-secondary hover:shadow-[0_0_20px_oklch(0.65_0.25_300/0.08)] sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Link>
          <button
            onClick={handleShare}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_0_24px_oklch(0.65_0.25_300/0.3)] transition-all duration-300 hover:shadow-[0_0_40px_oklch(0.65_0.25_300/0.5)] hover:scale-[1.03] sm:w-auto"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              {copied ? "Copied to Clipboard!" : "Share My Result"}
            </span>
          </button>
        </div>

        {/* Bottom tagline */}
        <p className="mt-16 text-center text-xs text-muted-foreground/60">
          Built for students who think beyond engineering and medicine.
        </p>
      </main>
    </div>
  )
}
