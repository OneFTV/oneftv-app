import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // body: { attendances: [{ studentId, status }] }
    const results = await Promise.all(
      body.attendances.map((a: { studentId: string; status: string }) =>
        prisma.classAttendance.upsert({
          where: { classId_studentId: { classId: params.id, studentId: a.studentId } },
          update: { status: a.status, checkedInAt: a.status === 'attended' ? new Date() : null },
          create: { classId: params.id, studentId: a.studentId, status: a.status, checkedInAt: a.status === 'attended' ? new Date() : null },
        })
      )
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Update attendance error:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}
