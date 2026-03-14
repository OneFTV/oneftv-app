'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  summary: { pageviews_24h: number; pageviews_7d: number; pageviews_30d: number; unique_today: number; unique_7d: number };
  daily: Record<string, { pageviews: number; visitors: number }>;
  top_countries: { country: string; count: number }[];
  top_referrers: { referrer: string; count: number }[];
  devices: { device: string; count: number }[];
  top_pages: { path: string; count: number }[];
  bot_vs_human: { bots: number; humans: number };
  avg_session_seconds: number;
  total_sessions_7d: number;
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No data yet</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300 truncate mr-2">{r.label}</span>
              <span className="text-white font-mono">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(setData)
      .catch(() => setError('Failed to load analytics'));
  }, []);

  if (error) return <div className="text-red-400">{error}</div>;
  if (!data) return <div className="text-gray-400">Loading...</div>;

  const { summary, daily, top_countries, top_referrers, devices, top_pages, bot_vs_human, avg_session_seconds, total_sessions_7d } = data;
  const totalBot = (bot_vs_human.bots || 0) + (bot_vs_human.humans || 0);
  const botPct = totalBot > 0 ? Math.round((bot_vs_human.bots || 0) / totalBot * 100) : 0;

  // Convert daily map to sorted array
  const dailyArr = Object.entries(daily || {})
    .map(([date, d]) => ({ date, pageviews: d.pageviews, visitors: d.visitors }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // SVG chart
  const maxPV = Math.max(...dailyArr.map(d => d.pageviews), 1);
  const chartW = 700;
  const chartH = 200;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card title="Pageviews (24h)" value={summary.pageviews_24h} />
        <Card title="Pageviews (7d)" value={summary.pageviews_7d} />
        <Card title="Pageviews (30d)" value={summary.pageviews_30d} />
        <Card title="Unique Today" value={summary.unique_today} />
        <Card title="Unique (7d)" value={summary.unique_7d} />
      </div>

      {/* Daily Chart */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Daily Pageviews (14 days)</h3>
        {dailyArr.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet</p>
        ) : (
          <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full max-w-3xl">
            {dailyArr.map((d, i) => {
              const x = (i / Math.max(dailyArr.length - 1, 1)) * (chartW - 40) + 20;
              const h = (d.pageviews / maxPV) * chartH;
              return (
                <g key={d.date}>
                  <rect x={x - 8} y={chartH - h} width={16} height={h} fill="#3b82f6" rx={3} />
                  <text x={x} y={chartH + 16} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                    {d.date.slice(5)}
                  </text>
                  <text x={x} y={chartH - h - 4} textAnchor="middle" fill="#e5e7eb" fontSize={10}>
                    {d.pageviews}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Table title="Top Countries" rows={top_countries.map(c => ({ label: c.country, value: c.count }))} />
        <Table title="Top Referrers" rows={top_referrers.map(r => ({ label: r.referrer, value: r.count }))} />
        <Table title="Devices" rows={devices.map(d => ({ label: d.device, value: d.count }))} />
        <Table title="Top Pages" rows={top_pages.map(p => ({ label: p.path, value: p.count }))} />
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <h3 className="text-lg font-semibold">Stats</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">Bot traffic</span><span>{botPct}%</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Avg session</span><span>{avg_session_seconds}s</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Sessions (7d)</span><span>{total_sessions_7d}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
