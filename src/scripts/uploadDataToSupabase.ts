/**
 * Скрипт для загрузки всех материалов из локальных файлов в Supabase
 * 
 * Использование:
 * 1. Убедитесь, что .env файл настроен с правильными ключами Supabase
 * 2. Запустите: npm run upload-data
 * 
 * Или напрямую: npx tsx src/scripts/uploadDataToSupabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { allTopics } from '../data/allTopics'

// Загружаем переменные окружения из .env файла
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '../../.env') })

// Получаем переменные окружения
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Ошибка: Необходимо установить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env файле')
  console.error('Текущие значения:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ установлен' : '✗ не установлен')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ установлен' : '✗ не установлен')
  process.exit(1)
}

console.log('🔑 Подключение к Supabase...')
console.log('URL:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Определение разделов
const sections = [
  { 
    id: 'mechanics', 
    title: 'Механика', 
    description: 'Движение, силы, энергия, импульс', 
    icon_name: 'Gauge', 
    color: 'from-blue-500 to-cyan-500', 
    total_topics: 22, 
    order_index: 1 
  },
  { 
    id: 'thermodynamics', 
    title: 'Термодинамика', 
    description: 'Теплота, температура, энтропия', 
    icon_name: 'Thermometer', 
    color: 'from-orange-500 to-red-500', 
    total_topics: 18, 
    order_index: 2 
  },
  { 
    id: 'electricity', 
    title: 'Электричество и магнетизм', 
    description: 'Заряды, поля, цепи, магнетизм', 
    icon_name: 'Zap', 
    color: 'from-yellow-500 to-amber-500', 
    total_topics: 20, 
    order_index: 3 
  },
  { 
    id: 'optics', 
    title: 'Оптика', 
    description: 'Свет, линзы, волны, спектры', 
    icon_name: 'Eye', 
    color: 'from-purple-500 to-pink-500', 
    total_topics: 12, 
    order_index: 4 
  },
  { 
    id: 'atomic', 
    title: 'Атомная и ядерная физика', 
    description: 'Строение атома, ядерные реакции', 
    icon_name: 'Atom', 
    color: 'from-emerald-500 to-teal-500', 
    total_topics: 14, 
    order_index: 5 
  },
]

async function uploadData() {
  console.log('🚀 Начало загрузки данных в Supabase...\n')

  try {
    // 1. Загрузка разделов
    console.log('📚 Шаг 1: Загрузка разделов...')
    const { error: sectionsError } = await supabase
      .from('sections')
      .upsert(sections, { onConflict: 'id' })

    if (sectionsError) {
      console.error('❌ Ошибка загрузки разделов:', sectionsError)
      return
    }
    console.log(`✅ Загружено разделов: ${sections.length}\n`)

    // 2. Загрузка подразделов и тем
    let totalSubsections = 0
    let totalTopics = 0

    for (const [sectionId, subsections] of Object.entries(allTopics)) {
      console.log(`📖 Загрузка данных для раздела: ${sectionId}`)

      for (let subIndex = 0; subIndex < subsections.length; subIndex++) {
        const subsection = subsections[subIndex]
        
        // Загрузка подраздела
        const { error: subError } = await supabase
          .from('subsections')
          .upsert({
            id: subsection.id,
            title: subsection.title,
            section_id: sectionId,
            order_index: subIndex + 1,
          }, { onConflict: 'id' })

        if (subError) {
          console.error(`  ❌ Ошибка загрузки подраздела ${subsection.id}:`, subError.message)
          continue
        }

        totalSubsections++

        // Загрузка тем подраздела
        let topicsLoaded = 0
        for (let topicIndex = 0; topicIndex < subsection.topics.length; topicIndex++) {
          const topic = subsection.topics[topicIndex]
          
          const { error: topicError } = await supabase
            .from('topics')
            .upsert({
              id: topic.id,
              title: topic.title,
              description: topic.description || '',
              theory: topic.theory || null,
              formulas: topic.formulas || [],
              examples: topic.examples || [],
              problems: topic.problems || [],
              section_id: sectionId,
              subsection_id: subsection.id,
              order_index: topicIndex + 1,
            }, { onConflict: 'id' })

          if (topicError) {
            console.error(`    ❌ Ошибка загрузки темы ${topic.id}:`, topicError.message)
          } else {
            topicsLoaded++
            totalTopics++
          }
        }

        console.log(`  ✅ Подраздел "${subsection.title}": ${topicsLoaded}/${subsection.topics.length} тем`)
      }
      console.log('')
    }

    // 3. Обновление счетчиков тем в разделах
    console.log('📊 Шаг 3: Обновление счетчиков тем...')
    for (const section of sections) {
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

    console.log('\n✨ Загрузка данных завершена успешно!')
    console.log(`📈 Статистика:`)
    console.log(`   - Разделов: ${sections.length}`)
    console.log(`   - Подразделов: ${totalSubsections}`)
    console.log(`   - Тем: ${totalTopics}`)
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
  }
}

// Запуск скрипта
uploadData().catch(console.error)

