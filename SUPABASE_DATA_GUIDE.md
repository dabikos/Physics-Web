# Руководство по добавлению материалов в Supabase

Есть несколько способов добавить материалы в базу данных Supabase:

## Способ 1: Автоматическая загрузка из локальных файлов (Рекомендуется)

### Шаг 1: Установите tsx (если еще не установлен)
```bash
npm install -D tsx
```

### Шаг 2: Запустите скрипт загрузки
```bash
npx tsx src/scripts/uploadDataToSupabase.ts
```

Скрипт автоматически:
- Загрузит все разделы (sections)
- Загрузит все подразделы (subsections)
- Загрузит все темы (topics) с полным контентом
- Обновит счетчики тем в разделах

## Способ 2: Через SQL Editor в Supabase Dashboard

### Добавление раздела:
```sql
INSERT INTO sections (id, title, description, icon_name, color, total_topics, order_index)
VALUES ('mechanics', 'Механика', 'Движение, силы, энергия, импульс', 'Gauge', 'from-blue-500 to-cyan-500', 22, 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();
```

### Добавление подраздела:
```sql
INSERT INTO subsections (id, title, section_id, order_index)
VALUES ('kinematics', 'Кинематика', 'mechanics', 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();
```

### Добавление темы:
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
  'Полный теоретический материал...',
  '["v = s/t", "x = x₀ + vt"]'::jsonb,
  '["Пример 1", "Пример 2"]'::jsonb,
  '["Задача 1", "Задача 2"]'::jsonb,
  'mechanics',
  'kinematics',
  1
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  theory = EXCLUDED.theory,
  formulas = EXCLUDED.formulas,
  examples = EXCLUDED.examples,
  problems = EXCLUDED.problems,
  updated_at = NOW();
```

## Способ 3: Через веб-интерфейс Supabase

1. Откройте Supabase Dashboard
2. Перейдите в раздел **Table Editor**
3. Выберите таблицу (sections, subsections, или topics)
4. Нажмите **Insert** → **Insert row**
5. Заполните поля и сохраните

**Важно для JSON полей:**
- `formulas`, `examples`, `problems` должны быть в формате JSON массива
- Пример: `["Формула 1", "Формула 2"]`

## Способ 4: Массовая загрузка через CSV

1. Подготовьте CSV файлы для каждой таблицы
2. В Supabase Dashboard: **Table Editor** → выберите таблицу → **Import data**
3. Загрузите CSV файл

**Формат CSV для topics:**
```csv
id,title,description,theory,formulas,examples,problems,section_id,subsection_id,order_index
m1,Прямолинейное движение,Движение тела по прямой линии,"Полный текст теории...","[""v = s/t""]","[""Пример 1""]","[""Задача 1""]",mechanics,kinematics,1
```

## Структура данных

### Таблица `sections`
| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT (PK) | Уникальный идентификатор (mechanics, thermodynamics, etc.) |
| title | TEXT | Название раздела |
| description | TEXT | Описание раздела |
| icon_name | TEXT | Название иконки |
| color | TEXT | CSS класс для градиента |
| total_topics | INTEGER | Общее количество тем |
| order_index | INTEGER | Порядок сортировки |

### Таблица `subsections`
| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT (PK) | Уникальный идентификатор |
| title | TEXT | Название подраздела |
| section_id | TEXT (FK) | Ссылка на раздел |
| order_index | INTEGER | Порядок сортировки |

### Таблица `topics`
| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT (PK) | Уникальный идентификатор (m1, m2, t1, e1, etc.) |
| title | TEXT | Название темы |
| description | TEXT | Краткое описание |
| theory | TEXT | Полный теоретический материал |
| formulas | JSONB | Массив формул: `["формула 1", "формула 2"]` |
| examples | JSONB | Массив примеров: `["пример 1", "пример 2"]` |
| problems | JSONB | Массив задач: `["задача 1", "задача 2"]` |
| section_id | TEXT (FK) | Ссылка на раздел |
| subsection_id | TEXT (FK) | Ссылка на подраздел |
| order_index | INTEGER | Порядок сортировки |

## Обновление существующих данных

### Обновить теорию темы:
```sql
UPDATE topics 
SET theory = 'Новый теоретический материал...',
    updated_at = NOW()
WHERE id = 'm1';
```

### Добавить формулу к теме:
```sql
UPDATE topics 
SET formulas = formulas || '["Новая формула"]'::jsonb,
    updated_at = NOW()
WHERE id = 'm1';
```

### Обновить счетчик тем в разделе:
```sql
UPDATE sections 
SET total_topics = (
  SELECT COUNT(*) FROM topics WHERE section_id = 'mechanics'
)
WHERE id = 'mechanics';
```

## Полезные SQL запросы

### Посмотреть все темы раздела:
```sql
SELECT t.*, s.title as subsection_title
FROM topics t
JOIN subsections s ON t.subsection_id = s.id
WHERE t.section_id = 'mechanics'
ORDER BY s.order_index, t.order_index;
```

### Найти темы без теории:
```sql
SELECT id, title, section_id 
FROM topics 
WHERE theory IS NULL OR theory = '';
```

### Подсчитать темы по разделам:
```sql
SELECT 
  s.title,
  COUNT(t.id) as topics_count
FROM sections s
LEFT JOIN topics t ON s.id = t.section_id
GROUP BY s.id, s.title
ORDER BY s.order_index;
```

## Рекомендации

1. **Используйте скрипт** для первоначальной загрузки всех данных
2. **Используйте SQL Editor** для точечных обновлений
3. **Используйте Table Editor** для ручного редактирования отдельных записей
4. Всегда проверяйте данные после загрузки через веб-интерфейс

## Проверка загрузки

После загрузки данных проверьте:

1. Откройте приложение: `npm run dev`
2. Перейдите в раздел "Библиотека"
3. Убедитесь, что все разделы и темы отображаются
4. Проверьте консоль браузера на наличие ошибок





