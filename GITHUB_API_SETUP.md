# Настройка GitHub Models API

## Проблема с 404 ошибкой

Если вы получаете ошибку `404 - 404 page not found`, это означает, что endpoint неправильный или API изменился.

## Возможные решения:

### 1. Проверьте правильный endpoint

GitHub Models API может использовать разные endpoints:
- `https://api.github.com/models/inference`
- `https://models.github.com/inference`
- `https://models.github.ai/inference`
- `https://api.github.com/v1/models/inference`

### 2. Проверьте токен

Убедитесь, что токен в `.env` файле правильный:
```env
VITE_GITHUB_PAT=your_token_here
```

### 3. Проверьте права токена

Токен должен иметь права на использование Models API.

### 4. Альтернативные решения

Если GitHub Models API не работает, можно использовать:

1. **OpenAI API** (платно)
2. **Anthropic Claude API** (платно)
3. **Hugging Face Inference API** (бесплатно с ограничениями)
4. **Local LLM** (Ollama, LM Studio)

## Настройка альтернативного API

Если хотите использовать другой API, обновите файл `src/lib/githubAI.ts`:

```typescript
// Пример для OpenAI
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY

// Пример для Hugging Face
const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct'
const HF_KEY = import.meta.env.VITE_HF_KEY
```

## Проверка API

Проверьте, работает ли API, используя curl:

```bash
curl -X POST https://models.github.ai/inference \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model": "meta-llama/Meta-Llama-3.1-8B-Instruct", "messages": [{"role": "user", "content": "Hello"}]}'
```

Если получаете 404, значит endpoint неправильный или API недоступен.





