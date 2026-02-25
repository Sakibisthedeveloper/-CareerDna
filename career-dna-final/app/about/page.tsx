import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AboutSection } from "@/components/about-section"

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20">
                <AboutSection />
            </div>
            <Footer />
        </main>
    )
}
