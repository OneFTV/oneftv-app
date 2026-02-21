import { NextResponse } from 'next/server'
import { CATEGORY_TEMPLATES } from '@/modules/category/templates'

export async function GET() {
  return NextResponse.json({ data: CATEGORY_TEMPLATES })
}
