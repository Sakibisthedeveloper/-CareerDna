import Link from "next/link"
import { ArrowLeft, Dna } from "lucide-react"

interface CareerHeroProps {
  title: string
  emoji: string
  description: string
  backHref?: string
}

export function CareerHero({ title, emoji, description, backHref = "/results" }: CareerHeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pt-28 pb-16">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.1)] blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-[oklch(0.72_0.19_55/0.07)] blur-[100px]" />
      </div>

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
          <Link
            href={backHref}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Results</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.25_300/0.15)] to-[oklch(0.72_0.19_55/0.1)] text-5xl ring-1 ring-[oklch(0.65_0.25_300/0.2)]" suppressHydrationWarning>
          {emoji}
        </div>
        <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
          {description}
        </p>
      </div>
    </section>
  )
}
