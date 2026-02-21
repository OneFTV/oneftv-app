import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CategoryService } from '@/modules/category/category.service'
import { createCategorySchema } from '@/modules/category/category.schemas'
import { AppError } from '@/shared/api/errors'
import type { CreateCategoryInput } from '@/modules/category/category.types'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categories = await CategoryService.listByTournament(params.id)
    return NextResponse.json({ data: categories })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('List categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = createCategorySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const category = await CategoryService.create(
      params.id,
      result.data as CreateCategoryInput,
      session.user.id
    )
    return NextResponse.json(
      { message: 'Category created successfully', data: category },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
