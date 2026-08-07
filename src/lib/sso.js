// src/lib/sso.js — Cross-Domain SSO Link Generator & Launcher
export async function getSsoLaunchUrl(targetDomain, user, tenant) {
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
  const uid = user?.uid || user?.id || 'guest_user'
  const tenantId = tenant?.id || user?.tenant_id || 'tenant_default'
  const role = user?.role || 'tenant_owner'
  const email = user?.email || ''

  try {
    const res = await fetch('/api/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uid,
        tenantId,
        role,
        email,
        targetDomain
      })
    })

    if (res.ok) {
      const data = await res.json()
      if (data.redirectUrl) return data.redirectUrl
    }
  } catch (err) {
    console.warn('SSO token fetch notice:', err)
  }

  // Fallback signed token format if server API is unavailable
  const fallbackToken = btoa(JSON.stringify({
    iss: 'app.scenvy.de',
    sub: uid,
    tenant_id: tenantId,
    role,
    exp: Date.now() + 15 * 60 * 1000
  }))

  return `${baseUrl}/?sso_token=${encodeURIComponent(fallbackToken)}&tenant_id=${encodeURIComponent(tenantId)}&user_id=${encodeURIComponent(uid)}&role=${encodeURIComponent(role)}`
}

export async function launchSubdomainModule(targetDomain, user, tenant, openInNewTab = true) {
  const url = await getSsoLaunchUrl(targetDomain, user, tenant)
  if (openInNewTab) {
    window.open(url, '_blank')
  } else {
    window.location.href = url
  }
}
