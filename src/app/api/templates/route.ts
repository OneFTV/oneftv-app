import { NextResponse } from 'next/server'
import { CATEGORY_TEMPLATES } from '@/modules/category/templates'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ data: CATEGORY_TEMPLATES })
}
