/**
 * Скрипт для загрузки данных из локальных файлов в Supabase
 * Запуск: npx tsx src/scripts/uploadToSupabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { allTopics } from '../data/allTopics'
import { mechanicsSubsections } from '../data/allTopics'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Необходимо установить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Определение разделов
const sections = [
  { id: 'mechanics', title: 'Механика', description: 'Движение, силы, энергия, импульс', icon_name: 'Gauge', color: 'from-blue-500 to-cyan-500', total_topics: 22, order_index: 1 },
  { id: 'thermodynamics', title: 'Термодинамика', description: 'Теплота, температура, энтропия', icon_name: 'Thermometer', color: 'from-orange-500 to-red-500', total_topics: 18, order_index: 2 },
  { id: 'electricity', title: 'Электричество и магнетизм', description: 'Заряды, поля, цепи, магнетизм', icon_name: 'Zap', color: 'from-yellow-500 to-amber-500', total_topics: 20, order_index: 3 },
  { id: 'optics', title: 'Оптика', description: 'Свет, линзы, волны, спектры', icon_name: 'Eye', color: 'from-purple-500 to-pink-500', total_topics: 12, order_index: 4 },
  { id: 'atomic', title: 'Атомная и ядерная физика', description: 'Строение атома, ядерные реакции', icon_name: 'Atom', color: 'from-emerald-500 to-teal-500', total_topics: 14, order_index: 5 },
]

async function uploadData() {
  console.log('Начало загрузки данных в Supabase...')

  // 1. Загрузка разделов
  console.log('Загрузка разделов...')
  const { error: sectionsError } = await supabase
    .from('sections')
    .upsert(sections, { onConflict: 'id' })

  if (sectionsError) {
    console.error('Ошибка загрузки разделов:', sectionsError)
    return
  }
  console.log('Разделы загружены успешно')

  // 2. Загрузка подразделов и тем
  for (const [sectionId, subsections] of Object.entries(allTopics)) {
    console.log(`Загрузка данных для раздела: ${sectionId}`)

    for (let subIndex = 0; subIndex < subsections.length; subIndex++) {
      const subsection = subsections[subIndex]
      
      // Загрузка подраздела
      const { data: subData, error: subError } = await supabase
        .from('subsections')
        .upsert({
          id: subsection.id,
          title: subsection.title,
          section_id: sectionId,
          order_index: subIndex + 1,
        }, { onConflict: 'id' })
        .select()
        .single()

      if (subError) {
        console.error(`Ошибка загрузки подраздела ${subsection.id}:`, subError)
        continue
      }

      // Загрузка тем подраздела
      for (let topicIndex = 0; topicIndex < subsection.topics.length; topicIndex++) {
        const topic = subsection.topics[topicIndex]
        
        const { error: topicError } = await supabase
          .from('topics')
          .upsert({
            id: topic.id,
            title: topic.title,
            description: topic.description,
            theory: topic.theory || null,
            formulas: topic.formulas || [],
            examples: topic.examples || [],
            problems: topic.problems || [],
            section_id: sectionId,
            subsection_id: subsection.id,
            order_index: topicIndex + 1,
          }, { onConflict: 'id' })

        if (topicError) {
          console.error(`Ошибка загрузки темы ${topic.id}:`, topicError)
        }
      }

      console.log(`Подраздел ${subsection.title} загружен (${subsection.topics.length} тем)`)
    }
  }

  console.log('Загрузка данных завершена!')
}

// Запуск скрипта
uploadData().catch(console.error)

