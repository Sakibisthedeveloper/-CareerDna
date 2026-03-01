"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react"

import { CareerHero } from "@/components/career-hero"
import { SalaryRange } from "@/components/salary-range"
import { SkillsSection } from "@/components/skills-section"
import { RoadmapTimeline } from "@/components/roadmap-timeline"

import { Career } from "@/lib/career-data"

// Helper to generate salary markers from career data
const getSalaryMarkers = (career: Career) => [
  { label: "Fresher", salary: career.salaries.fresher, position: 5 },
  { label: "Mid-Level", salary: career.salaries.mid, position: 38 },
  { label: "Senior", salary: career.salaries.senior, position: 70 },
  { label: "Lead / Principal", salary: career.salaries.lead, position: 95 },
]



// Career-specific skills mapping
const careerSkills: Record<string, string[]> = {
  "ux-designer": ["Figma", "User Research", "Wireframing", "Prototyping", "HTML/CSS Basics"],
  "content-creator": ["Video Editing", "Storytelling", "SEO", "Analytics", "Copywriting"],
  "graphic-designer": ["Adobe Illustrator", "Photoshop", "Typography", "Branding", "Figma"],
  "data-scientist": ["Python", "SQL", "Machine Learning", "Statistics", "Data Visualization"],
  "financial-analyst": ["Excel", "Financial Modeling", "Valuation", "Economics", "PowerPoint"],
  "research-analyst": ["Research", "Data Visualization", "Report Writing", "Excel", "Critical Thinking"],
  "product-manager": ["Roadmapping", "User Research", "Agile", "Data Analysis", "Communication"],
  "hr-manager": ["Recruitment", "Labor Law", "Conflict Resolution", "Communication", "HRIS"],
  "digital-marketer": ["SEO/SEM", "Social Media Ads", "Google Analytics", "Copywriting", "Email Marketing"],
  "software-developer": ["JavaScript", "React", "Node.js", "Git", "Problem Solving"],
  "cybersecurity-expert": ["Networking", "Linux", "Ethical Hacking", "CompTIA", "Scripting"],
  "devops-engineer": ["Docker", "Kubernetes", "CI/CD", "Linux", "Cloud (AWS/GCP)"],
}

interface Props {
  career: Career
}

export function CareerExplorePage({ career }: Props) {
  const searchParams = useSearchParams()
  const userName = searchParams.get("name") || "Explorer"
  const personalityType = searchParams.get("type") || "creative"

  const emoji = career.emoji
  const skills = careerSkills[career.id] ?? career.traits

  const roadmapSteps = career.roadmap.map((r) => ({
    title: r.step,
    detail: r.description,
    duration: "Self-paced",
    cost: "Free",
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />


      <CareerHero
        title={career.title}
        emoji={emoji}
        description={career.description}
        backHref={`/results?${searchParams.toString()}`}
      />

      <div className="relative z-10">
        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <SalaryRange markers={getSalaryMarkers(career)} />

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <SkillsSection skills={skills} />

        {/* Divider */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <RoadmapTimeline steps={roadmapSteps} />

        {/* Unified Bottom CTA */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="text-2xl font-bold mb-8 items-center justify-center flex flex-col gap-4">
              <span className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em]">Next Step</span>
              <span className="italic">"The best time to start was yesterday. The second best time is now."</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quiz"
                className="flex items-center justify-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-8 py-4 text-sm font-bold text-foreground transition-all hover:bg-secondary focus:ring-4 focus:ring-secondary/20 outline-none"
              >
                <RotateCcw className="h-4 w-4" />
                Try Different DNA
              </Link>
              <Link
                href={`https://www.google.com/search?q=best+courses+for+${career.title.replace(' ', '+')}+in+India+2026`}
                target="_blank"
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-8 py-4 text-sm font-bold text-background transition-all hover:opacity-90 focus:ring-4 focus:ring-foreground/20 outline-none"
              >
                Start Learning Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom tagline */}
        <p className="pb-12 text-center text-xs text-muted-foreground/60">
          Built for students who think beyond engineering and medicine.
        </p>
      </div>
    </div>
  )
}
