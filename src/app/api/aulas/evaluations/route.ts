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

    const body = await req.json()
    const evaluation = await prisma.studentEvaluation.create({
      data: {
        coachId: coach.id,
        studentId: body.studentId,
        overallLevel: body.overallLevel,
        overallNotes: body.overallNotes,
        // Ataque
        shark: body.shark,
        pingo: body.pingo,
        lobby: body.lobby,
        paralela: body.paralela,
        meioFundo: body.meioFundo,
        diagonalCurta: body.diagonalCurta,
        diagonalLonga: body.diagonalLonga,
        cabeceio: body.cabeceio,
        chapa: body.chapa,
        peitoDePe: body.peitoDePe,
        // Levantamento
        chestSet: body.chestSet,
        headSet: body.headSet,
        shoulderSet: body.shoulderSet,
        footSet: body.footSet,
        // Defesa
        defesaLobby: body.defesaLobby,
        defesaPingo: body.defesaPingo,
        defesaParalela: body.defesaParalela,
        defesaMeioFundo: body.defesaMeioFundo,
        defesaDiagonal: body.defesaDiagonal,
        recepcao: body.recepcao,
        // Saque e Tático
        saque: body.saque,
        posicionamento: body.posicionamento,
        bloqueio: body.bloqueio,
        weaknesses: body.weaknesses,
        strengths: body.strengths,
        recommendations: body.recommendations,
      },
    })

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Create evaluation error:', error)
    return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 })
  }
}
