import Redis from 'ioredis'

/**
 * Check if Redis caching is enabled via environment variables.
 * Both USE_REDIS must be 'true' AND REDIS_URL must be provided.
 */
export function isRedisConfigured() {
  const useRedis = (process.env.USE_REDIS || '').trim().toLowerCase() === 'true'
  const hasUrl = Boolean(process.env.REDIS_URL && process.env.REDIS_URL.trim())
  return useRedis && hasUrl
}

/**
 * Retrieves default Redis TTL from environment variable in seconds.
 * Supports REDIS_CACHE_TTL_SECONDS or REDIS_TTL.
 * Set to 0 to keep data cached permanently (No expiry timer, purged on admin edit).
 * If undefined or invalid, defaults to 0 (Permanent until admin edit).
 *
 * @returns {number}
 */
export function getRedisTtlFromEnv() {
  const envVal = process.env.REDIS_CACHE_TTL_SECONDS || process.env.REDIS_TTL
  if (envVal !== undefined && envVal !== null && envVal !== '') {
    const parsed = parseInt(envVal.trim(), 10)
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed
    }
  }
  return 0
}

/**
 * Singleton Redis client getter for Next.js / Node.js runtime.
 * Avoids creating multiple client instances during development hot-reloads.
 */
export function getRedisClient() {
  if (!isRedisConfigured()) {
    return null
  }

  // Use globalThis to persist connection across HMR (Hot Module Replacement)
  if (!globalThis.__redisClient) {
    try {
      const client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: true,
        connectTimeout: 5000,
        retryStrategy(times) {
          if (times > 3) {
            // Stop reconnecting after 3 failed attempts to avoid endless retries
            return null
          }
          return Math.min(times * 200, 2000)
        },
      })

      client.on('error', (err) => {
        console.warn('[Redis] Connection warning:', err?.message || err)
      })

      globalThis.__redisClient = client
    } catch (err) {
      console.warn('[Redis] Initialization error:', err?.message || err)
      return null
    }
  }

  return globalThis.__redisClient
}

/**
 * Get cached data by key.
 * Returns parsed JSON or null if missing/failed.
 *
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  const client = getRedisClient()
  if (!client) return null

  try {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.warn(`[Redis] Error reading key "${key}":`, err?.message || err)
    return null
  }
}

/**
 * Set data into Redis with an optional expiration time (TTL in seconds).
 * If ttlSeconds is not provided, defaults to REDIS_CACHE_TTL_SECONDS from .env (or 0 = No Expiration).
 * If 0 or omitted, data persists indefinitely in Redis until purged by admin edit.
 *
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds]
 * @returns {Promise<boolean>}
 */
export async function setCache(key, value, ttlSeconds) {
  const client = getRedisClient()
  if (!client) return false

  try {
    const serialized = JSON.stringify(value)
    const effectiveTtl =
      typeof ttlSeconds === 'number' && ttlSeconds >= 0
        ? ttlSeconds
        : getRedisTtlFromEnv()

    if (effectiveTtl && effectiveTtl > 0) {
      await client.set(key, serialized, 'EX', effectiveTtl)
    } else {
      await client.set(key, serialized)
    }
    return true
  } catch (err) {
    console.warn(`[Redis] Error setting key "${key}":`, err?.message || err)
    return false
  }
}

/**
 * Delete one or more keys from Redis.
 * Supports a single key string, an array of keys, or a wildcard pattern (e.g. "portfolio:*").
 *
 * @param {string|string[]} keyOrPattern
 * @returns {Promise<boolean>}
 */
export async function deleteCache(keyOrPattern) {
  const client = getRedisClient()
  if (!client) return false

  try {
    // Array of specific keys
    if (Array.isArray(keyOrPattern)) {
      if (keyOrPattern.length > 0) {
        await client.del(...keyOrPattern)
      }
      return true
    }

    // Pattern deletion using scan stream (safe for production without blocking)
    if (typeof keyOrPattern === 'string' && keyOrPattern.includes('*')) {
      const stream = client.scanStream({
        match: keyOrPattern,
        count: 100,
      })

      const keysToDelete = []
      for await (const batch of stream) {
        if (batch.length > 0) {
          keysToDelete.push(...batch)
        }
      }

      if (keysToDelete.length > 0) {
        await client.del(...keysToDelete)
      }
      return true
    }

    // Single key deletion
    if (typeof keyOrPattern === 'string') {
      await client.del(keyOrPattern)
      return true
    }

    return false
  } catch (err) {
    console.warn(`[Redis] Error deleting cache for "${keyOrPattern}":`, err?.message || err)
    return false
  }
}

/**
 * Cache-aside wrapper function.
 *
 * Workflow:
 * 1. Checks if Redis is enabled via `USE_REDIS=true` and `REDIS_URL`. If not, executes `fetcherFn` directly.
 * 2. Tries to find the key in Redis (Cache Hit -> returns parsed cached data).
 * 3. On Cache Miss -> calls `fetcherFn()`, stores the result in Redis with TTL (from REDIS_CACHE_TTL_SECONDS in .env or param), and returns.
 * 4. Error fallback -> If Redis fails or throws an error at any time, it catches it and falls back to `fetcherFn()`.
 *
 * @template T
 * @param {string} key Cache key
 * @param {number | (() => Promise<T>)} [ttlSecondsOrFetcher] Expiration in seconds, or fetcherFn directly
 * @param {() => Promise<T>} [fetcherFn] Database fallback query function (if ttl was specified)
 * @returns {Promise<T>}
 */
export async function rememberCache(key, ttlSecondsOrFetcher, fetcherFn) {
  let effectiveTtl = getRedisTtlFromEnv()
  let fetcher = fetcherFn

  if (typeof ttlSecondsOrFetcher === 'function') {
    fetcher = ttlSecondsOrFetcher
  } else if (typeof ttlSecondsOrFetcher === 'number' && ttlSecondsOrFetcher >= 0) {
    effectiveTtl = ttlSecondsOrFetcher
  }

  // If Redis is not enabled, directly execute database query
  if (!isRedisConfigured()) {
    return await fetcher()
  }

  // 1. Check Redis Cache
  try {
    const cachedData = await getCache(key)
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData
    }
  } catch (err) {
    console.warn(`[Redis] Cache lookup failed for "${key}", falling back to DB:`, err?.message || err)
  }

  // 2. Cache Miss: Fetch from Primary Database
  const freshData = await fetcher()

  // 3. Save to Redis for subsequent requests
  if (freshData !== null && freshData !== undefined) {
    try {
      await setCache(key, freshData, effectiveTtl)
    } catch (err) {
      console.warn(`[Redis] Failed to cache data for "${key}":`, err?.message || err)
    }
  }

  return freshData
}

export default getRedisClient
