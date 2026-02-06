# Physics AI — Teacher Dashboard

Современный веб-интерфейс для учителя физики, предназначенный для демонстрации уроков на большом экране.

## 🎨 Особенности

- **Мой урок** — пульт учителя с крупными кнопками для управления уроком
- **World** — интерактивный экран с визуализацией прогресса учеников (сад)
- **Библиотека** — карточки разделов физики для добавления в урок
- **AI** — панель AI-ассистента для помощи в проведении урока
- **Настройки** — персонализация интерфейса

## 🛠 Технологии

- React 18
- TypeScript
- Tailwind CSS
- React Router
- Lucide Icons
- Framer Motion
- Supabase (опционально, для хранения материалов)

## 📦 Установка

```bash
npm install
```

## 🗄 Настройка Supabase (опционально)

Для использования Supabase в качестве хранилища материалов:

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL скрипт из `supabase-schema.sql` в SQL Editor
3. Создайте файл `.env` в корне проекта:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_SUPABASE=true
```
4. Загрузите данные используя скрипт `src/scripts/uploadToSupabase.ts`

Подробная инструкция в файле `SUPABASE_SETUP.md`

## 🚀 Запуск

```bash
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173) в браузере.

## 🏗 Сборка

```bash
npm run build
```

## 📁 Структура проекта

```
src/
├── components/
│   ├── icons/          # Иконки (Logo, GrowthIcon)
│   ├── layout/         # Компоненты макета (Header)
│   └── ui/             # UI компоненты (Button, Card, Slider, Badge)
├── pages/              # Страницы приложения
├── lib/                # Утилиты
├── types/              # TypeScript типы
├── App.tsx             # Главный компонент с роутингом
├── main.tsx            # Точка входа
└── index.css           # Глобальные стили
```

## 🎯 Дизайн-принципы

- Светлый или тёмно-синий фон
- Один акцентный цвет (синий / фиолетовый)
- Крупные шрифты (читабельно с расстояния)
- Большие кнопки
- Мягкие тени
- Плавные hover / transition / motion
- Стиль: Apple / Notion / Linear
- Минимум текста, максимум визуала