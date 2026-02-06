export type InteractiveAnswerType = 'choice' | 'number' | 'formula'

export type InteractiveStepType = 'formula' | 'substitution' | 'calculation' | 'text'

export interface InteractiveTaskStep {
  id: string
  type: InteractiveStepType
  content: string
  description?: string
}

export interface InteractiveTaskGivenItem {
  symbol: string
  value: string
  unit?: string
  name?: string
}

export interface InteractiveTaskFind {
  symbol: string
  unit?: string
  name?: string
}

export interface InteractiveTask {
  id: string
  title: string
  difficulty: 'basic' | 'standard' | 'advanced'
  condition: string
  given?: InteractiveTaskGivenItem[]
  find?: InteractiveTaskFind
  answerType: InteractiveAnswerType
  options?: string[]
  correctAnswer?: string | number
  steps: InteractiveTaskStep[]
  answer: string
  hint?: string
}
