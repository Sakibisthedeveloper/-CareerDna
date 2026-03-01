import { Dna } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 px-6 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.04)] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)]">
              <Dna className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Career<span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">DNA</span>
            </span>
          </a>

          {/* Tagline */}
          <p className="max-w-md text-pretty text-base font-medium text-muted-foreground">
            Built for students who think beyond engineering and medicine.
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="/#careers" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Careers</a>
            <a href="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">About</Link>
            <Link href="/connect" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Connect</Link>
          </div>

          {/* Divider */}
          <div className="h-px w-full max-w-sm bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/70">
            {"\u00A9"} 2026 CareerDNA. Made with care in India.
          </p>
        </div>
      </div>
    </footer>
  )
}
