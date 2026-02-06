/**
 * Скрипт для удаления всех данных из Supabase
 * 
 * ВНИМАНИЕ: Это удалит ВСЕ данные из таблиц topics, subsections и sections!
 * 
 * Использование:
 * npm run delete-all-data
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createInterface } from 'readline'

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

// Функция для чтения ввода из консоли
function askQuestion(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

async function deleteAllData() {
  console.log('⚠️  ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные из Supabase!')
  console.log('   - Все темы (topics)')
  console.log('   - Все подразделы (subsections)')
  console.log('   - Все разделы (sections)')
  console.log('')

  const answer = await askQuestion('Вы уверены? Введите "ДА" для подтверждения: ')

  if (answer !== 'ДА') {
    console.log('❌ Операция отменена')
    process.exit(0)
  }

  console.log('\n🗑️  Начинаю удаление данных...\n')

  try {
    // 1. Удаление всех тем
    console.log('📝 Удаление всех тем...')
    const { error: topicsError, count: topicsCount } = await supabase
      .from('topics')
      .delete()
      .neq('id', '') // Удаляем все записи

    if (topicsError) {
      console.error('❌ Ошибка удаления тем:', topicsError.message)
    } else {
      console.log(`✅ Темы удалены`)
    }

    // 2. Удаление всех подразделов
    console.log('\n📖 Удаление всех подразделов...')
    const { error: subsectionsError } = await supabase
      .from('subsections')
      .delete()
      .neq('id', '')

    if (subsectionsError) {
      console.error('❌ Ошибка удаления подразделов:', subsectionsError.message)
    } else {
      console.log('✅ Подразделы удалены')
    }

    // 3. Удаление всех разделов
    console.log('\n📚 Удаление всех разделов...')
    const { error: sectionsError } = await supabase
      .from('sections')
      .delete()
      .neq('id', '')

    if (sectionsError) {
      console.error('❌ Ошибка удаления разделов:', sectionsError.message)
    } else {
      console.log('✅ Разделы удалены')
    }

    console.log('\n✨ Все данные успешно удалены из Supabase!')

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error.message)
    process.exit(1)
  }
}

deleteAllData().catch(console.error)

