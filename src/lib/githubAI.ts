/**
 * Утилита для работы с OpenAI API (GPT-5-nano)
 * API Endpoint: https://api.openai.com/v1/chat/completions
 */

import { TestQuestion } from '@/types/test'
import { InteractiveTask, InteractiveTaskStep } from '@/types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const OPENAI_MODEL = 'gpt-5-nano'

interface GenerateTextOptions {
  prompt: string
  model?: string
  maxTokens?: number
}

const readOpenAIResponse = async (response: Response): Promise<string> => {
  const textBody = await response.text()
  let data: any
  try {
    data = JSON.parse(textBody)
  } catch (e) {
    console.error('Failed to parse API response as JSON:', textBody)
    throw new Error('Ответ API не является валидным JSON. Проверьте консоль для деталей.')
  }

  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  }
  if (data.choices && data.choices[0]?.text) {
    return data.choices[0].text
  }
  if (data.content) {
    return data.content
  }

  if (data.error) {
    throw new Error(`API error JSON: ${data.error.message || JSON.stringify(data.error)}`)
  }

  console.error('Unexpected API response structure:', data)
  throw new Error(`Неожиданный формат ответа от API: ${JSON.stringify(data).slice(0, 100)}... Проверьте консоль для деталей.`)
}

const requestChatCompletion = async (model: string, prompt: string, maxTokens: number) => {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: maxTokens,
      reasoning_effort: 'low',
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    const error = new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      ; (error as any).status = response.status
    throw error
  }

  return readOpenAIResponse(response)
}

export async function generateText(options: GenerateTextOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('API ключ OpenAI не настроен. Установите VITE_OPENAI_API_KEY в .env файле')
  }

  const {
    prompt,
    model = OPENAI_MODEL,
    maxTokens = 4000,
  } = options

  try {
    return await requestChatCompletion(model, prompt, maxTokens)
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('Превышен лимит запросов OpenAI. Попробуйте позже.')
    }
    if (error?.status === 401) {
      throw new Error('Неверный API ключ OpenAI. Проверьте VITE_OPENAI_API_KEY в .env файле.')
    }
    throw new Error(error?.message || 'Ошибка при генерации текста')
  }
}

/**
 * Генерация теории для темы
 */
export async function generateTheory(topicTitle: string, topicDescription: string): Promise<string> {
  const prompt = `Сгенерируй подробный учебный урок по физике для школьников на тему: "${topicTitle}".  
Урок должен включать следующие разделы:

1. **Введение**  
   - Объясни, что изучается в теме и зачем это важно.  
   - Сделай текст понятным и интересным, используй простые примеры из жизни.

2. **Основные понятия**  
   - Дай точные определения ключевых терминов.  
   - Если есть формулы — включи их в формате LaTeX.  
   - Приведи примеры из реальной жизни или учебных задач.

3. **Законы и формулы**  
   - Опиши основные законы, правила и формулы, относящиеся к теме.  
   - Дай короткое объяснение каждой формулы.  
   - При возможности включи пример расчета.

4. **Примеры и задачи**  
   - Приведи 2–3 примера решения задач, связанных с темой.  
   - Для каждой задачи укажи условие, решение и ответ.  
   - Сделай примеры понятными и пошаговыми.

5. **Роль и применение в жизни**  
   - Объясни, где и как эти понятия или законы применяются на практике (инженерия, спорт, транспорт и т.д.).

6. **Заключение**  
   - Подведи итоги урока.  
   - Объясни, почему понимание этих понятий важно для дальнейшего изучения физики.

**Дополнительно:**  
- Текст должен быть структурированным, логичным и легко читаемым.  
- Используй ясный язык, подходящий для школьников.  
- Формулы и вычисления — в LaTeX.  
- Примеры — реалистичные и наглядные.

Описание темы: ${topicDescription}

Важно: Каждый раздел должен начинаться с заголовка на отдельной строке в формате:
**Введение**
**Основные понятия**
**Законы и формулы**
**Примеры и задачи**
**Роль и применение в жизни**
**Заключение**

Создай полный урок на русском языке.`

  return await generateText({
    prompt,
    maxTokens: 4000,
  })
}

/**
 * Генерация задач для темы
 */
export async function generateProblems(topicTitle: string, count: number = 5): Promise<string[]> {
  const prompt = `Создай ${count} задач по физике на тему "${topicTitle}".

Требования:
1. Каждая задача должна быть на отдельной строке
2. Задачи должны быть разного уровня сложности
3. Задачи должны быть практическими и понятными
4. Формулировка должна быть четкой и конкретной
5. Задачи должны соответствовать школьной программе

Формат вывода: просто список задач, каждая на новой строке, без нумерации.`

  const text = await generateText({
    prompt,
    maxTokens: 1500,
  })

  // Разбиваем текст на отдельные задачи
  const problems = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/)) // Убираем нумерацию если есть
    .slice(0, count)

  return problems.length > 0 ? problems : [text]
}

