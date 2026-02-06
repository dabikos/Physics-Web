/**
 * Скрипт для удаления конкретной темы из Supabase
 * 
 * Использование:
 * npm run delete-topic -- --id=m1
 * или
 * tsx src/scripts/deleteTopic.ts --id=m1
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
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

// Получаем ID темы из аргументов командной строки
const args = process.argv.slice(2)
const topicId = args.find(arg => arg.startsWith('--id='))?.split('=')[1]

if (!topicId) {
  console.error('❌ Ошибка: Не указан ID темы')
  console.log('Использование: npm run delete-topic -- --id=m1')
  process.exit(1)
}

async function deleteTopic() {
  console.log(`🗑️  Удаление темы "${topicId}" из Supabase...\n`)

  try {
    // Удаляем тему
    const { error, data } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId)
      .select()

    if (error) {
      console.error('❌ Ошибка удаления темы:', error.message)
      process.exit(1)
    }

    if (data && data.length > 0) {
      console.log(`✅ Тема "${topicId}" успешно удалена!`)
      console.log(`   Название: ${data[0].title}`)
    } else {
      console.log(`⚠️  Тема "${topicId}" не найдена в базе данных`)
    }

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error.message)
    process.exit(1)
  }
}

deleteTopic().catch(console.error)





