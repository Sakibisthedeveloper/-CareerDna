import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { CareerCards } from "@/components/career-cards"
import { HowItWorks } from "@/components/how-it-works"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CareerCards />
      <HowItWorks />
      <Footer />
    </main>
  )
}