function normalizeInteractiveTasks(rawTasks: any[]): InteractiveTask[] {
  const now = Date.now()
  const allowedTypes = new Set(['formula', 'substitution', 'calculation', 'text'])
  const allowedDifficulties = new Set(['basic', 'standard', 'advanced'])

  return rawTasks.map((task, index) => {
    const id = String(task?.id || `gen-int-${now}-${index + 1}`)
    const difficulty = allowedDifficulties.has(task?.difficulty)
      ? task.difficulty
      : 'standard'

    const steps: InteractiveTaskStep[] = Array.isArray(task?.steps)
      ? task.steps
        .map((step: any, stepIndex: number) => ({
          id: String(step?.id || `${id}-s${stepIndex + 1}`),
          type: allowedTypes.has(step?.type) ? step.type : 'text',
          content: String(step?.content || '').trim(),
          description: step?.description ? String(step.description) : undefined,
        }))
        .filter((step: InteractiveTaskStep) => step.content.length > 0)
      : []

    const answerType =
      task?.answerType === 'choice' || task?.answerType === 'formula'
        ? task.answerType
        : 'number'

    return {
      id,
      title: String(task?.title || `Интерактивная задача ${index + 1}`),
      difficulty,
      condition: String(task?.condition || '').trim(),
      given: Array.isArray(task?.given)
        ? task.given.map((item: any) => ({
          symbol: String(item?.symbol || '').trim(),
          value: String(item?.value || '').trim(),
          unit: item?.unit ? String(item.unit).trim() : undefined,
          name: item?.name ? String(item.name).trim() : undefined,
        }))
        : undefined,
      find: task?.find
        ? {
          symbol: String(task.find.symbol || '').trim(),
          unit: task.find.unit ? String(task.find.unit).trim() : undefined,
          name: task.find.name ? String(task.find.name).trim() : undefined,
        }
        : undefined,
      answerType,
      options: Array.isArray(task?.options)
        ? task.options.map((option: any) => String(option).trim()).filter(Boolean)
        : undefined,
      correctAnswer: task?.correctAnswer,
      steps,
      answer: String(task?.answer || '').trim(),
      hint: task?.hint ? String(task.hint).trim() : undefined,
    }
  })
}

function extractJsonPayload(text: string): string {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i)
  const raw = (fencedMatch ? fencedMatch[1] : text).trim()
  const arrayStart = raw.indexOf('[')
  const arrayEnd = raw.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return raw.slice(arrayStart, arrayEnd + 1).trim()
  }
  const objStart = raw.indexOf('{')
  const objEnd = raw.lastIndexOf('}')
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    return raw.slice(objStart, objEnd + 1).trim()
  }
  return raw
}

function normalizeJsonLike(text: string): string {
  return text
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
}

function parseInteractiveTasksFromText(text: string): any[] {
  const payload = normalizeJsonLike(extractJsonPayload(text))
  let parsed: any
  try {
    parsed = JSON.parse(payload)
  } catch {
    // Try to wrap single object into array
    if (payload.startsWith('{') && payload.endsWith('}')) {
      parsed = JSON.parse(`[${payload}]`)
    } else {
      throw new Error('parse_failed')
    }
  }

  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') return [parsed]
  throw new Error('parse_failed')
}

/**
 * Генерация интерактивных задач с пошаговым решением
 */
export async function generateInteractiveTasks(topicTitle: string, count: number = 3): Promise<InteractiveTask[]> {
  const prompt = `Создай ${count} интерактивных задач по физике на тему "${topicTitle}".

Требования:
- Ответ строго в формате JSON массива (без markdown и лишнего текста). Используй только двойные кавычки.
- Используй LaTeX для формул, оборачивай в $...$ или \\(...\\).
- В каждом задании укажи условие, "Дано" и "Найти" (если уместно), пошаговое решение и ответ.
- Шагов решения 3-6, каждый шаг имеет тип: formula | substitution | calculation | text.
- Используй только answerType = "number" или "formula". Варианты ответа не генерируй.

Схема:
[
  {
    "title": "Название задачи",
    "difficulty": "basic|standard|advanced",
    "condition": "Текст условия с LaTeX",
    "given": [
      { "symbol": "m", "value": "2", "unit": "кг", "name": "масса" }
    ],
    "find": { "symbol": "a", "unit": "м/с^2", "name": "ускорение" },
    "answerType": "number|formula",
    "steps": [
      { "type": "formula", "content": "F = m \\cdot a" },
      { "type": "substitution", "content": "a = F / m" }
    ],
    "answer": "Ответ"
  }
]`

  const text = await generateText({
    prompt,
    maxTokens: 2200,
  })

  try {
    const parsed = parseInteractiveTasksFromText(text)
    return normalizeInteractiveTasks(parsed)
  } catch {
    // Retry once with a stricter prompt
    const retryPrompt = `${prompt}

Важно: верни ТОЛЬКО валидный JSON массив. Никакого текста, комментариев и markdown.`
    const retryText = await generateText({
      prompt: retryPrompt,
      maxTokens: 2200,
    })
    try {
      const parsed = parseInteractiveTasksFromText(retryText)
      return normalizeInteractiveTasks(parsed)
    } catch (error) {
      console.error('Ошибка парсинга JSON интерактивных задач:', error, retryText)
      throw new Error('Не удалось разобрать ответ AI. Попробуйте ещё раз.')
    }
  }
}

