"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Dna } from "lucide-react"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)]">
            <Dna className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Career<span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">DNA</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="/#careers" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Careers</a>
          <a href="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
          <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</Link>
          <Link href="/connect" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Connect</Link>
          <Link
            href="/quiz"
            className="rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-5 py-2 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[0_0_24px_oklch(0.65_0.25_300/0.4)]"
          >
            Start Quiz
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-foreground md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6" id="mobile-menu">
            <a href="/#careers" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Careers</a>
            <a href="/#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</Link>
            <Link href="/connect" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground transition-colors hover:text-foreground">Connect</Link>
            <Link
              href="/quiz"
              onClick={() => setMobileOpen(false)}
              className="inline-block rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-5 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Start Quiz
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
