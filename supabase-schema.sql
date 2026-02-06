-- Создание таблицы разделов (sections)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  color TEXT,
  total_topics INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы подразделов (subsections)
CREATE TABLE IF NOT EXISTS subsections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы тем (topics)
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theory TEXT,
  formulas JSONB DEFAULT '[]'::jsonb,
  examples JSONB DEFAULT '[]'::jsonb,
  problems JSONB DEFAULT '[]'::jsonb,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subsection_id TEXT NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы шаблонов уроков
CREATE TABLE IF NOT EXISTS lesson_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  lesson_topic TEXT NOT NULL,
  learning_goal TEXT NOT NULL,
  class_name TEXT NOT NULL,
  topic_ids JSONB DEFAULT '[]'::jsonb,
  owner_id TEXT,
  owner_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_subsections_section_id ON subsections(section_id);
CREATE INDEX IF NOT EXISTS idx_topics_section_id ON topics(section_id);
CREATE INDEX IF NOT EXISTS idx_topics_subsection_id ON topics(subsection_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON sections(order_index);
CREATE INDEX IF NOT EXISTS idx_subsections_order ON subsections(order_index);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);

-- Включение Row Level Security (RLS)
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_templates ENABLE ROW LEVEL SECURITY;

-- Политики безопасности: разрешаем чтение всем
CREATE POLICY "Allow public read access on sections" ON sections
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on subsections" ON subsections
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on lesson_templates" ON lesson_templates
  FOR SELECT USING (true);

-- Политики для записи (можно настроить по необходимости)
-- CREATE POLICY "Allow authenticated users to insert sections" ON sections
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subsections_updated_at BEFORE UPDATE ON subsections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_templates_updated_at BEFORE UPDATE ON lesson_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();





