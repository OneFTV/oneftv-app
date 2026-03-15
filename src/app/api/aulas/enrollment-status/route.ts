import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ status: 'not_logged_in' })

    const { searchParams } = new URL(req.url)
    const coachId = searchParams.get('coachId')
    if (!coachId) return NextResponse.json({ error: 'coachId required' }, { status: 400 })

    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json({ status: 'not_enrolled', studentLevel: null })

    const enrollment = await prisma.coachStudent.findFirst({
      where: { coachId, studentId: student.id },
    })

    return NextResponse.json({
      status: enrollment?.status || 'not_enrolled',
      studentLevel: student.currentLevel,
      studentId: student.id,
      enrollmentId: enrollment?.id || null,
    })
  } catch (error) {
    console.error('Enrollment status error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
