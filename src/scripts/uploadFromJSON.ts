/**
 * Скрипт для загрузки данных из JSON файла в Supabase
 * 
 * Использование:
 * 1. Подготовьте файл topicsData.json с данными
 * 2. Запустите: npm run upload-json
 * 
 * Формат JSON:
 * {
 *   "sections": [...],
 *   "subsections": [...],
 *   "topics": [...]
 * }
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Загружаем переменные окружения
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Ошибка: Необходимо установить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env файле')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TopicData {
  sections?: Array<{
    id: string
    title: string
    description: string
    icon_name?: string
    color?: string
    total_topics?: number
    order_index: number
  }>
  subsections?: Array<{
    id: string
    title: string
    section_id: string
    order_index: number
  }>
  topics?: Array<{
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
  }>
}

async function uploadFromJSON() {
  console.log('🚀 Загрузка данных из JSON файла...\n')

  try {
    // Читаем JSON файл
    const jsonPath = join(__dirname, '../data/topicsData.json')
    const fileContent = readFileSync(jsonPath, 'utf-8')
    const data: TopicData = JSON.parse(fileContent)

    // 1. Загрузка разделов
    if (data.sections && data.sections.length > 0) {
      console.log('📚 Загрузка разделов...')
      const { error } = await supabase
        .from('sections')
        .upsert(data.sections, { onConflict: 'id' })

      if (error) {
        console.error('❌ Ошибка загрузки разделов:', error.message)
      } else {
        console.log(`✅ Загружено разделов: ${data.sections.length}`)
      }
    }

    // 2. Загрузка подразделов
    if (data.subsections && data.subsections.length > 0) {
      console.log('\n📖 Загрузка подразделов...')
      const { error } = await supabase
        .from('subsections')
        .upsert(data.subsections, { onConflict: 'id' })

      if (error) {
        console.error('❌ Ошибка загрузки подразделов:', error.message)
      } else {
        console.log(`✅ Загружено подразделов: ${data.subsections.length}`)
      }
    }

    // 3. Загрузка тем
    if (data.topics && data.topics.length > 0) {
      console.log('\n📝 Загрузка тем...')
      
      // Загружаем по частям, чтобы не перегрузить
      const batchSize = 50
      let loaded = 0

      for (let i = 0; i < data.topics.length; i += batchSize) {
        const batch = data.topics.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from('topics')
          .upsert(batch, { onConflict: 'id' })

        if (error) {
          console.error(`❌ Ошибка загрузки батча ${i / batchSize + 1}:`, error.message)
        } else {
          loaded += batch.length
          console.log(`  ✅ Загружено тем: ${loaded}/${data.topics.length}`)
        }
      }

      console.log(`\n✅ Всего загружено тем: ${loaded}`)
    }

    // 4. Обновление счетчиков
    console.log('\n📊 Обновление счетчиков тем...')
    if (data.sections) {
      for (const section of data.sections) {
        const { count } = await supabase
          .from('topics')
          .select('*', { count: 'exact', head: true })
          .eq('section_id', section.id)

        if (count !== null) {
          await supabase
            .from('sections')
            .update({ total_topics: count })
            .eq('id', section.id)
          
          console.log(`  ✅ ${section.title}: ${count} тем`)
        }
      }
    }

    console.log('\n✨ Загрузка завершена успешно!')

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error.message)
    if (error.code === 'ENOENT') {
      console.error('   Файл topicsData.json не найден. Создайте его в папке src/data/')
    }
  }
}

uploadFromJSON().catch(console.error)





