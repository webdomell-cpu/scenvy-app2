import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  try {
    const data = req.method === 'POST' ? (req.body || {}) : (req.query || {})
    const userId = data.userId || data.user_id || 'guest_user'
    const tenantId = data.tenantId || data.tenant_id || 'tenant_default'
    const role = data.role || 'tenant_owner'
    const email = data.email || ''
    const targetDomain = data.targetDomain || data.domain || 'board.scenvy.de'

    const payload = {
      iss: 'app.scenvy.de',
      sub: userId,
      uid: userId,
      tenant_id: tenantId,
      role: role,
      email: email,
      target: targetDomain,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    }

    const secret = process.env.SSO_SECRET || 'scenvy_platform_sso_secret_2026'

    // Create JWT header and payload (base64url format)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')

    const ssoToken = `${header}.${body}.${signature}`

    const domainMap = {
      board: 'https://board.scenvy.de',
      'board.scenvy.de': 'https://board.scenvy.de',
      flow: 'https://flow.scenvy.de',
      'flow.scenvy.de': 'https://flow.scenvy.de',
      menu: 'https://menu.scenvy.de',
      'menu.scenvy.de': 'https://menu.scenvy.de',
      app: 'https://app.scenvy.de',
      'app.scenvy.de': 'https://app.scenvy.de'
    }

    const baseUrl = domainMap[targetDomain] || (targetDomain.startsWith('http') ? targetDomain : `https://${targetDomain}`)
    const redirectUrl = `${baseUrl}/?sso_token=${encodeURIComponent(ssoToken)}&tenant_id=${encodeURIComponent(tenantId)}&user_id=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`

    return res.status(200).json({
      success: true,
      ssoToken,
      redirectUrl,
      tenantId,
      userId,
      role,
      expiresAt: payload.exp
    })
  } catch (err) {
    console.error('SSO Generation Error:', err)
    return res.status(500).json({ error: err?.message || 'SSO token creation failed' })
  }
}
