import { GoogleGenAI } from '@google/genai'

// In-memory key pool storage
let keyPool = []
let roundRobinIndex = 0

// Initialize key pool from environment variables
function initKeyPool() {
  const keys = []

  // 1. Collect Gemini keys
  const primaryGemini = process.env.GEMINI_API_KEY
  if (primaryGemini) {
    keys.push({ id: 'gemini-primary', provider: 'gemini', apiKey: primaryGemini, status: 'active', usage: 0, cooldownUntil: 0, priority: 1 })
  }

  const geminiList = process.env.GEMINI_API_KEYS
  if (geminiList) {
    geminiList.split(',').map(k => k.trim()).filter(Boolean).forEach((k, idx) => {
      if (k !== primaryGemini) {
        keys.push({ id: `gemini-extra-${idx + 1}`, provider: 'gemini', apiKey: k, status: 'active', usage: 0, cooldownUntil: 0, priority: 1 })
      }
    })
  }

  // 2. Collect OpenAI keys if present
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    keys.push({ id: 'openai-primary', provider: 'openai', apiKey: openaiKey, status: 'active', usage: 0, cooldownUntil: 0, priority: 2 })
  }

  // 3. Collect Claude keys if present
  const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
  if (claudeKey) {
    keys.push({ id: 'claude-primary', provider: 'claude', apiKey: claudeKey, status: 'active', usage: 0, cooldownUntil: 0, priority: 3 })
  }

  keyPool = keys
}

import fs from 'fs'
const KEYS_FILE = 'scenvy_ai_keys.json'

function loadSavedKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'))
      saved.forEach(k => {
        if (!keyPool.find(existing => existing.apiKey === k.apiKey)) {
          keyPool.push(k)
        }
      })
    }
  } catch (e) {
    console.error('Error loading saved keys', e)
  }
}

function saveKeys() {
  try {
    const toSave = keyPool.filter(k => k.id && !k.id.includes('primary') && !k.id.includes('gemini-extra'))
    fs.writeFileSync(KEYS_FILE, JSON.stringify(toSave, null, 2))
  } catch (e) {
    console.error('Error saving keys', e)
  }
}

// Ensure pool initialized
initKeyPool()
loadSavedKeys()

export function getKeyPoolStatus() {
  if (keyPool.length === 0) {
    initKeyPool()
    loadSavedKeys()
  }
  return keyPool.map(k => ({
    id: k.id,
    provider: k.provider,
    maskedKey: k.apiKey ? `${k.apiKey.slice(0, 6)}...${k.apiKey.slice(-4)}` : 'N/A',
    status: (k.cooldownUntil && Date.now() < k.cooldownUntil) ? 'cooldown' : k.status,
    usage: k.usage,
    priority: k.priority
  }))
}

export function addApiKeyToPool({ provider, apiKey, priority = 1 }) {
  if (!apiKey) return false
  const id = `${provider}-${Date.now()}`
  keyPool.push({
    id,
    provider: provider || 'gemini',
    apiKey: apiKey.trim(),
    status: 'active',
    usage: 0,
    cooldownUntil: 0,
    priority
  })
  saveKeys()
  return true
}

/**
 * Execute an AI operation with Round-Robin key rotation and automatic failover on 429/quota errors
 */
export async function executeAiTask(taskExecutor) {
  if (keyPool.length === 0) {
    initKeyPool()
    loadSavedKeys()
  }

  const availableKeys = keyPool.filter(k => {
    if (k.status === 'disabled') return false
    if (k.cooldownUntil && Date.now() < k.cooldownUntil) return false
    return true
  })

  if (availableKeys.length === 0) {
    console.warn('⚠️ All AI API keys in pool are in cooldown or disabled. Trying primary key as last resort.')
    const primary = keyPool[0]
    if (primary) {
      const ai = new GoogleGenAI({ apiKey: primary.apiKey })
      return await taskExecutor(ai, primary)
    }
    throw new Error('NO_API_KEYS_AVAILABLE')
  }

  // Pick next key in Round-Robin order
  let attempts = 0
  const maxAttempts = availableKeys.length

  while (attempts < maxAttempts) {
    roundRobinIndex = (roundRobinIndex + 1) % availableKeys.length
    const currentKeyObj = availableKeys[roundRobinIndex]

    try {
      console.log(`🤖 [Multi-AI Pool] Using key [${currentKeyObj.id}] (Round-Robin #${roundRobinIndex + 1}/${availableKeys.length})`)
      
      const ai = new GoogleGenAI({
        apiKey: currentKeyObj.apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      })

      const result = await taskExecutor(ai, currentKeyObj)
      currentKeyObj.usage += 1
      currentKeyObj.status = 'active'
      currentKeyObj.cooldownUntil = 0
      return result
    } catch (err) {
      attempts++
      const errMsg = err?.message || String(err)
      const isQuotaOrRateLimit = errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('rate limit')

      console.warn(`🚨 [Multi-AI Pool] Key [${currentKeyObj.id}] failed (Attempt ${attempts}/${maxAttempts}):`, errMsg)

      if (isQuotaOrRateLimit) {
        // Put key on 2-minute cooldown
        currentKeyObj.cooldownUntil = Date.now() + 2 * 60 * 1000
        currentKeyObj.status = 'cooldown'
        console.warn(`⏳ [Multi-AI Pool] Placed key [${currentKeyObj.id}] on 2-minute cooldown. Rotating to next key in pool...`)
      }

      if (attempts >= maxAttempts) {
        throw err
      }
    }
  }

  throw new Error('ALL_AI_KEYS_EXHAUSTED')
}
