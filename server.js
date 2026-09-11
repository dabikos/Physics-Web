import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = parseInt(process.env.PORT || '3000', 10)
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://physics-app-production-2585.up.railway.app'
const DIST_DIR = path.join(__dirname, 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

const parsedBackend = new URL(BACKEND_URL)

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  // 1. Проксирование API запросов на бэкенд Railway (решает проблему CORS на 100%)
  if (reqUrl.pathname.startsWith('/api/')) {
    const options = {
      protocol: parsedBackend.protocol,
      hostname: parsedBackend.hostname,
      port: parsedBackend.port || (parsedBackend.protocol === 'https:' ? 443 : 80),
      path: reqUrl.pathname + reqUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: parsedBackend.host,
        origin: parsedBackend.origin,
      },
    }

    const proxyReq = https.request(options, (proxyRes) => {
      // Передаём заголовки ответа
      const headers = { ...proxyRes.headers }
      delete headers['access-control-allow-origin']
      headers['access-control-allow-origin'] = '*'
      headers['access-control-allow-headers'] = '*'
      headers['access-control-allow-methods'] = '*'
      res.writeHead(proxyRes.statusCode || 500, headers)
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      console.error('API Proxy error:', err.message)
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ detail: 'Ошибка соединения с сервером Railway API' }))
      }
    })

    req.pipe(proxyReq)
    return
  }

  // 2. Обработка статических файлов
  let filePath = path.join(DIST_DIR, decodeURIComponent(reqUrl.pathname))

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      })
      fs.createReadStream(filePath).pipe(res)
    } else {
      // 3. Fallback для SPA (React Router)
      const indexPath = path.join(DIST_DIR, 'index.html')
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('Index file not found')
        } else {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          })
          res.end(content)
        }
      })
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Physics Web Server running on port ${PORT}`)
  console.log(`Proxying /api/* -> ${BACKEND_URL}/api/*`)
})
