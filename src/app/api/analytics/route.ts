import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const day = 86400000;
  const ts24h = BigInt(now - day);
  const ts7d = BigInt(now - 7 * day);
  const ts30d = BigInt(now - 30 * day);

  const today = new Date().toISOString().slice(0, 10);

  const [pv24h, pv7d, pv30d] = await Promise.all([
    prisma.analyticsPageview.count({ where: { ts: { gte: ts24h }, isBot: false } }),
    prisma.analyticsPageview.count({ where: { ts: { gte: ts7d }, isBot: false } }),
    prisma.analyticsPageview.count({ where: { ts: { gte: ts30d }, isBot: false } }),
  ]);

  const uniqueToday = await prisma.analyticsPageview.groupBy({
    by: ['vid'],
    where: { date: today, isBot: false },
  });

  const unique7d = await prisma.analyticsPageview.groupBy({
    by: ['vid'],
    where: { ts: { gte: ts7d }, isBot: false },
  });

  // Daily data (last 14 days)
  const days14 = BigInt(now - 14 * day);
  const dailyPvs = await prisma.analyticsPageview.groupBy({
    by: ['date'],
    where: { ts: { gte: days14 }, isBot: false },
    _count: true,
    orderBy: { date: 'asc' },
  });

  // For unique visitors per day, we need raw query
  const dailyVisitors = await prisma.$queryRaw<{ date: string; cnt: number }[]>`
    SELECT date, COUNT(DISTINCT vid) as cnt FROM AnalyticsPageview 
    WHERE ts >= ${days14} AND isBot = false 
    GROUP BY date ORDER BY date ASC
  `;

  const dailyMap: Record<string, { pageviews: number; visitors: number }> = {};
  for (const d of dailyPvs) {
    dailyMap[d.date] = { pageviews: d._count, visitors: 0 };
  }
  for (const d of dailyVisitors) {
    if (dailyMap[d.date]) dailyMap[d.date].visitors = Number(d.cnt);
    else dailyMap[d.date] = { pageviews: 0, visitors: Number(d.cnt) };
  }

  // Top countries
  const topCountries = await prisma.analyticsPageview.groupBy({
    by: ['country'],
    where: { ts: { gte: ts30d }, isBot: false },
    _count: true,
    orderBy: { _count: { country: 'desc' } },
    take: 10,
  });

  // Top referrers
  const topReferrers = await prisma.analyticsPageview.groupBy({
    by: ['referrer'],
    where: { ts: { gte: ts30d }, isBot: false },
    _count: true,
    orderBy: { _count: { referrer: 'desc' } },
    take: 10,
  });

  // Devices
  const devices = await prisma.analyticsPageview.groupBy({
    by: ['device'],
    where: { ts: { gte: ts30d }, isBot: false },
    _count: true,
    orderBy: { _count: { device: 'desc' } },
  });

  // Top pages
  const topPages = await prisma.analyticsPageview.groupBy({
    by: ['path'],
    where: { ts: { gte: ts30d }, isBot: false },
    _count: true,
    orderBy: { _count: { path: 'desc' } },
    take: 10,
  });

  // Bot vs human
  const [botCount, humanCount] = await Promise.all([
    prisma.analyticsPageview.count({ where: { ts: { gte: ts30d }, isBot: true } }),
    prisma.analyticsPageview.count({ where: { ts: { gte: ts30d }, isBot: false } }),
  ]);

  // Sessions
  const sessions7d = await prisma.analyticsSession.findMany({
    where: { ts: { gte: ts7d } },
    select: { duration: true },
  });
  const totalSessions = sessions7d.length;
  const avgSession = totalSessions > 0
    ? Math.round(sessions7d.reduce((s, r) => s + r.duration, 0) / totalSessions)
    : 0;

  // Serialize BigInt-safe
  const result = {
    summary: {
      pageviews_24h: pv24h,
      pageviews_7d: pv7d,
      pageviews_30d: pv30d,
      unique_today: uniqueToday.length,
      unique_7d: unique7d.length,
    },
    daily: dailyMap,
    top_countries: topCountries.map(c => ({ country: c.country, count: c._count })),
    top_referrers: topReferrers.map(r => ({ referrer: r.referrer, count: r._count })),
    devices: devices.map(d => ({ device: d.device, count: d._count })),
    top_pages: topPages.map(p => ({ path: p.path, count: p._count })),
    bot_vs_human: { bots: botCount, humans: humanCount },
    avg_session_seconds: avgSession,
    total_sessions_7d: totalSessions,
  };

  return NextResponse.json(result);
}
