import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const student = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } })
    if (!student) return NextResponse.json({ error: 'Not a student' }, { status: 403 })

    const pkg = await prisma.classPackage.findUnique({ where: { id: params.id } })
    if (!pkg || !pkg.isActive) return NextResponse.json({ error: 'Package not available' }, { status: 404 })

    const expiresAt = pkg.validDays ? new Date(Date.now() + pkg.validDays * 86400000) : null

    const purchase = await prisma.packagePurchase.create({
      data: { packageId: pkg.id, studentId: student.id, expiresAt },
    })

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Purchase package error:', error)
    return NextResponse.json({ error: 'Failed to purchase' }, { status: 500 })
  }
}
