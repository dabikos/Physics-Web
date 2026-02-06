import { supabase } from './supabase'

export interface LessonTemplateRow {
  id: string
  title: string
  lesson_topic: string
  learning_goal: string
  class_name: string
  topic_ids: string[]
  owner_id?: string | null
  owner_name?: string | null
  created_at?: string
  updated_at?: string
}

export async function listLessonTemplates(ownerId?: string | null): Promise<LessonTemplateRow[]> {
  let query = supabase.from('lesson_templates').select('*').order('created_at', { ascending: false })
  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  }
  const { data, error } = await query
  if (error) {
    console.error('Ошибка загрузки уроков:', error)
    return []
  }
  return (data || []) as LessonTemplateRow[]
}

export async function createLessonTemplate(template: Omit<LessonTemplateRow, 'id' | 'created_at' | 'updated_at'>): Promise<LessonTemplateRow | null> {
  const { data, error } = await supabase
    .from('lesson_templates')
    .insert(template)
    .select()
    .single()

  if (error) {
    console.error('Ошибка создания урока:', error)
    return null
  }
  return data as LessonTemplateRow
}

export async function deleteLessonTemplate(id: string): Promise<boolean> {
  const { error } = await supabase.from('lesson_templates').delete().eq('id', id)
  if (error) {
    console.error('Ошибка удаления урока:', error)
    return false
  }
  return true
}
