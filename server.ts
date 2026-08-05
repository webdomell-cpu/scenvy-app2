import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'

import generateAiHandler from './api/ai/generate.js'
import parseMenuHandler from './api/ai/parse-menu.js'
import adminKeysHandler from './api/admin/keys.js'
import contactHandler from './api/contact.js'
import stripeHandler from './api/stripe/stripe-handler.js'
import ssoHandler from './api/auth/sso.js'

async function startServer() {
  const app = express()
  const PORT = 3000

  // Trust Google Cloud Run / Load Balancer reverse proxies for HTTPS
  app.set('trust proxy', 1)

  // Increased body limit for menu uploads and images
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true, limit: '50mb' }))

  // Wrap Vercel/Node style handler for Express
  const adapt = (handler: any) => async (req: express.Request, res: express.Response) => {
    try {
      await handler(req, res)
    } catch (err: any) {
      console.error('API Error:', err)
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message || 'Internal Server Error' })
      }
    }
  }

  // API Routes
  app.all('/api/ai/generate', adapt(generateAiHandler))
  app.all('/api/ai/parse-menu', adapt(parseMenuHandler))
  app.all('/api/admin/keys', adapt(adminKeysHandler))
  app.all('/api/contact', adapt(contactHandler))
  app.all('/api/auth/sso', adapt(ssoHandler))
  app.all('/api/auth/sso-token', adapt(ssoHandler))
  app.all('/api/stripe/create-checkout-session', adapt(stripeHandler))
  app.all('/api/stripe/create-portal-session', adapt(stripeHandler))
  app.all('/api/stripe/status', adapt(stripeHandler))
  app.all('/api/stripe/webhook', adapt(stripeHandler))
  app.all('/api/stripe/*splat', adapt(stripeHandler))

  app.get('/api/download-project', (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'scenvy-project.zip')
    res.download(zipPath, 'scenvy-project.zip', (err) => {
      if (err) {
        console.error('Download error:', err)
        if (!res.headersSent) res.status(500).send('ZIP file error')
      }
    })
  })

  // Vite middleware for dev mode vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Scenvy server running on http://0.0.0.0:${PORT}`)
  })
}

startServer()
