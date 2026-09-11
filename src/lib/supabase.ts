import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения
const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(rawUrl && rawKey && rawUrl.startsWith('http'))

if (!isSupabaseConfigured) {
  console.warn('Supabase URL или Anon Key не настроены. Используются встроенные учебные материалы и локальное хранилище.')
}

// Fallback на валидный URL-заглушку, чтобы createClient не падал с фатальной ошибкой при импорте бандла
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для таблиц базы данных
export interface TopicRow {
  id: string
  title: string
  description: string
  theory?: string
  formulas?: string[]
  examples?: string[]
  problems?: string[]
  section_id: string
  subsection_id: string
  order_index: number
  created_at?: string
  updated_at?: string
}

export interface SubsectionRow {
  id: string
  title: string
  section_id: string
  order_index: number
  created_at?: string
  updated_at?: string
}

export interface SectionRow {
  id: string
  title: string
  description: string
  icon_name?: string
  color?: string
  total_topics?: number
  created_at?: string
  updated_at?: string
}





