import { NextRequest, NextResponse } from 'next/server'
import { detectConflicts } from '@/lib/multiCategoryScheduler'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conflicts = await detectConflicts(params.id)
    return NextResponse.json({ conflicts, count: conflicts.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to detect conflicts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
