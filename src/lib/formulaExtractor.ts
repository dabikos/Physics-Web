/**
 * Утилита для извлечения формул из текста теории
 */

/**
 * Проверяет, является ли формула значимой (не просто переменная)
 */
function stripLatexText(input: string): string {
  return input
    .replace(/\\(?:mathrm|text)\{([^}]*)\}/g, '$1')
    .replace(/\\(?:quad|qquad)/g, ' ')
    .replace(/\\[,:;!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSignificantFormula(formula: string): boolean {
  const trimmed = formula.trim()

  // Ignore empty strings
  if (!trimmed) return false

  const analysis = stripLatexText(trimmed)
  const analysisForLetters = analysis.replace(/\[A-Za-z]+/g, '')

  // Ignore single variables (1-2 chars without operations)
  if (trimmed.length <= 2 && !/[+\-*/=<>\u2264\u2265\u2248\u2260]/.test(trimmed)) {
    return false
  }

  // Ignore answers and service words
  if (/\u043e\u0442\u0432\u0435\u0442|\u0440\u0435\u0448\u0435\u043d\u0438\u0435|\u043f\u0440\u0438\u043c\u0435\u0440|\u0433\u0434\u0435|\u0434\u0430\u043d\u043e|\u043d\u0430\u0439\u0442\u0438/i.test(trimmed)) {
    return false
  }

  const digitTokens = analysis.match(/\d+(?:[.,]\d+)?/g) || []
  const letterTokens = analysisForLetters.match(/\p{L}+/gu) || []
  const uniqueLetters = new Set(letterTokens.map((t) => t.toLowerCase()))
  const equalsCount = (analysis.match(/=/g) || []).length
  const hasDigits = digitTokens.length > 0
  const hasEquals = equalsCount > 0
  const hasLatexOp = /\frac|\over|\cdot|\times|\sqrt|\sum|\int/.test(trimmed)

  // Ignore assignments with number and units (including fractions/powers)
  if (/^\p{L}(?:_[\p{L}0-9]+)?\s*=\s*[\d.,\s]+[\p{L}/\u00b7*^0-9]+$/u.test(analysisForLetters)) {
    return false
  }

  // Ignore just numbers with units
  if (/^\d+\s*\p{L}+$/u.test(analysisForLetters)) {
    return false
  }

  // Ignore simple value like "v = 5" without units
  if (/^\p{L}(?:_[\p{L}0-9]+)?\s*=\s*[\d.,]+$/u.test(analysisForLetters)) {
    return false
  }

  // Ignore numeric chains like "a = 20/5 = 4 m/s^2"
  if (hasDigits && equalsCount >= 2) {
    return false
  }

  // Ignore bare numeric expressions without relations (likely answers)
  if (hasDigits && !hasEquals && !hasLatexOp) {
    return false
  }

  // Ignore numeric-heavy expressions
  if (hasDigits && digitTokens.length > uniqueLetters.size) {
    return false
  }

  // Ignore decimal-only substitutions with few variables
  if (hasDigits && /\d+[.,]\d+/.test(analysis) && uniqueLetters.size <= 2) {
    return false
  }

  // Ignore numeric calculations without variables (answers, not formulas)
  if (!/\p{L}/u.test(analysisForLetters)) {
    return false
  }

  // Formula should contain at least one operation/relationship
  const hasOperation = /[+\-*/=<>\u2264\u2265\u2248\u2260]/.test(trimmed)
  const hasFraction = /\frac|\over|\//.test(trimmed)
  const hasPower = /\^|\pow|\sup/.test(trimmed)
  const hasSubscript = /_|\sub/.test(trimmed)
  const hasMultipleVars = /\p{L}.*\p{L}/u.test(analysisForLetters)

  return hasOperation || hasFraction || hasPower || (hasSubscript && hasMultipleVars) || trimmed.length > 10
}





/**
 * Нормализует формулу для сравнения (убирает пробелы, приводит к единому виду)
 */
function normalizeFormula(formula: string): string {
  return stripLatexText(formula)
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Извлекает формулы из текста теории
 * Ищет LaTeX формулы в форматах: \(...\), \[...\], $...$
 * Фильтрует незначимые формулы (одиночные переменные, простые значения)
 */
export function extractFormulasFromTheory(theory: string): string[] {
  if (!theory) return []

  const formulas: string[] = []
  const seenFormulas = new Set<string>()

  // Извлекаем блочные формулы \[ ... \] (приоритет - это обычно важные формулы)
  // Сохраняем формулы в LaTeX формате (содержимое внутри обёрток)
  const blockFormulaRegex = /\\\[([^\]]+)\\\]/g
  let match
  while ((match = blockFormulaRegex.exec(theory)) !== null) {
    const formula = match[1].trim()
    const normalized = normalizeFormula(formula)
    
    if (formula && isSignificantFormula(formula) && !seenFormulas.has(normalized)) {
      // Сохраняем формулу в LaTeX формате (без обёрток, но с LaTeX синтаксисом)
      formulas.push(formula)
      seenFormulas.add(normalized)
    }
  }

  // Извлекаем инлайн формулы \( ... \)
  const inlineFormulaRegex = /\\\(([^)]+)\\\)/g
  while ((match = inlineFormulaRegex.exec(theory)) !== null) {
    const formula = match[1].trim()
    const normalized = normalizeFormula(formula)
    
    if (formula && isSignificantFormula(formula) && !seenFormulas.has(normalized)) {
      // Сохраняем формулу в LaTeX формате
      formulas.push(formula)
      seenFormulas.add(normalized)
    }
  }

  // Извлекаем формулы в формате $ ... $
  const dollarFormulaRegex = /\$([^$\n]+)\$/g
  while ((match = dollarFormulaRegex.exec(theory)) !== null) {
    const formula = match[1].trim()
    const normalized = normalizeFormula(formula)
    
    if (formula && isSignificantFormula(formula) && !seenFormulas.has(normalized)) {
      // Сохраняем формулу в LaTeX формате
      formulas.push(formula)
      seenFormulas.add(normalized)
    }
  }

  // Сортируем формулы по длине (сначала более сложные)
  return formulas.sort((a, b) => b.length - a.length).slice(0, 20) // Ограничиваем до 20 формул
}
