import { useState, useEffect } from 'react'
import { TopicSubsection, LessonTopic } from '@/types'
import { getSectionsWithTopics, getAllTopicsForSection } from '@/lib/supabaseTopics'
import { allTopics, getAllTopicsForSection as getLocalTopics } from '@/data/allTopics'

// Флаг для переключения между локальными данными и Supabase
// Если VITE_SUPABASE_URL установлен, используем Supabase, иначе локальные данные
const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_USE_SUPABASE !== 'false'

export function useTopics() {
  const [sectionsData, setSectionsData] = useState<Record<string, TopicSubsection[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true)
        
        if (USE_SUPABASE) {
          // Загрузка из Supabase
          const data = await getSectionsWithTopics()
          setSectionsData(data)
        } else {
          // Использование локальных данных
          setSectionsData(allTopics)
        }
        
        setError(null)
      } catch (err) {
        console.error('Ошибка загрузки тем:', err)
        setError('Не удалось загрузить данные')
        // Fallback на локальные данные при ошибке
        setSectionsData(allTopics)
      } finally {
        setLoading(false)
      }
    }

    loadTopics()
  }, [])

  const getAllTopics = async (sectionId: string): Promise<LessonTopic[]> => {
    if (USE_SUPABASE) {
      return await getAllTopicsForSection(sectionId)
    } else {
      return getLocalTopics(sectionId)
    }
  }

  return {
    sectionsData,
    loading,
    error,
    getAllTopics,
  }
}

