# Как добавить материалы в Supabase

## 🚀 Быстрый способ (Автоматическая загрузка)

### Шаг 1: Убедитесь, что таблицы созданы
1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдите в **SQL Editor**
3. Скопируйте весь код из файла `supabase-schema.sql`
4. Выполните SQL скрипт (нажмите Run)

### Шаг 2: Загрузите данные автоматически
```bash
npm run upload-data
```

Этот скрипт загрузит:
- ✅ Все 5 разделов (Механика, Термодинамика, и т.д.)
- ✅ Все подразделы (Кинематика, Динамика, и т.д.)
- ✅ Все 86 тем с полным контентом

## 📝 Ручное добавление через Supabase Dashboard

### Добавление одной темы:

1. Откройте Supabase Dashboard → **Table Editor**
2. Выберите таблицу **topics**
3. Нажмите **Insert** → **Insert row**
4. Заполните поля:

```
id: m1
title: Прямолинейное движение
description: Движение тела по прямой линии
theory: [Вставьте полный текст теории]
formulas: ["v = s/t", "x = x₀ + vt"]
examples: ["Пример 1", "Пример 2"]
problems: ["Задача 1", "Задача 2"]
section_id: mechanics
subsection_id: kinematics
order_index: 1
```

**Важно:** Поля `formulas`, `examples`, `problems` должны быть в формате JSON массива:
- Правильно: `["Формула 1", "Формула 2"]`
- Неправильно: `Формула 1, Формула 2`

## 🔧 Добавление через SQL

### Пример добавления темы:

```sql
INSERT INTO topics (
  id, 
  title, 
  description, 
  theory,
  formulas,
  examples,
  problems,
  section_id,
  subsection_id,
  order_index
)
VALUES (
  'm1',
  'Прямолинейное движение',
  'Движение тела по прямой линии',
  'Полный теоретический материал здесь...',
  '["v = s/t", "x = x₀ + vt"]'::jsonb,
  '["Автомобиль движется со скоростью 60 км/ч"]'::jsonb,
  '["Найдите скорость движения"]'::jsonb,
  'mechanics',
  'kinematics',
  1
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  theory = EXCLUDED.theory,
  updated_at = NOW();
```

## 📊 Структура ID тем

Для удобства используйте следующую систему ID:

- **Механика**: m1, m2, m3, ... m22
- **Термодинамика**: t1, t2, t3, ... t18
- **Электричество**: e1, e2, e3, ... e20
- **Оптика**: o1, o2, o3, ... o12
- **Атомная физика**: a1, a2, a3, ... a14

## ✅ Проверка загрузки

После добавления данных:

1. Перезапустите dev-сервер: `npm run dev`
2. Откройте раздел "Библиотека"
3. Проверьте, что темы отображаются
4. Откройте тему и убедитесь, что контент загружается

## 🔍 Полезные SQL запросы для проверки

```sql
-- Посмотреть все темы раздела
SELECT * FROM topics WHERE section_id = 'mechanics' ORDER BY order_index;

-- Найти темы без теории
SELECT id, title FROM topics WHERE theory IS NULL OR theory = '';

-- Подсчитать темы
SELECT section_id, COUNT(*) as count FROM topics GROUP BY section_id;
```

## 💡 Советы

1. **Используйте автоматический скрипт** для массовой загрузки
2. **Используйте SQL Editor** для быстрых обновлений
3. **Используйте Table Editor** для ручного редактирования
4. Всегда проверяйте JSON формат для массивов





