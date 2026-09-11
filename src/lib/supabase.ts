import { createClient } from '@supabase/supabase-js'

// Supabase больше не используется — вся база данных перенесена на Railway
export const isSupabaseConfigured = false

const supabaseUrl = 'https://placeholder.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

// Создаем заглушку-клиент Supabase, чтобы код с fallback не падал
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





