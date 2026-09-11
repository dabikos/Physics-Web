// Всегда используем относительный URL в браузере, чтобы все запросы шли на собственный сервер
// и проксировались без CORS-ограничений.
export const API_BASE = typeof window !== 'undefined' ? '' : (import.meta.env.VITE_BACKEND_URL || 'https://physics-app-production-2585.up.railway.app')
