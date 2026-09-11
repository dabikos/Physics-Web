import { useState, useEffect, useCallback } from 'react'
import { TopicSubsection, LessonTopic } from '@/types'
import { allTopics as localAllTopics, getAllTopicsForSection as getLocalTopics } from '@/data/allTopics'
import { API_BASE } from '@/lib/api'

export function useTopics() {
  // Инициализируем локальными данными сразу, чтобы страницы открывались мгновенно без задержек и подвисаний
  const [sectionsData, setSectionsData] = useState<Record<string, TopicSubsection[]>>(localAllTopics)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    async function loadTopics() {
      try {
        // Загружаем актуальную программу и темы напрямую с бэкенда Railway
        const [secRes, topRes] = await Promise.all([
          fetch(`${API_BASE}/api/sections`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/api/topics`, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          })
        ])

        clearTimeout(timeoutId)

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

        if (isMounted && Object.keys(result).length > 0) {
          setSectionsData(result)
          setError(null)
        }
      } catch (err: any) {
        // Если таймаут или сбой сети, встроенные материалы уже отображаются
        if (err.name !== 'AbortError') {
          console.warn('Railway API topics fallback к локальной базе:', err.message)
        }
      } finally {
        clearTimeout(timeoutId)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTopics()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  const getAllTopics = useCallback(async (sectionId: string): Promise<LessonTopic[]> => {
    const list = sectionsData[sectionId] || (sectionId === 'electricity' ? sectionsData['electromagnetism'] : undefined)
    if (list && list.length > 0) {
      return list.flatMap(sub => sub.topics)
    }
    return getLocalTopics(sectionId)
  }, [sectionsData])

  return {
    sectionsData,
    loading,
    error,
    getAllTopics,
  }
}

