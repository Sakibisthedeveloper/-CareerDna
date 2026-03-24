import Link from "next/link"
import { MessageCircleQuestion, Target, BookOpen } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: MessageCircleQuestion,
    title: "Answer Questions",
    description: "Take a quick 10-question quiz about your interests, strengths, and what excites you.",
  },
  {
    number: "02",
    icon: Target,
    title: "Get Matched",
    description: "Our AI analyzes your answers and matches you with careers that fit your unique DNA.",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Start Learning",
    description: "Get a personalized roadmap with courses, mentors, and resources to launch your career.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24 md:py-32">
      {/* Top divider */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Background glow */}
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.06)] blur-[120px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            How It Works
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Three steps to your{" "}
            <span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">
              dream career
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-16 hidden h-px w-6 translate-x-full bg-gradient-to-r from-border to-transparent md:block" />
              )}

              <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.65_0.25_300/0.4)] hover:shadow-[0_0_30px_oklch(0.65_0.25_300/0.08)]">
                {/* Step number watermark */}
                <span className="absolute -right-2 -top-4 font-mono text-[80px] font-bold leading-none text-foreground/[0.03]">
                  {step.number}
                </span>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.65_0.25_300/0.15)] to-[oklch(0.72_0.19_55/0.1)] ring-1 ring-[oklch(0.65_0.25_300/0.2)]">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground">{step.title}</h3>

                  {/* Description */}
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/quiz"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_32px_oklch(0.65_0.25_300/0.3)] transition-all duration-300 hover:shadow-[0_0_48px_oklch(0.65_0.25_300/0.5)] hover:scale-[1.03]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10">Find My Career Now</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">Takes less than 2 minutes</p>
        </div>
      </div>
    </section>
  )
}
