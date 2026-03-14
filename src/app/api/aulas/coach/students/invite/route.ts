import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Not a coach' }, { status: 403 })

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Create student profile if not exists
    let studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })
    if (!studentProfile) {
      studentProfile = await prisma.studentProfile.create({ data: { userId: user.id } })
    }

    // Create relationship
    const rel = await prisma.coachStudent.upsert({
      where: { coachId_studentId: { coachId: coach.id, studentId: studentProfile.id } },
      update: { status: 'active' },
      create: { coachId: coach.id, studentId: studentProfile.id, status: 'active' },
    })

    return NextResponse.json(rel)
  } catch (error) {
    console.error('Invite student error:', error)
    return NextResponse.json({ error: 'Failed to invite student' }, { status: 500 })
  }
}
