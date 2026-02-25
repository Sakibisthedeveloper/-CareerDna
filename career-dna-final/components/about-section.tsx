import { Info } from "lucide-react"

export function AboutSection() {
    return (
        <section id="about" className="relative overflow-hidden px-6 py-24">
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 ring-1 ring-border/60">
                    <Info className="h-6 w-6 text-accent" />
                </div>
                <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    About <span className="text-accent">CareerDNA</span>
                </h2>
                <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                    CareerDNA is dedicated to helping students discover fulfilling career paths beyond the traditional options like engineering and medicine.
                    Our platform uses AI-powered analysis to match your unique personality traits and interests with modern, high-growth careers in India.
                    We believe everyone deserves to find work that feels like play, and we're here to provide the roadmap to get there.
                </p>
            </div>
        </section>
    )
}
