import type { Metadata } from "next"
import { QuizScreen } from "@/components/quiz-screen"

export const metadata: Metadata = {
  title: "Take the Quiz - CareerDNA",
  description: "Answer 10 quick questions to discover your perfect career match. Takes less than 2 minutes.",
}

export default function QuizPage() {
  return <QuizScreen />
}
