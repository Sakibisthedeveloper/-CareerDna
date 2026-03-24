"use client"

import { Dna, X } from "lucide-react"
import Link from "next/link"

interface QuizHeaderProps {
  currentQuestion: number
  totalQuestions: number
}

export function QuizHeader({ currentQuestion, totalQuestions }: QuizHeaderProps) {
  const progress = (currentQuestion / totalQuestions) * 100

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)]">
            <Dna className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-foreground sm:inline">
            {"Career"}
            <span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">
              {"DNA"}
            </span>
          </span>
        </Link>

        <div className="flex flex-1 flex-col items-center px-6">
          <span className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
            {"Question "}
            <span className="text-foreground">{currentQuestion}</span>
            {" of "}
            {totalQuestions}
          </span>
          <div className="relative h-2 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-0 h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300/0.5)] to-[oklch(0.72_0.19_55/0.5)] blur-sm transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Exit quiz"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}
