export interface TestQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number // Индекс правильного ответа (0-based)
  explanation: string // Краткое пояснение правильного ответа
}

export interface TestConfig {
  questionCount: 5 | 10 | 15
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface TestResult {
  totalQuestions: number
  correctAnswers: number
  score: number // Процент правильных ответов
  answers: Array<{
    questionId: number
    selectedAnswer: number | null
    correctAnswer: number
    isCorrect: boolean
    explanation: string
  }>
}





