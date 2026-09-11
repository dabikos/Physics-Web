import { supabase, isSupabaseConfigured } from './supabase'

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

const LOCAL_STORAGE_KEY = 'saved_lesson_templates'

function getLocalTemplates(): LessonTemplateRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalTemplates(templates: LessonTemplateRow[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates))
  } catch (e) {
    console.warn('Failed to save templates to localStorage', e)
  }
}

export async function listLessonTemplates(ownerId?: string | null): Promise<LessonTemplateRow[]> {
  if (!isSupabaseConfigured) {
    const list = getLocalTemplates()
    if (ownerId) return list.filter(t => t.owner_id === ownerId)
    return list
  }
  try {
    let query = supabase.from('lesson_templates').select('*').order('created_at', { ascending: false })
    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }
    const { data, error } = await query
    if (error) {
      console.warn('Supabase lessons error, fallback to local:', error.message)
      return getLocalTemplates()
    }
    return (data || []) as LessonTemplateRow[]
  } catch {
    return getLocalTemplates()
  }
}

export async function createLessonTemplate(template: Omit<LessonTemplateRow, 'id' | 'created_at' | 'updated_at'>): Promise<LessonTemplateRow | null> {
  const newTemplate: LessonTemplateRow = {
    ...template,
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (!isSupabaseConfigured) {
    const list = getLocalTemplates()
    list.unshift(newTemplate)
    saveLocalTemplates(list)
    return newTemplate
  }

  try {
    const { data, error } = await supabase
      .from('lesson_templates')
      .insert(template)
      .select()
      .single()

    if (error) {
      console.warn('Supabase create lesson error, saving to local storage:', error.message)
      const list = getLocalTemplates()
      list.unshift(newTemplate)
      saveLocalTemplates(list)
      return newTemplate
    }
    return data as LessonTemplateRow
  } catch {
    const list = getLocalTemplates()
    list.unshift(newTemplate)
    saveLocalTemplates(list)
    return newTemplate
  }
}

export async function deleteLessonTemplate(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const list = getLocalTemplates().filter(t => t.id !== id)
    saveLocalTemplates(list)
    return true
  }
  try {
    const { error } = await supabase.from('lesson_templates').delete().eq('id', id)
    if (error) {
      console.warn('Supabase delete lesson error:', error.message)
      const list = getLocalTemplates().filter(t => t.id !== id)
      saveLocalTemplates(list)
      return true
    }
    return true
  } catch {
    const list = getLocalTemplates().filter(t => t.id !== id)
    saveLocalTemplates(list)
    return true
  }
}
