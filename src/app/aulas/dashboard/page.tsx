'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  stats: { totalStudents: number; classesThisWeek: number; avgRating: number; totalReviews: number };
  upcomingClasses: any[];
  coachId: string;
}

export default function CoachDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/aulas/dashboard')
        .then(r => r.json())
        .then(d => { if (!d.error) setData(d); })
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Crie seu Perfil de Coach</h2>
        <p className="text-slate-400">Você ainda não tem um perfil de coach configurado.</p>
        <Link href="/aulas/coach-setup" className="btn-primary px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition">
          Configurar Perfil
        </Link>
      </div>
    );
  }

  const { stats, upcomingClasses } = data;

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
            { label: 'Total Reviews', value: stats.totalReviews, icon: '💬' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Nova Aula', href: '/aulas/classes/new', icon: '📝' },
            { label: 'Avaliar Aluno', href: '/aulas/students', icon: '📊' },
            { label: 'Pacotes', href: '/aulas/packages', icon: '📦' },
            { label: 'Minhas Aulas', href: '/aulas/classes', icon: '📋' },
          ].map((a, i) => (
            <Link key={i} href={a.href} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition group">
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="font-semibold group-hover:text-cyan-400 transition">{a.label}</div>
            </Link>
          ))}
        </div>

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
