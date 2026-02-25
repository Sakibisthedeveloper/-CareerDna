import type { Metadata } from "next"
import { Suspense } from "react"
import { ResultsScreen } from "@/components/results-screen"

export const metadata: Metadata = {
  title: "Your Results - CareerDNA",
  description:
    "Your CareerDNA results are in! See your top career match and personality strengths.",
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[oklch(0.65_0.25_300)]" />
          <p className="text-sm text-muted-foreground">Loading your results…</p>
        </div>
      </div>
    }>
      <ResultsScreen />
    </Suspense>
  )
}
