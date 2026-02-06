-- Политики безопасности для записи данных
-- Выполните этот скрипт в Supabase SQL Editor

-- Разрешаем всем (включая анонимных пользователей) вставлять и обновлять данные
-- ВНИМАНИЕ: Это разрешает запись всем. Для продакшена лучше использовать аутентификацию.

-- Политики для sections
CREATE POLICY "Allow public insert on sections" ON sections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on sections" ON sections
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on sections" ON sections
  FOR DELETE USING (true);

-- Политики для subsections
CREATE POLICY "Allow public insert on subsections" ON subsections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on subsections" ON subsections
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on subsections" ON subsections
  FOR DELETE USING (true);

-- Политики для topics
CREATE POLICY "Allow public insert on topics" ON topics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on topics" ON topics
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on topics" ON topics
  FOR DELETE USING (true);

-- Политики для lesson_templates
CREATE POLICY "Allow public insert on lesson_templates" ON lesson_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on lesson_templates" ON lesson_templates
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on lesson_templates" ON lesson_templates
  FOR DELETE USING (true);





