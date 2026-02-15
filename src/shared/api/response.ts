import { NextResponse } from 'next/server'
import { AppError } from './errors'

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiPaginated<T>(
  data: T[],
  meta: PaginationMeta
): NextResponse {
  return NextResponse.json({ success: true, data, meta }, { status: 200 })
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    )
  }

  console.error('Unhandled error:', error)
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  )
}
