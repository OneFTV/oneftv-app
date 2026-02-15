import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UnauthorizedError } from '@/shared/api/errors'
import { apiError } from '@/shared/api/response'

interface AuthSession {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface AuthContext {
  session: AuthSession
  params?: Record<string, string>
}

type AuthHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse>

export function withAuth(handler: AuthHandler) {
  return async (
    req: NextRequest,
    routeCtx?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions)

      if (!session || !session.user?.id) {
        throw new UnauthorizedError()
      }

      return handler(req, {
        session: session as AuthSession,
        params: routeCtx?.params,
      })
    } catch (error) {
      return apiError(error)
    }
  }
}
