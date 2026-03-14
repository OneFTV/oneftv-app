'use client';

import { useEffect } from 'react';

function getVid(): string {
  if (typeof window === 'undefined') return 'anon';
  let vid = localStorage.getItem('_a_vid');
  if (!vid) {
    vid = 'cl_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('_a_vid', vid);
  }
  return vid;
}

export default function AnalyticsTracker() {
  useEffect(() => {
    const start = Date.now();
    const vid = getVid();

    const sendSession = () => {
      const duration = Math.round((Date.now() - start) / 1000);
      if (duration < 2) return;
      const now = Date.now();
      const payload = JSON.stringify({
        event: 'session_end',
        vid,
        duration,
        date: new Date(now).toISOString().slice(0, 10),
        ts: now,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/event', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/analytics/event', { method: 'POST', body: payload, keepalive: true });
      }
    };

    window.addEventListener('beforeunload', sendSession);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendSession();
    });

    return () => {
      window.removeEventListener('beforeunload', sendSession);
    };
  }, []);

  return null;
}
