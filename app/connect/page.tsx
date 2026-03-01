import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ConnectSection } from "@/components/connect-section"

export default function ConnectPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20">
                <ConnectSection />
            </div>
            <Footer />
        </main>
    )
}
