import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.12)] blur-[120px]" />
        <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_55/0.08)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:text-left">
          <div className="flex-1">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium tracking-wide text-muted-foreground">
                SMART CAREER MATCHING
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Discover The Career{" "}
              <span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] via-[oklch(0.6_0.22_330)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">
                Nobody Told You About
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground md:text-xl">
              Answer 10 questions. Get your perfect career match in 2 minutes. Built for students who think beyond engineering and medicine.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/quiz"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_32px_oklch(0.65_0.25_300/0.35)] transition-all duration-300 hover:shadow-[0_0_48px_oklch(0.65_0.25_300/0.55)] hover:scale-[1.03]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center gap-2">
                  Start the Quiz
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <div className="flex flex-col items-start px-2">
                <span className="text-sm font-semibold text-foreground">Free forever</span>
                <span className="text-xs text-muted-foreground">No credit card or sign-up</span>
              </div>
            </div>


          </div>

          {/* Visual Element: Animated Helix */}
          <div className="relative hidden w-full max-w-sm lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.65_0.25_300/0.2)] to-transparent blur-[60px]" />
            <div className="relative flex aspect-square flex-col justify-center gap-4 py-12">
              {/* Helix Bars */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-auto h-2 rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] opacity-80"
                  style={{
                    width: `${Math.sin(i * 0.5) * 40 + 60}%`,
                    animation: `pulse ${2 + i * 0.1}s ease-in-out infinite alternate`,
                    transform: `rotate(${i * 15}deg)`,
                  }}
                />
              ))}

              {/* Floating Cards */}
              <div className="absolute -left-12 top-0 animate-bounce rounded-2xl border border-border/50 bg-card/80 p-4 shadow-xl backdrop-blur-md" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[oklch(0.65_0.25_300/0.2)] flex items-center justify-center text-accent">🎨</div>
                  <div>
                    <div className="text-xs font-bold">UX Designer</div>
                    <div className="text-[10px] text-muted-foreground">98% Match</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-8 bottom-12 animate-bounce rounded-2xl border border-border/50 bg-card/80 p-4 shadow-xl backdrop-blur-md" style={{ animationDuration: '4s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[oklch(0.72_0.19_55/0.2)] flex items-center justify-center text-accent">📊</div>
                  <div>
                    <div className="text-xs font-bold">Data Scientist</div>
                    <div className="text-[10px] text-muted-foreground">92% Match</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
