export type NavItem = 'lesson' | 'world' | 'library' | 'ai' | 'connect' | 'worksheet' | 'settings'

export interface LessonTopic {
    id: string
    title: string
    description: string
    theory?: string
    formulas?: string[]
    examples?: string[]
    problems?: string[]
}

export interface TopicSubsection {
    id: string
    title: string
    topics: LessonTopic[]
}

export * from './test'
export * from './interactive'
