# Настройка Ngrok для тестирования

## Вариант 1: Использование Ngrok (требует регистрации)

### Шаг 1: Установка Ngrok

1. Скачайте ngrok с официального сайта: https://ngrok.com/download
2. Распакуйте файл `ngrok.exe` в папку проекта или добавьте в PATH

### Шаг 2: Регистрация (бесплатно)

1. Зарегистрируйтесь на https://ngrok.com (бесплатно)
2. Получите authtoken на странице: https://dashboard.ngrok.com/get-started/your-authtoken
3. Выполните команду:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Шаг 3: Запуск

1. Убедитесь, что dev сервер запущен:
   ```bash
   npm run dev
   ```

2. В новом терминале запустите ngrok:
   ```bash
   ngrok http 5173
   ```

3. Скопируйте публичную ссылку (например: `https://abc123.ngrok.io`) и поделитесь ею

---

## Вариант 2: Использование Cloudflare Tunnel (РЕКОМЕНДУЕТСЯ - без регистрации, без пароля)

### Запуск:

1. Убедитесь, что dev сервер запущен:
   ```bash
   npm run dev
   ```

2. В новом терминале запустите:
   ```bash
   npm run tunnel
   ```
   или
   ```bash
   npx cloudflared tunnel --url http://localhost:5173
   ```

3. Скопируйте публичную ссылку из вывода (например: `https://random-name.trycloudflare.com`) и поделитесь ею

**Преимущества:** Быстро, бесплатно, без регистрации, без пароля!

---

## Вариант 2.1: Использование Localtunnel (может требовать пароль)

### Запуск:

1. Убедитесь, что dev сервер запущен:
   ```bash
   npm run dev
   ```

2. В новом терминале запустите:
   ```bash
   npm run tunnel:lt
   ```

3. Если просит пароль - введите любой (это для защиты от случайного доступа)
4. Скопируйте публичную ссылку из вывода и поделитесь ею

---

## Вариант 3: Использование Cloudflare Tunnel (бесплатно, без регистрации)

### Установка:

```bash
# Скачайте cloudflared с https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# Или используйте через npx:
npx cloudflared tunnel --url http://localhost:5173
```

---

## Рекомендации

- **Ngrok** - самый популярный, но требует регистрации
- **Localtunnel** - простой, без регистрации, но ссылки могут быть длинными
- **Cloudflare Tunnel** - быстрый и надежный, без регистрации

Для постоянного использования рекомендуется Ngrok с бесплатным аккаунтом.

