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
        shark: body.shark,
        dropKick: body.dropKick,
        header: body.header,
        insideKick: body.insideKick,
        outsideKick: body.outsideKick,
        chestSet: body.chestSet,
        headSet: body.headSet,
        shoulderSet: body.shoulderSet,
        footSet: body.footSet,
        reception: body.reception,
        positioning: body.positioning,
        reading: body.reading,
        agility: body.agility,
        endurance: body.endurance,
        explosiveness: body.explosiveness,
        consistency: body.consistency,
        competitiveness: body.competitiveness,
        composure: body.composure,
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
