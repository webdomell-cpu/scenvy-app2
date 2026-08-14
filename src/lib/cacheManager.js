/**
 * Automatic Cache Manager for SCENVY (Menu, Layers, Flow, & Media)
 * Automatically clears stale layer caches and local drafts every few hours.
 */

const CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
const CACHE_METADATA_KEY = 'scenvy_cache_timestamps'

// Keys that represent transient layer or generation caches (exempting user auth & persistent settings)
const LAYER_CACHE_KEYS = [
  'scenvy_cached_menu',
  'scenvy_menu_draft',
  'scenvy_flow_gen_cache',
  'scenvy_temp_layers',
  'scenvy_ai_prompt_cache',
  'scenvy_preview_layers',
  'scenvy_kds_filter_cache'
]

/**
 * Get all tracked cache timestamps
 */
function getCacheTimestamps() {
  try {
    const data = localStorage.getItem(CACHE_METADATA_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    return {}
  }
}

/**
 * Record or touch a cache key with current timestamp
 */
export function touchCacheKey(key) {
  try {
    const timestamps = getCacheTimestamps()
    timestamps[key] = Date.now()
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(timestamps))
  } catch (e) {
    console.warn('CacheManager touch error:', e)
  }
}

/**
 * Check and clean up all expired layer caches automatically
 * @param {boolean} force - If true, purges all transient layer caches immediately
 */
export function autoClearExpiredCaches(force = false) {
  try {
    const now = Date.now()
    const timestamps = getCacheTimestamps()
    let clearedCount = 0

    // 1. Check known layer cache keys
    LAYER_CACHE_KEYS.forEach(key => {
      const ts = timestamps[key]
      const isExpired = force || !ts || (now - ts > CACHE_TTL_MS)

      if (isExpired) {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key)
          clearedCount++
        }
        delete timestamps[key]
      }
    })

    // 2. Scan all localStorage keys for old demo scan / transient temp caches older than TTL
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('scenvy_temp_') || k.startsWith('scenvy_layer_'))) {
        const ts = timestamps[k]
        if (force || !ts || (now - ts > CACHE_TTL_MS)) {
          localStorage.removeItem(k)
          delete timestamps[k]
          clearedCount++
        }
      }
    }

    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(timestamps))
    if (clearedCount > 0) {
      console.log(`🧹 [CacheManager] Automatically cleaned up ${clearedCount} expired layer cache(s). TTL: 3 hours.`)
    }
    return clearedCount
  } catch (err) {
    console.warn('⚠️ [CacheManager] Cache cleanup notice:', err)
    return 0
  }
}

/**
 * Initialize automatic periodic cache cleanup (runs on boot and every 30 minutes)
 */
export function initAutoCacheCleaner() {
  if (typeof window === 'undefined') return

  // Run initial pass on startup
  autoClearExpiredCaches(false)

  // Run periodic background cleanup every 30 minutes
  const intervalId = setInterval(() => {
    autoClearExpiredCaches(false)
  }, 30 * 60 * 1000)

  return () => clearInterval(intervalId)
}

/**
 * Explicit manual clear for all layer caches
 */
export function clearAllLayerCaches() {
  return autoClearExpiredCaches(true)
}
