'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      fetch(`/api/aulas/classes${params}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setClasses(d); })
        .finally(() => setLoading(false));
    }
  }, [session, filter]);

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Minhas Aulas</h1>
          <Link href="/aulas/classes/new" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold text-sm">
            + Nova Aula
          </Link>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'scheduled', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
              {f === 'all' ? 'Todas' : f === 'scheduled' ? 'Agendadas' : f === 'completed' ? 'Concluídas' : 'Canceladas'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">Nenhuma aula encontrada</p>
            <Link href="/aulas/classes/new" className="text-cyan-400 hover:underline">Crie sua primeira aula</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <Link key={cls.id} href={`/aulas/classes/${cls.id}`} className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{cls.title}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {new Date(cls.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {cls.locationName && <div className="text-sm text-slate-500 mt-1">📍 {cls.locationName}</div>}
                    <div className="text-sm text-slate-500 mt-1">
                      {cls.type === 'individual' ? '👤 Individual' : cls.type === 'group' ? '👥 Grupo' : '🏫 Clínica'}
                      {' • '}{cls.duration}min • {cls._count?.attendances || 0} aluno(s)
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[cls.status] || 'bg-slate-700 text-slate-300'}`}>
                    {cls.status === 'scheduled' ? 'Agendada' : cls.status === 'completed' ? 'Concluída' : cls.status === 'cancelled' ? 'Cancelada' : cls.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
