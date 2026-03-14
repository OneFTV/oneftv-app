import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if coach
    const coach = await prisma.coachProfile.findUnique({ where: { userId: session.user.id } })
    if (coach) {
      const studentIds = (await prisma.coachStudent.findMany({ where: { coachId: coach.id }, select: { studentId: true } })).map(s => s.studentId)
      const payments = await prisma.aulaPayment.findMany({
        where: { studentId: { in: studentIds } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { paidAt: 'desc' },
      })
      return NextResponse.json(payments)
    }

    // Check if student
    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (student) {
      const payments = await prisma.aulaPayment.findMany({
        where: { studentId: student.id },
        orderBy: { paidAt: 'desc' },
      })
      return NextResponse.json(payments)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('List payments error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const payment = await prisma.aulaPayment.create({
      data: {
        studentId: body.studentId,
        amount: body.amount,
        currency: body.currency || 'USD',
        method: body.method,
        status: body.status || 'confirmed',
        type: body.type || 'single_class',
        classId: body.classId,
        purchaseId: body.purchaseId,
        notes: body.notes,
      },
    })
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}
