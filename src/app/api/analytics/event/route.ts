import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, data, vid, date, ts, duration } = body;

    if (!event || !date || ts === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (event === 'session_end' && duration !== undefined) {
      await prisma.analyticsSession.create({
        data: {
          vid: vid || 'anon',
          duration: Math.round(Number(duration)),
          date,
          ts: BigInt(ts),
        },
      });
    } else {
      await prisma.analyticsEvent.create({
        data: {
          event,
          data: typeof data === 'string' ? data : JSON.stringify(data || {}),
          vid: vid || 'anon',
          date,
          ts: BigInt(ts),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
