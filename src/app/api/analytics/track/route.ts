import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, vid, country, device, referrer, isBot, date, ts } = body;

    if (!path || !vid || !date || ts === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await prisma.analyticsPageview.create({
      data: {
        path,
        vid,
        country: country || 'unknown',
        device: device || 'desktop',
        referrer: referrer || 'direct',
        isBot: isBot || false,
        date,
        ts: BigInt(ts),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
