import { supabase, TopicRow, SubsectionRow, SectionRow } from './supabase'
import { LessonTopic, TopicSubsection } from '@/types'

// Получить все разделы
export async function getSections(): Promise<SectionRow[]> {
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

// Получить одну тему по ID
export async function getTopicById(topicId: string): Promise<LessonTopic | null> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single()

  if (error) {
    console.error('Ошибка загрузки темы:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    theory: data.theory || undefined,
    formulas: data.formulas || undefined,
    examples: data.examples || undefined,
    problems: data.problems || undefined,
  }
}

// Получить тему по названию (первое совпадение)
export async function getTopicByTitle(title: string): Promise<LessonTopic | null> {
  const cleanTitle = title.trim()
  if (!cleanTitle) return null

  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .ilike('title', `%${cleanTitle}%`)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    theory: data.theory || undefined,
    formulas: data.formulas || undefined,
    examples: data.examples || undefined,
    problems: data.problems || undefined,
  }
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





