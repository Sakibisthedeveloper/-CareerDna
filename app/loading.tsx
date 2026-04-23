"use client"

import { Dna } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.2)] blur-xl" />
        
        {/* Spinner */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] animate-bounce shadow-[0_0_20px_oklch(0.65_0.25_300/0.4)]">
          <Dna className="h-8 w-8 text-primary-foreground animate-pulse" />
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Sequencing your <span className="bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] bg-clip-text text-transparent">DNA</span>
        </h2>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] animate-[loading_1.5s_infinite_ease-in-out]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
