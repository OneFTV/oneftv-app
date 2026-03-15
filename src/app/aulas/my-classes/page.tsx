'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
  confirmed: { label: 'Confirmada', color: 'text-green-400 bg-green-500/20 border-green-500/30' },
  rejected: { label: 'Rejeitada', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
  cancelled: { label: 'Cancelada', color: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
  no_show: { label: 'Falta', color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
};

export default function MyClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchData = () => {
    if (!session?.user?.id) return;
    Promise.all([
      fetch('/api/aulas/my-bookings').then(r => r.json()),
      fetch('/api/aulas/classes/upcoming').then(r => r.json()),
    ]).then(([b, c]) => {
      if (Array.isArray(b)) setBookings(b);
      if (Array.isArray(c)) setClasses(c);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [session]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancelar esta reserva?')) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/aulas/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Erro ao cancelar');
      }
    } finally {
      setCancellingId(null);
    }
  };

  const now = new Date();
  const upcomingBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status) && new Date(b.class?.scheduledAt) > now);
  const pastBookings = bookings.filter(b => !['pending', 'confirmed'].includes(b.status) || new Date(b.class?.scheduledAt) <= now);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Minhas Aulas</h1>
          <Link href="/aulas/find" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700">
            Encontrar Coach
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Próximas Reservas</h2>
                <div className="space-y-3">
                  {upcomingBookings.map((b: any) => {
                    const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                    return (
                      <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-lg">{b.class?.title}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              👨‍🏫 {b.class?.coach?.user?.name}
                            </div>
                            <div className="text-sm text-slate-400">
                              {new Date(b.class?.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {b.class?.locationName && <div className="text-sm text-slate-500 mt-1">📍 {b.class.locationName}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs border ${st.color}`}>{st.label}</span>
                            {['pending', 'confirmed'].includes(b.status) && (
                              <button onClick={() => handleCancel(b.id)} disabled={cancellingId === b.id}
                                className="text-xs text-red-400 hover:text-red-300 transition disabled:opacity-50">
                                {cancellingId === b.id ? 'Cancelando...' : 'Cancelar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legacy class attendances */}
            {classes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Aulas Agendadas</h2>
                <div className="space-y-3">
                  {classes.map((att: any) => (
                    <div key={att.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-lg">{att.class?.title}</div>
                          <div className="text-sm text-slate-400 mt-1">👨‍🏫 {att.class?.coach?.user?.name}</div>
                          <div className="text-sm text-slate-400">
                            {new Date(att.class?.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {att.class?.locationName && <div className="text-sm text-slate-500 mt-1">📍 {att.class.locationName}</div>}
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">{att.class?.duration}min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-slate-400">Histórico</h2>
                <div className="space-y-3">
                  {pastBookings.map((b: any) => {
                    const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                    return (
                      <div key={b.id} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5 opacity-60">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{b.class?.title}</div>
                            <div className="text-sm text-slate-400">
                              {new Date(b.class?.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {' • '}{b.class?.coach?.user?.name}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs border ${st.color}`}>{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {upcomingBookings.length === 0 && classes.length === 0 && pastBookings.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg mb-2">Nenhuma aula agendada</p>
                <Link href="/aulas/find" className="text-cyan-400 hover:underline">Encontre um coach para começar!</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
