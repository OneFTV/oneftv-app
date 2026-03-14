import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STATIC = /\.(ico|png|jpg|jpeg|gif|svg|css|js|woff2?|ttf|map|webp)$/;
const SKIP = /^\/(api|_next|favicon)/;
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|mediapartners|google|bing|yandex|baidu|duckduck|twitter|linkedin|whatsapp|telegram|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider/i;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (SKIP.test(pathname) || STATIC.test(pathname)) return NextResponse.next();

  // Fire and forget — don't await
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
    const ua = req.headers.get('user-agent') || '';
    const refHeader = req.headers.get('referer') || '';

    // Hash IP for vid
    let hash = 0;
    const seed = ip + ua.slice(0, 20);
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    const vid = 'mw_' + Math.abs(hash).toString(36);

    const isBot = BOT_RE.test(ua);
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    const device = isMobile ? 'mobile' : 'desktop';

    let referrer = 'direct';
    if (refHeader) {
      try {
        const refUrl = new URL(refHeader);
        if (refUrl.hostname !== req.nextUrl.hostname) {
          referrer = refUrl.hostname;
        }
      } catch {
        referrer = 'direct';
      }
    }

    const now = Date.now();
    const date = new Date(now).toISOString().slice(0, 10);

    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        vid,
        country: 'unknown',
        device,
        referrer,
        isBot,
        date,
        ts: now,
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon).*)'],
};
