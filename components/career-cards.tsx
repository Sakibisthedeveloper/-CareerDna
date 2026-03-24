import { TrendingUp, ArrowRight } from "lucide-react"
import { careers } from "@/lib/career-data"
import Link from "next/link"

export function CareerCards() {
  // Show a selection of 6 careers on the home page
  const displayCareers = careers.slice(0, 6)

  return (
    <section id="careers" className="relative px-6 py-24 md:py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.72_0.19_55/0.05)] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Explore Careers
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Careers your school{" "}
            <span className="bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] bg-clip-text text-transparent">
              never mentioned
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
            These are some of the fastest-growing careers in India right now. Which one fits your DNA?
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayCareers.map((career) => (
            <Link
              key={career.id}
              href={`/career/${career.id}`}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.65_0.25_300/0.4)] hover:bg-card/80 hover:shadow-[0_0_30px_oklch(0.65_0.25_300/0.08)]"
            >
              {/* Hover gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[oklch(0.65_0.25_300/0.04)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                {/* Emoji & Match Badge */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/80 text-2xl">
                    {career.emoji}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-[oklch(0.65_0.25_300/0.1)] px-2 py-1 text-[10px] font-bold text-[oklch(0.65_0.25_300)] opacity-0 transition-opacity group-hover:opacity-100">
                    Explore <ArrowRight className="h-3 w-3" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-foreground">
                  {career.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {career.description}
                </p>

                {/* Salary */}
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-accent">
                    {career.salaryRange}
                  </span>
                  <span className="text-xs text-muted-foreground">LPA</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
