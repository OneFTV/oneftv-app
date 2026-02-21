import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '@/shared/api/errors'
import { apiError } from '@/shared/api/response'

interface ValidationContext<T> {
  data: T
  params?: Record<string, string>
}

type ValidatedHandler<T> = (
  req: NextRequest,
  ctx: ValidationContext<T>
) => Promise<NextResponse>

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>
) {
  return async (
    req: NextRequest,
    routeCtx?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      const body = await req.json()
      const result = schema.safeParse(body)

      if (!result.success) {
        throw new ValidationError(
          'Validation failed',
          (result.error as ZodError).flatten()
        )
      }

      return handler(req, {
        data: result.data,
        params: routeCtx?.params,
      })
    } catch (error) {
      return apiError(error)
    }
  }
}
