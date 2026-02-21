import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { browserLocale, normalizedLang, pageUrl, userAgent } = body

    if (!browserLocale || !normalizedLang) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await prisma.languageDemand.create({
      data: {
        browserLocale: String(browserLocale).slice(0, 20),
        normalizedLang: String(normalizedLang).slice(0, 10),
        pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    // Silent fail — this is fire-and-forget analytics
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
