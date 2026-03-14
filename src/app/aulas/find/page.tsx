'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FindCoachPage() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const search = (q?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q || query) params.set('q', q || query);
    fetch(`/api/aulas/discover?${params.toString()}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCoaches(d); setSearched(true); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { search(''); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Encontre um Coach de Futevôlei</h1>
          <p className="text-slate-400">Descubra coaches perto de você e evolua seu jogo</p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8 max-w-2xl mx-auto">
          <input
            type="text" placeholder="Buscar por nome, cidade ou local..."
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition"
          />
          <button onClick={() => search()} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition">
            Buscar
          </button>
        </div>

        {/* Map placeholder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-8 text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-slate-400">Mapa em breve — use a busca por texto acima</p>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            {searched ? 'Nenhum coach encontrado. Tente outra busca.' : 'Carregando...'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach: any) => (
              <Link key={coach.id} href={`/aulas/find/${coach.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {coach.user?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-semibold group-hover:text-cyan-400 transition">{coach.user?.name}</div>
                    <div className="text-sm text-slate-400">
                      {[coach.city, coach.state, coach.country].filter(Boolean).join(', ') || 'Localização não informada'}
                    </div>
                  </div>
                </div>
                {coach.bio && <p className="text-sm text-slate-400 mb-3 line-clamp-2">{coach.bio}</p>}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-3 text-slate-400">
                    {coach.avgRating > 0 && <span>⭐ {coach.avgRating}</span>}
                    <span>👥 {coach._count?.students || 0}</span>
                  </div>
                  {coach.hourlyRate && (
                    <span className="font-semibold text-cyan-400">
                      {coach.currency} {parseFloat(coach.hourlyRate).toFixed(0)}/h
                    </span>
                  )}
                </div>
                {coach.isVerified && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">✓ Verificado</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
