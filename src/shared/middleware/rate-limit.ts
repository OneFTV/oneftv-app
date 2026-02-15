import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  windowMs: number
  max: number
  keyPrefix?: string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}, 60_000)

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = 'rl' } = options

  return function checkRateLimit(req: NextRequest): NextResponse | null {
    const ip = getClientIp(req)
    const key = `${keyPrefix}:${ip}`
    const now = Date.now()

    const entry = store.get(key)

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return null
    }

    entry.count++

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return NextResponse.json(
        { error: 'Too many requests, please try again later' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      )
    }

    return null
  }
}
