import { Mail, MessageSquare } from "lucide-react"

export function ConnectSection() {
    return (
        <section id="connect" className="relative overflow-hidden px-6 py-24">
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 ring-1 ring-border/60">
                    <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    Stay <span className="text-accent">Connected</span>
                </h2>
                <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                    Have questions, feedback, or want to collaborate? We'd love to hear from you.
                    Reach out to us and let's build the future of career exploration together.
                </p>

                <a
                    href="mailto:syedthesakib@gmail.com"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/50 px-8 py-4 text-lg font-bold text-foreground transition-all duration-300 hover:border-accent/40 hover:bg-secondary/80"
                >
                    <Mail className="h-5 w-5 text-accent" />
                    syedthesakib@gmail.com
                </a>
            </div>
        </section>
    )
}
