'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadStudents = () => {
    fetch('/api/aulas/coach/students')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setStudents(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (session?.user?.id) loadStudents(); }, [session]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch('/api/aulas/coach/students/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (res.ok) { setInviteEmail(''); setShowInvite(false); loadStudents(); }
      else { const d = await res.json(); alert(d.error || 'Erro ao convidar'); }
    } finally { setInviting(false); }
  };

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced: 'bg-orange-500/20 text-orange-400',
    pro: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Meus Alunos</h1>
          <button onClick={() => setShowInvite(!showInvite)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold text-sm">
            + Convidar Aluno
          </button>
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 flex gap-3">
            <input type="email" required placeholder="Email do aluno" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
            <button type="submit" disabled={inviting} className="px-4 py-2.5 bg-cyan-500 rounded-lg font-semibold text-sm disabled:opacity-50">
              {inviting ? 'Enviando...' : 'Convidar'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">Nenhum aluno cadastrado</p>
            <p>Convide seus alunos usando o email deles</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {students.filter(s => s.status === 'active').map((rel: any) => {
              const student = rel.student;
              const latestEval = student.evaluations?.[0];
              return (
                <Link key={rel.id} href={`/aulas/students/${student.id}`} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-cyan-500/50 transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {student.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-semibold">{student.user?.name}</div>
                      <div className="text-sm text-slate-400">{student.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {latestEval && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${levelColors[latestEval.overallLevel] || 'bg-slate-700 text-slate-300'}`}>
                        {latestEval.overallLevel === 'beginner' ? 'Iniciante' : latestEval.overallLevel === 'intermediate' ? 'Intermediário' : latestEval.overallLevel === 'advanced' ? 'Avançado' : 'Pro'}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">Desde {new Date(rel.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/aulas/evaluate/${student.id}`} onClick={e => e.stopPropagation()} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30">
                      Avaliar
                    </Link>
                    <Link href={`/aulas/passport/${student.id}`} onClick={e => e.stopPropagation()} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30">
                      Passaporte
                    </Link>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
