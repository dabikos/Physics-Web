import { supabase, TopicRow, SubsectionRow, SectionRow, isSupabaseConfigured } from './supabase'
import { LessonTopic, TopicSubsection } from '@/types'
import { allTopics as localAllTopics, getAllTopicsForSection as getLocalTopicsForSection } from '@/data/allTopics'

// Получить все разделы
export async function getSections(): Promise<SectionRow[]> {
  if (!isSupabaseConfigured) {
    return [
      { id: 'mechanics', title: 'Механика', description: 'Законы движения и взаимодействия тел', order_index: 1 },
      { id: 'thermodynamics', title: 'Термодинамика', description: 'Тепловые явления и законы термодинамики', order_index: 2 },
      { id: 'electricity', title: 'Электродинамика', description: 'Электрические и магнитные поля', order_index: 3 },
      { id: 'optics', title: 'Оптика', description: 'Свет, отражение, преломление и волновые свойства', order_index: 4 },
      { id: 'atomic', title: 'Атомная физика', description: 'Строение атома и квантовые явления', order_index: 5 },
    ]
  }

  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Ошибка загрузки разделов:', error)
    return []
  }

  return data || []
}

// Получить подразделы для раздела
export async function getSubsections(sectionId: string): Promise<SubsectionRow[]> {
  const { data, error } = await supabase
    .from('subsections')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Ошибка загрузки подразделов:', error)
    return []
  }

  return data || []
}

// Получить темы для подраздела
export async function getTopics(subsectionId: string): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subsection_id', subsectionId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Ошибка загрузки тем:', error)
    return []
  }

  return data || []
}

// Получить все темы раздела
export async function getAllTopicsForSection(sectionId: string): Promise<LessonTopic[]> {
  if (!isSupabaseConfigured) {
    return getLocalTopicsForSection(sectionId)
  }

  const subsections = await getSubsections(sectionId)
  const allTopics: LessonTopic[] = []

  for (const subsection of subsections) {
    const topics = await getTopics(subsection.id)
    const lessonTopics: LessonTopic[] = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      theory: topic.theory || undefined,
      formulas: topic.formulas || undefined,
      examples: topic.examples || undefined,
      problems: topic.problems || undefined,
    }))
    allTopics.push(...lessonTopics)
  }

  return allTopics
}

// Получить структуру разделов с подразделами и темами
export async function getSectionsWithTopics(): Promise<Record<string, TopicSubsection[]>> {
  if (!isSupabaseConfigured) {
    return localAllTopics
  }

  const sections = await getSections()
  const result: Record<string, TopicSubsection[]> = {}

  for (const section of sections) {
    const subsections = await getSubsections(section.id)
    const subsectionsWithTopics: TopicSubsection[] = []

    for (const subsection of subsections) {
      const topics = await getTopics(subsection.id)
      const lessonTopics: LessonTopic[] = topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        theory: topic.theory || undefined,
        formulas: topic.formulas || undefined,
        examples: topic.examples || undefined,
        problems: topic.problems || undefined,
      }))

      subsectionsWithTopics.push({
        id: subsection.id,
        title: subsection.title,
        topics: lessonTopics,
      })
    }

    result[section.id] = subsectionsWithTopics
  }

  return result
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://physics-app-production-2585.up.railway.app'

// Получить одну тему по ID из базы данных Railway
export async function getTopicById(topicId: string): Promise<LessonTopic | null> {
  try {
    const res = await fetch(`${API_BASE}/api/topics/${topicId}`)
    if (res.ok) {
      const data = await res.json()
      return {
        id: data.id,
        title: data.title,
        description: data.brief_info || '',
        theory: data.brief_info || '',
        formulas: data.formulas || [],
        examples: data.example_problem ? [data.example_problem] : [],
        problems: []
      }
    }
  } catch (e) {
    console.warn('Railway API topic fetch fallback:', e)
  }

  for (const subsections of Object.values(localAllTopics)) {
    for (const sub of subsections) {
      const found = sub.topics.find(t => t.id === topicId)
      if (found) return found
    }
  }
  return null
}

// Получить тему по названию из базы данных Railway
export async function getTopicByTitle(title: string): Promise<LessonTopic | null> {
  const cleanTitle = title.trim()
  if (!cleanTitle) return null

  try {
    const res = await fetch(`${API_BASE}/api/topics`)
    if (res.ok) {
      const list = await res.json()
      const lower = cleanTitle.toLowerCase()
      const found = Array.isArray(list) ? list.find((t: any) => t.title?.toLowerCase().includes(lower)) : null
      if (found) {
        return {
          id: found.id,
          title: found.title,
          description: found.brief_info || '',
          theory: found.brief_info || '',
          formulas: found.formulas || [],
          examples: found.example_problem ? [found.example_problem] : [],
          problems: []
        }
      }
    }
  } catch (e) {
    console.warn('Railway API topics search fallback:', e)
  }

  const lower = cleanTitle.toLowerCase()
  for (const subsections of Object.values(localAllTopics)) {
    for (const sub of subsections) {
      const found = sub.topics.find(t => t.title.toLowerCase().includes(lower))
      if (found) return found
    }
  }
  return null
}

// Добавить тему (для админки)
export async function createTopic(topic: Omit<TopicRow, 'created_at' | 'updated_at'>): Promise<TopicRow | null> {
  const { data, error } = await supabase
    .from('topics')
    .insert(topic)
    .select()
    .single()

  if (error) {
    console.error('Ошибка создания темы:', error)
    return null
  }

  return data
}

// Обновить тему
export async function updateTopic(topicId: string, updates: Partial<TopicRow>): Promise<TopicRow | null> {
  const { data, error } = await supabase
    .from('topics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', topicId)
    .select()
    .single()

  if (error) {
    console.error('Ошибка обновления темы:', error)
    return null
  }

  return data
}

// Удалить тему
export async function deleteTopic(topicId: string): Promise<boolean> {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)

  if (error) {
    console.error('Ошибка удаления темы:', error)
    return false
  }

  return true
}