/**
 * Генерация теста для темы
 */

export async function generateTest(
  topicTitle: string,
  questionCount: 5 | 10 | 15,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<TestQuestion[]> {
  const difficultyText = {
    easy: 'легкий',
    medium: 'средний',
    hard: 'сложный'
  }[difficulty]

  const prompt = `Создай тест по физике на тему "${topicTitle}".

Параметры:
- Количество вопросов: ${questionCount}
- Уровень сложности: ${difficultyText}

Требования:
1. Каждый вопрос должен иметь 4 варианта ответа
2. Только один вариант ответа правильный
3. Вопросы должны быть разными и проверять понимание материала
4. Варианты ответов должны быть реалистичными (не должно быть очевидно неправильных)
5. Для каждого вопроса укажи краткое пояснение правильного ответа (1-2 предложения)

Формат вывода (строго соблюдай формат, каждый вопрос на отдельной строке):
ВОПРОС: [текст вопроса]
A) [вариант 1]
B) [вариант 2]
C) [вариант 3]
D) [вариант 4]
ПРАВИЛЬНЫЙ: [A/B/C/D]
ПОЯСНЕНИЕ: [краткое пояснение]

ВОПРОС: [следующий вопрос]
...

Создай ${questionCount} вопросов на русском языке.`

  const text = await generateText({
    prompt,
    maxTokens: 3000,
  })

  // Парсим ответ
  const questions: TestQuestion[] = []
  const questionBlocks = text.split(/ВОПРОС:/).filter(block => block.trim())

  for (const block of questionBlocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l)

    if (lines.length < 6) continue

    const question = lines[0]
    const options: string[] = []
    let correctAnswer = -1
    let explanation = ''

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      if (line.match(/^[A-D]\)/)) {
        options.push(line.replace(/^[A-D]\)\s*/, ''))
      } else if (line.startsWith('ПРАВИЛЬНЫЙ:')) {
        const answerLetter = line.replace(/ПРАВИЛЬНЫЙ:\s*/, '').trim().toUpperCase()
        correctAnswer = answerLetter === 'A' ? 0 : answerLetter === 'B' ? 1 : answerLetter === 'C' ? 2 : 3
      } else if (line.startsWith('ПОЯСНЕНИЕ:')) {
        explanation = line.replace(/ПОЯСНЕНИЕ:\s*/, '').trim()
      }
    }

    if (question && options.length === 4 && correctAnswer >= 0 && correctAnswer < 4) {
      questions.push({
        id: questions.length + 1,
        question,
        options,
        correctAnswer,
        explanation: explanation || 'Правильный ответ выбран.'
      })
    }
  }

  return questions.slice(0, questionCount)
}

/**
 * Генерация объяснения формулы
 */
export async function generateFormulaExplanation(formula: string, topicTitle: string): Promise<string> {
  const prompt = `Дай подробное объяснение физической формулы для школьников.

Формула: ${formula}
Тема: ${topicTitle}

Требования:
1. Объясни, что означает эта формула и для чего она используется
2. Опиши каждую переменную в формуле (что она означает, в каких единицах измеряется)
3. Приведи пример применения формулы с конкретными числами
4. Объясни физический смысл формулы простым языком
5. Укажи, в каких единицах измеряется результат

Формат вывода:
**Что это за формула:**
[краткое описание]

**Переменные:**
- [переменная 1]: [описание]
- [переменная 2]: [описание]
...

**Пример применения:**
[пример с расчетом]

**Физический смысл:**
[объяснение]

**Единицы измерения:**
[единицы]

Создай объяснение на русском языке, понятное для школьников.`

  return await generateText({
    prompt,
    maxTokens: 1500,
  })
}

export interface AiExplainQA {
  question: string
  answer: string
}

export async function generateAiExplainQuestions(topicTitle: string, count: number = 6): Promise<AiExplainQA[]> {
  const prompt = `Сгенерируй ${count} важных вопросов, которые могут быть непонятны ученику по теме "${topicTitle}".

Требования:
- Верни JSON массив без markdown и лишнего текста.
- Каждый элемент: { "question": "...", "answer": "..." }
- Ответы краткие, понятные школьнику, с примерами.
- Формулы в LaTeX, оборачивай в $...$ или \\(...\\).

Пример:
[
  { "question": "Что такое сила тяжести?", "answer": "Сила тяжести — ... $F = mg$" }
]`

  const text = await generateText({
    prompt,
    maxTokens: 1800,
  })

  const payload = extractJsonPayload(text)
  let parsed: any
  try {
    parsed = JSON.parse(payload)
  } catch (error) {
    console.error('Ошибка парсинга JSON для AI объяснения:', error, payload)
    throw new Error('Не удалось разобрать ответ AI. Попробуйте ещё раз.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Неверный формат ответа AI. Ожидается массив вопросов.')
  }

  return parsed
    .map((item: any) => ({
      question: String(item?.question || '').trim(),
      answer: String(item?.answer || '').trim(),
    }))
    .filter((item: AiExplainQA) => item.question && item.answer)
}
