"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, User, Mail, Loader2 } from "lucide-react"
import { questions as quizQuestions } from "@/lib/quiz-data"
import { QuizHeader } from "@/components/quiz-header"
import { PersonalityType } from "@/lib/quiz-data"
import { createClient } from "@/utils/supabase/client"
import { careers } from "@/lib/career-data"

export function QuizScreen() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, PersonalityType>>({})
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Lead capture states
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const question = quizQuestions[currentIndex]
  const totalQuestions = quizQuestions.length
  const isLastQuestion = currentIndex === totalQuestions - 1

  const handleSelect = useCallback((type: string) => {
    if (isTransitioning) return
    setSelectedOption(type)
  }, [isTransitioning])

  const calculateWinner = (answers: Record<number, PersonalityType>): PersonalityType => {
    const scores: Record<PersonalityType, number> = {
      creative: 0,
      analytical: 0,
      social: 0,
      technical: 0
    };

    Object.values(answers).forEach((type) => {
      if (scores[type] !== undefined) {
        scores[type]++;
      }
    });

    // Tie-breaking priority: technical > analytical > creative > social
    const priority: PersonalityType[] = ['technical', 'analytical', 'creative', 'social'];
    let winner: PersonalityType = 'creative';
    let maxScore = -1;

    priority.forEach(type => {
      if (scores[type] > maxScore) {
        maxScore = scores[type];
        winner = type;
      }
    });

    return winner;
  }

  const handleNext = useCallback(() => {
    if (!selectedOption || isTransitioning) return

    setIsTransitioning(true)
    const newAnswers = { ...answers, [question.id]: selectedOption as PersonalityType };
    setAnswers(newAnswers)

    setTimeout(() => {
      if (isLastQuestion) {
        setShowLeadForm(true)
      } else {
        setCurrentIndex((prev) => prev + 1)
        setSelectedOption(null)
      }
      setIsTransitioning(false)
    }, 300)
  }, [selectedOption, isTransitioning, question?.id, isLastQuestion, answers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || isSubmitting) return

    setIsSubmitting(true)

    const scores: Record<PersonalityType, number> = {
      creative: 0,
      analytical: 0,
      social: 0,
      technical: 0
    };

    (Object.values(answers) as PersonalityType[]).forEach((type) => {
      if (scores[type] !== undefined) {
        scores[type]++;
      }
    });

    const winner = calculateWinner(answers)

    // Find top 3 matches for this personality type
    const matches = careers
      .filter(c => c.matchType === winner)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 3)

    // Construct scores query string safely
    const scoresQuery = (Object.keys(scores) as PersonalityType[])
      .map((type) => `${type[0]}=${scores[type]}`)
      .join('&')

    // Save to Supabase
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('quiz_results')
        .insert({
          name: name,
          email: email,
          personality_type: winner,
          career_1: matches[0]?.title || null,
          career_2: matches[1]?.title || null,
          career_3: matches[2]?.title || null,
          traits: matches[0]?.traits || [],
          scores: scores
        })

      if (error) {
        console.error("Supabase Error Full:", error);
        console.error("Supabase Error Message:", error.message);
      }
    } catch (err) {
      console.error("Unexpected Save Error:", err)
    }

    setTimeout(() => {
      setIsSubmitting(false)
      router.push(`/results?type=${winner}&name=${encodeURIComponent(name)}&${scoresQuery}`)
    }, 1500)
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTransitioning || showLeadForm) return;
      const key = e.key.toLowerCase()
      const options = question?.options;
      if (!options) return;

      const keyIndex = ["a", "b", "c", "d"].indexOf(key);
      if (keyIndex >= 0 && keyIndex < options.length) {
        handleSelect(options[keyIndex].type);
      }

      if (key === "enter" && selectedOption) {
        handleNext()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSelect, handleNext, selectedOption, isTransitioning, question?.options, showLeadForm])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <QuizHeader
        currentQuestion={showLeadForm ? totalQuestions : currentIndex + 1}
        totalQuestions={totalQuestions}
      />

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.65_0.25_300/0.08)] blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-[oklch(0.72_0.19_55/0.05)] blur-[120px]" />
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.97 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.97 0 0) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-24 pb-12">
        {!showLeadForm ? (
          <div
            className={`w-full max-w-2xl transition-all duration-300 ${isTransitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
              }`}
          >
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase backdrop-blur-sm">
                {"Question "}{currentIndex + 1}
              </span>
            </div>

            <h2 className="mb-10 text-center text-2xl font-extrabold leading-snug tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl">
              {question?.text}
            </h2>

            <div className="flex flex-col gap-3">
              {question?.options.map((option, index) => {
                const isSelected = selectedOption === option.type
                const letter = String.fromCharCode(65 + index);

                return (
                  <button
                    key={index}
                    onClick={() => handleSelect(option.type)}
                    className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 sm:p-6 ${isSelected
                      ? "border-[oklch(0.65_0.25_300/0.6)] bg-[oklch(0.65_0.25_300/0.1)] shadow-[0_0_30px_oklch(0.65_0.25_300/0.12)]"
                      : "border-border/60 bg-card/50 hover:border-border hover:bg-card/80"
                      }`}
                  >
                    {isSelected && (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[oklch(0.65_0.25_300/0.05)] to-[oklch(0.72_0.19_55/0.03)]" />
                    )}

                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 ${isSelected
                          ? "bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] text-primary-foreground shadow-[0_0_16px_oklch(0.65_0.25_300/0.3)]"
                          : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                          }`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          letter
                        )}
                      </div>

                      <span
                        className={`text-sm leading-relaxed transition-colors duration-200 sm:text-base ${isSelected ? "text-foreground font-medium" : "text-secondary-foreground"
                          }`}
                      >
                        {option.text}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div
              className={`mt-8 flex justify-center transition-all duration-300 ${selectedOption ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
                }`}
            >
              <button
                onClick={handleNext}
                disabled={!selectedOption || isTransitioning}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] px-8 py-4 text-base font-bold text-primary-foreground shadow-[0_0_32px_oklch(0.65_0.25_300/0.3)] transition-all duration-300 hover:shadow-[0_0_48px_oklch(0.65_0.25_300/0.5)] hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center gap-2">
                  {isLastQuestion ? "Finish Quiz" : "Next Question"}
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] p-3 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">You're all set!</h2>
              <p className="mt-2 text-muted-foreground">Enter your details to see your personalized career matches.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-2xl border border-border/60 bg-card/50 py-4 pl-12 pr-4 outline-none transition-all focus:border-[oklch(0.65_0.25_300/0.6)] focus:ring-4 focus:ring-[oklch(0.65_0.25_300/0.1)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border border-border/60 bg-card/50 py-4 pl-12 pr-4 outline-none transition-all focus:border-[oklch(0.65_0.25_300/0.6)] focus:ring-4 focus:ring-[oklch(0.65_0.25_300/0.1)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !email}
                className="group relative mt-6 w-full overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.65_0.25_300)] to-[oklch(0.72_0.19_55)] py-4 text-lg font-bold text-primary-foreground shadow-[0_0_32px_oklch(0.65_0.25_300/0.3)] transition-all duration-300 hover:shadow-[0_0_48px_oklch(0.65_0.25_300/0.5)] hover:scale-[1.02] disabled:opacity-50"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[oklch(0.72_0.19_55)] to-[oklch(0.65_0.25_300)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing Your DNA...
                    </>
                  ) : (
                    <>
                      See My Results
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
