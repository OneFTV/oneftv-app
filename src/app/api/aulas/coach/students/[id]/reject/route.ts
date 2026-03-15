import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const enrollment = await prisma.coachStudent.findUnique({ where: { id: params.id } })
    if (!enrollment || enrollment.coachId !== coach.id) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
    }
    if (enrollment.status !== 'pending') {
      return NextResponse.json({ error: 'Inscrição não está pendente' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))

    await prisma.coachStudent.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: body.reason || null,
      },
    })

    return NextResponse.json({ success: true, message: 'Inscrição rejeitada' })
  } catch (error) {
    console.error('Reject error:', error)
    return NextResponse.json({ error: 'Erro ao rejeitar' }, { status: 500 })
  }
}
