import { useState, useEffect } from 'react'
import { TopicSubsection, LessonTopic } from '@/types'
import { allTopics as localAllTopics, getAllTopicsForSection as getLocalTopics } from '@/data/allTopics'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://physics-app-production-2585.up.railway.app'

export function useTopics() {
  const [sectionsData, setSectionsData] = useState<Record<string, TopicSubsection[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadTopics() {
      try {
        setLoading(true)

        // Загружаем актуальную программу и темы напрямую с бэкенда Railway
        const [secRes, topRes] = await Promise.all([
          fetch(`${API_BASE}/api/sections`, { headers: { Accept: 'application/json' } }),
          fetch(`${API_BASE}/api/topics`, { headers: { Accept: 'application/json' } })
        ])

        if (!secRes.ok || !topRes.ok) {
          throw new Error(`Ошибка ответа Railway API: sections=${secRes.status}, topics=${topRes.status}`)
        }

        const sections = await secRes.json()
        const topics = await topRes.json()

        const topicMap = new Map<string, any>()
        if (Array.isArray(topics)) {
          topics.forEach((t: any) => topicMap.set(t.id, t))
        }

        const result: Record<string, TopicSubsection[]> = {}

        for (const [secKey, secVal] of Object.entries(sections as Record<string, any>)) {
          result[secKey] = (secVal.subsections || []).map((sub: any) => ({
            id: sub.id,
            title: sub.name || sub.title,
            topics: (sub.topics || []).map((tRef: any) => {
              const full = topicMap.get(tRef.id) || {}
              return {
                id: tRef.id,
                title: tRef.name || full.title || tRef.id,
                description: full.brief_info || '',
                theory: full.brief_info || '',
                formulas: full.formulas || [],
                examples: full.example_problem ? [full.example_problem] : [],
                problems: []
              }
            })
          }))
        }

        // Совместимость ключей: связываем electromagnetism и electricity
        if (result['electromagnetism'] && !result['electricity']) {
          result['electricity'] = result['electromagnetism']
        } else if (result['electricity'] && !result['electromagnetism']) {
          result['electromagnetism'] = result['electricity']
        }

        if (isMounted) {
          if (Object.keys(result).length > 0) {
            setSectionsData(result)
          } else {
            setSectionsData(localAllTopics)
          }
          setError(null)
        }
      } catch (err) {
        console.warn('Не удалось загрузить темы с Railway API, используем встроенные данные:', err)
        if (isMounted) {
          setSectionsData(localAllTopics)
          setError(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTopics()

    return () => {
      isMounted = false
    }
  }, [])

  const getAllTopics = async (sectionId: string): Promise<LessonTopic[]> => {
    const list = sectionsData[sectionId] || (sectionId === 'electricity' ? sectionsData['electromagnetism'] : undefined)
    if (list && list.length > 0) {
      return list.flatMap(sub => sub.topics)
    }
    return getLocalTopics(sectionId)
  }

  return {
    sectionsData,
    loading,
    error,
    getAllTopics,
  }
}

