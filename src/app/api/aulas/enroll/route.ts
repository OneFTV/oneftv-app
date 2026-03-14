import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Faça login para se inscrever' }, { status: 401 })
    }

    const body = await req.json()
    const { coachId, dominantFoot, currentLevel, position } = body

    if (!coachId) {
      return NextResponse.json({ error: 'Coach não especificado' }, { status: 400 })
    }

    // Verify coach exists
    const coach = await prisma.coachProfile.findUnique({ where: { id: coachId } })
    if (!coach) {
      return NextResponse.json({ error: 'Coach não encontrado' }, { status: 404 })
    }

    // Check if user is trying to enroll with themselves
    if (coach.userId === session.user.id) {
      return NextResponse.json({ error: 'Você não pode se inscrever como aluno de si mesmo' }, { status: 400 })
    }

    // Create or update student profile
    let student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!student) {
      student = await prisma.studentProfile.create({
        data: {
          userId: session.user.id,
          dominantFoot: dominantFoot || 'right',
          currentLevel: currentLevel || 'beginner',
          position: position || 'both',
          totalClasses: 0,
          totalCoaches: 1,
        },
      })
    }

    // Check if already enrolled with this coach
    const existing = await prisma.coachStudent.findFirst({
      where: { coachId, studentId: student.id },
    })

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json({ error: 'Você já é aluno deste coach' }, { status: 400 })
      }
      // Reactivate if inactive
      await prisma.coachStudent.update({
        where: { id: existing.id },
        data: { status: 'active', startDate: new Date() },
      })
      return NextResponse.json({ success: true, message: 'Inscrição reativada' })
    }

    // Create coach-student relationship
    await prisma.coachStudent.create({
      data: {
        coachId,
        studentId: student.id,
        status: 'active',
        startDate: new Date(),
      },
    })

    // Update totalCoaches count
    const coachCount = await prisma.coachStudent.count({
      where: { studentId: student.id, status: 'active' },
    })
    await prisma.studentProfile.update({
      where: { id: student.id },
      data: { totalCoaches: coachCount },
    })

    return NextResponse.json({ success: true, message: 'Inscrição confirmada' })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ error: 'Erro ao processar inscrição' }, { status: 500 })
  }
}
