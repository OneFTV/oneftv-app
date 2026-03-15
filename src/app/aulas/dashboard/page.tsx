'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  stats: {
    totalStudents: number; classesThisWeek: number; avgRating: number;
    totalReviews: number; pendingStudentsCount: number; pendingBookingsCount: number;
  };
  upcomingClasses: any[];
  pendingStudents: any[];
  pendingBookings: any[];
  coachId: string;
}

export default function CoachDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchData = () => {
    if (session?.user?.id) {
      fetch('/api/aulas/dashboard')
        .then(r => r.json())
        .then(d => { if (!d.error) setData(d); })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchData(); }, [session]);

  const handleStudentAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/aulas/coach/students/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookingAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/aulas/coach/bookings/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Crie seu Perfil de Coach</h2>
        <p className="text-slate-400">Você ainda não tem um perfil de coach configurado.</p>
        <Link href="/aulas/coach-setup" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition">
          Configurar Perfil
        </Link>
      </div>
    );
  }

  const { stats, upcomingClasses, pendingStudents, pendingBookings } = data;
  const totalPending = stats.pendingStudentsCount + stats.pendingBookingsCount;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Aulas</h1>
            <p className="text-slate-400 mt-1">Gerencie suas aulas e alunos</p>
          </div>
          <div className="flex gap-3">
            <Link href="/aulas/classes/new" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-cyan-500 transition">
              + Nova Aula
            </Link>
            <Link href="/aulas/students" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition">
              Alunos
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Alunos Ativos', value: stats.totalStudents, icon: '👥' },
            { label: 'Aulas esta Semana', value: stats.classesThisWeek, icon: '📅' },
            { label: 'Avaliação Média', value: stats.avgRating > 0 ? `${stats.avgRating} ⭐` : 'N/A', icon: '⭐' },
            { label: 'Pendências', value: totalPending, icon: totalPending > 0 ? '🔔' : '✅' },
          ].map((s, i) => (
            <div key={i} className={`bg-slate-900 border rounded-xl p-5 ${i === 3 && totalPending > 0 ? 'border-yellow-500/50' : 'border-slate-800'}`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Nova Aula', href: '/aulas/classes/new', icon: '📝' },
            { label: 'Avaliar Aluno', href: '/aulas/students', icon: '📊' },
            { label: 'Disponibilidade', href: '/aulas/coach-availability', icon: '🕐' },
            { label: 'Configurações', href: '/aulas/coach-settings', icon: '⚙️' },
            { label: 'Minhas Aulas', href: '/aulas/classes', icon: '📋' },
          ].map((a, i) => (
            <Link key={i} href={a.href} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition group">
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="font-semibold group-hover:text-cyan-400 transition text-sm">{a.label}</div>
            </Link>
          ))}
        </div>

        {/* Pending Students */}
        {pendingStudents.length > 0 && (
          <div className="bg-slate-900 border border-yellow-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">{pendingStudents.length}</span>
              Alunos Pendentes
            </h2>
            <div className="space-y-3">
              {pendingStudents.map((ps: any) => (
                <div key={ps.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-semibold">{ps.student?.user?.name || 'Aluno'}</div>
                    <div className="text-sm text-slate-400">{ps.student?.user?.email}</div>
                    <div className="text-xs text-slate-500">
                      Solicitado em {new Date(ps.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleStudentAction(ps.id, 'approve')}
                      disabled={actionLoading === ps.id}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50 text-sm font-medium">
                      ✓ Aprovar
                    </button>
                    <button onClick={() => handleStudentAction(ps.id, 'reject')}
                      disabled={actionLoading === ps.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 text-sm font-medium">
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">{pendingBookings.length}</span>
              Reservas Pendentes
            </h2>
            <div className="space-y-3">
              {pendingBookings.map((pb: any) => (
                <div key={pb.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-semibold">{pb.student?.user?.name || 'Aluno'}</div>
                    <div className="text-sm text-slate-400">
                      {pb.class?.title} • {new Date(pb.class?.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {pb.class?.locationName && <div className="text-xs text-slate-500">📍 {pb.class.locationName}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleBookingAction(pb.id, 'approve')}
                      disabled={actionLoading === pb.id}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50 text-sm font-medium">
                      ✓ Aprovar
                    </button>
                    <button onClick={() => handleBookingAction(pb.id, 'reject')}
                      disabled={actionLoading === pb.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 text-sm font-medium">
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Classes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Próximas Aulas</h2>
          {upcomingClasses.length === 0 ? (
            <p className="text-slate-400">Nenhuma aula agendada. <Link href="/aulas/classes/new" className="text-cyan-400 hover:underline">Agende uma agora!</Link></p>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((cls: any) => (
                <Link key={cls.id} href={`/aulas/classes/${cls.id}`} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition">
                  <div>
                    <div className="font-semibold">{cls.title}</div>
                    <div className="text-sm text-slate-400">
                      {new Date(cls.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {cls.locationName && ` • ${cls.locationName}`}
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {cls.attendances?.length || 0} aluno(s)
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
