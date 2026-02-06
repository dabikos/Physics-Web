import { createContext, useContext, useState, ReactNode } from 'react'
import { LessonTopic } from '@/types'

interface LessonContextType {
  selectedTopics: LessonTopic[]
  addTopic: (topic: LessonTopic) => void
  removeTopic: (topicId: string) => void
  clearTopics: () => void
  isTopicSelected: (topicId: string) => boolean
  updateTopic: (topicId: string, updates: Partial<LessonTopic>) => void
}

const LessonContext = createContext<LessonContextType | undefined>(undefined)

export function LessonProvider({ children }: { children: ReactNode }) {
  const [selectedTopics, setSelectedTopics] = useState<LessonTopic[]>([])

  const addTopic = (topic: LessonTopic) => {
    setSelectedTopics(prev => {
      if (prev.some(t => t.id === topic.id)) {
        return prev
      }
      return [...prev, topic]
    })
  }

  const removeTopic = (topicId: string) => {
    setSelectedTopics(prev => prev.filter(t => t.id !== topicId))
  }

  const clearTopics = () => {
    setSelectedTopics([])
  }

  const isTopicSelected = (topicId: string) => {
    return selectedTopics.some(t => t.id === topicId)
  }

  const updateTopic = (topicId: string, updates: Partial<LessonTopic>) => {
    setSelectedTopics(prev => 
      prev.map(topic => 
        topic.id === topicId 
          ? { ...topic, ...updates }
          : topic
      )
    )
  }

  return (
    <LessonContext.Provider value={{ selectedTopics, addTopic, removeTopic, clearTopics, isTopicSelected, updateTopic }}>
      {children}
    </LessonContext.Provider>
  )
}

export function useLesson() {
  const context = useContext(LessonContext)
  if (context === undefined) {
    throw new Error('useLesson must be used within a LessonProvider')
  }
  return context
}

