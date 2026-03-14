import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json({ error: 'Not a student' }, { status: 403 })

    const body = await req.json()
    const review = await prisma.coachReview.upsert({
      where: { coachId_studentId: { coachId: body.coachId, studentId: student.id } },
      update: { rating: body.rating, comment: body.comment, isPublic: body.isPublic ?? true },
      create: { coachId: body.coachId, studentId: student.id, rating: body.rating, comment: body.comment, isPublic: body.isPublic ?? true },
    })
    return NextResponse.json(review)
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
