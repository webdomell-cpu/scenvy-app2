import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

function apiPlugin() {
  return {
    name: 'api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) return next()

        // Helper to parse JSON body for POST/PUT requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const buffers = []
          for await (const chunk of req) buffers.push(chunk)
          const bodyStr = Buffer.concat(buffers).toString()
          try { req.body = JSON.parse(bodyStr) } catch { req.body = {} }
        } else {
          req.body = req.body || {}
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
        req.query = Object.fromEntries(url.searchParams.entries())

        // Polyfill res.status and res.json for Express/Vercel compatibility
        if (!res.status) {
          res.status = (code) => {
            res.statusCode = code
            return res
          }
        }
        if (!res.json) {
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }
        }

        const pathname = url.pathname
        try {
          if (pathname === '/api/ai/generate') {
            const { default: handler } = await import('./api/ai/generate.js')
            return await handler(req, res)
          }
          if (pathname === '/api/ai/parse-menu') {
            const { default: handler } = await import('./api/ai/parse-menu.js')
            return await handler(req, res)
          }
          if (pathname === '/api/analytics') {
            const { default: handler } = await import('./api/analytics.js')
            return await handler(req, res)
          }
          if (pathname === '/api/contact') {
            const { default: handler } = await import('./api/contact.js')
            return await handler(req, res)
          }
          if (pathname === '/api/locations') {
            const { default: handler } = await import('./api/locations.js')
            return await handler(req, res)
          }
          if (pathname === '/api/reels') {
            const { default: handler } = await import('./api/reels.js')
            return await handler(req, res)
          }
          if (pathname === '/api/tenants') {
            const { default: handler } = await import('./api/tenants.js')
            return await handler(req, res)
          }
        } catch (err) {
          console.error(`Error in ${pathname}:`, err)
          return res.status(500).json({ error: err.message || 'Internal Server Error' })
        }

        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    apiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['scenvy-icon.png', 'scenvy-badge.png', 'scenvy-full.png'],
      manifest: {
        id: '/app',
        name: 'SCENVY Partner — Mobile App',
        short_name: 'SCENVY App',
        description: 'Die mobile Mandanten-App für Gastronomie & Hotellerie: Speisekarten, Live-Bestellungen & Tisch-QR-Codes.',
        theme_color: '#09090E',
        background_color: '#09090E',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          {
            src: '/scenvy-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/scenvy-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/scenvy-badge.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/scenvy-full.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
