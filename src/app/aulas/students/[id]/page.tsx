'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/aulas/student/passport/${params.id}`).then(r => r.json()),
      fetch(`/api/aulas/evaluations/student/${params.id}`).then(r => r.json()),
    ]).then(([s, e]) => {
      if (!s.error) setStudent(s);
      if (Array.isArray(e)) setEvaluations(e);
    }).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Aluno não encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1">← Voltar</button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {student.user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.user?.name}</h1>
            <div className="flex gap-2 mt-1">
              {student.currentLevel && <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400">{student.currentLevel}</span>}
              <span className="text-sm text-slate-400">{student.totalClasses} aulas • {student.coaches?.length || 0} coach(es)</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <Link href={`/aulas/evaluate/${params.id}`} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold text-sm">
            Nova Avaliação
          </Link>
          <Link href={`/aulas/passport/${params.id}`} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700">
            Ver Passaporte
          </Link>
        </div>

        {/* Evaluations History */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-4">Histórico de Avaliações</h2>
          {evaluations.length === 0 ? (
            <p className="text-slate-400">Nenhuma avaliação registrada.</p>
          ) : (
            <div className="space-y-4">
              {evaluations.map((ev: any) => (
                <div key={ev.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{ev.overallLevel === 'beginner' ? 'Iniciante' : ev.overallLevel === 'intermediate' ? 'Intermediário' : ev.overallLevel === 'advanced' ? 'Avançado' : 'Pro'}</div>
                    <div className="text-sm text-slate-400">{new Date(ev.evaluatedAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="text-sm text-slate-500 mb-2">Por: {ev.coach?.user?.name}</div>
                  {ev.overallNotes && <p className="text-sm text-slate-300">{ev.overallNotes}</p>}
                  {ev.strengths && <p className="text-sm text-green-400 mt-1">💪 {ev.strengths}</p>}
                  {ev.weaknesses && <p className="text-sm text-orange-400 mt-1">⚠️ {ev.weaknesses}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
