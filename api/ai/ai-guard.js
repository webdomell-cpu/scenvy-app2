const requestCounts = new Map()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of requestCounts.entries()) {
    if (now - timestamp > 60000) {
      requestCounts.delete(key)
    }
  }
}, 300000)

export function checkRateLimitAndAuth(req, limitPerMinute = 20) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  const userToken = req.headers['authorization'] || req.headers['x-user-id'] || clientIp
  
  const key = `${clientIp}_${userToken}`
  const now = Date.now()
  
  const history = requestCounts.get(key) || []
  const recentHistory = history.filter(ts => now - ts < 60000)

  if (recentHistory.length >= limitPerMinute) {
    return { allowed: false, status: 429, error: 'Rate limit exceeded. Please try again in 1 minute.' }
  }

  recentHistory.push(now)
  requestCounts.set(key, recentHistory)

  return { allowed: true }
}
