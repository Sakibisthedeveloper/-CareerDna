import { Metadata } from "next"
import { notFound } from "next/navigation"
import { CareerExplorePage } from "@/components/career-explore-page"
import { careers } from "@/lib/career-data"

export async function generateStaticParams() {
    return careers.map((c) => ({ id: c.id }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>
}): Promise<Metadata> {
    const { id } = await params
    const career = careers.find((c) => c.id === id)
    if (!career) return {}
    return {
        title: `${career.title} - CareerDNA`,
        description: `Explore a career as a ${career.title}. Learn the skills, salary range, and roadmap to get started in India.`,
    }
}

import { Suspense } from "react"

export default async function CareerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const career = careers.find((c) => c.id === id)
    if (!career) notFound()
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-[oklch(0.65_0.25_300)]" />
                    <p className="text-sm text-muted-foreground">Loading career data...</p>
                </div>
            </div>
        }>
            <CareerExplorePage career={career} />
        </Suspense>
    )
}
