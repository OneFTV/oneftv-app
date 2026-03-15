import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    let settings = await prisma.coachSettings.findUnique({ where: { coachId: coach.id } })
    if (!settings) {
      settings = await prisma.coachSettings.create({ data: { coachId: coach.id } })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (!coach) return NextResponse.json({ error: 'Não é coach' }, { status: 403 })

    const body = await req.json()

    const settings = await prisma.coachSettings.upsert({
      where: { coachId: coach.id },
      create: { coachId: coach.id, ...body },
      update: body,
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
