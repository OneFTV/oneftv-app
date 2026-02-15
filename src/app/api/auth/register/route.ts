import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/modules/auth/auth.service'
import { registerSchema } from '@/modules/auth/auth.schemas'
import { AppError } from '@/shared/api/errors'
import { rateLimit } from '@/shared/middleware/rate-limit'

const checkLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'register' })

export async function POST(req: NextRequest) {
  const limited = checkLimit(req)
  if (limited) return limited

  try {
    const body = await req.json()

    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { email, name, password } = result.data
    const user = await AuthService.register(email, name, password)

    return NextResponse.json({ message: 'User registered successfully', user }, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
