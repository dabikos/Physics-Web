import { createClient } from '@supabase/supabase-js'

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL или Anon Key не настроены. Проверьте переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
}

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





