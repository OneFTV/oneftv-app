'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CoachPublicPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [studentForm, setStudentForm] = useState({
    dominantFoot: 'right',
    currentLevel: 'beginner',
    position: 'both',
  });

  useEffect(() => {
    fetch(`/api/aulas/discover/${params.id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCoach(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    setShowForm(true);
  };

  const submitEnroll = async () => {
    setEnrolling(true);
    setEnrollError('');
    try {
      const res = await fetch('/api/aulas/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId: params.id,
          ...studentForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnrolled(true);
        setShowForm(false);
      } else {
        setEnrollError(data.error || 'Erro ao se inscrever');
      }
    } catch {
      setEnrollError('Erro de conexão');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!coach) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Coach não encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1">← Voltar</button>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {coach.user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{coach.user?.name}</h1>
              <div className="text-slate-400">
                {[coach.locationName, coach.city, coach.country].filter(Boolean).join(' • ')}
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                {coach.avgRating > 0 && <span className="text-yellow-400">⭐ {coach.avgRating} ({coach._count?.reviews} reviews)</span>}
                <span className="text-slate-400">👥 {coach._count?.students} alunos</span>
                <span className="text-slate-400">📚 {coach._count?.classes} aulas</span>
              </div>
            </div>
          </div>
        </div>

        {coach.hourlyRate && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-5 mb-6 flex items-center justify-between">
            <span className="text-lg font-semibold">Valor por hora</span>
            <span className="text-2xl font-bold text-cyan-400">{coach.currency} {parseFloat(coach.hourlyRate).toFixed(2)}</span>
          </div>
        )}

        {coach.bio && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="font-semibold mb-2">Sobre</h2>
            <p className="text-slate-300 whitespace-pre-line">{coach.bio}</p>
          </div>
        )}

        {coach.experience && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="font-semibold mb-2">Experiência</h2>
            <p className="text-slate-300">{coach.experience}</p>
          </div>
        )}

        {/* Enroll CTA */}
        {!enrolled && !showForm && (
          <button onClick={handleEnroll}
            className="w-full py-4 mb-6 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl text-lg font-bold hover:from-blue-600 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/20">
            🏐 Quero treinar com {coach.user?.name?.split(' ')[0]}!
          </button>
        )}

        {showForm && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-cyan-400">Complete seu perfil de aluno</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Pé dominante</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  value={studentForm.dominantFoot} onChange={e => setStudentForm(f => ({ ...f, dominantFoot: e.target.value }))}>
                  <option value="right">Destro</option>
                  <option value="left">Canhoto</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Seu nível</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  value={studentForm.currentLevel} onChange={e => setStudentForm(f => ({ ...f, currentLevel: e.target.value }))}>
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                  <option value="pro">Profissional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Posição preferida</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  value={studentForm.position} onChange={e => setStudentForm(f => ({ ...f, position: e.target.value }))}>
                  <option value="attacker">Atacante</option>
                  <option value="setter">Levantador</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              {enrollError && <p className="text-red-400 text-sm">{enrollError}</p>}
              <div className="flex gap-3">
                <button onClick={submitEnroll} disabled={enrolling}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
                  {enrolling ? 'Inscrevendo...' : 'Confirmar Inscrição'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {enrolled && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-lg font-bold text-green-400">Inscrição confirmada!</p>
            <p className="text-slate-300 mt-1">Você agora é aluno de {coach.user?.name}. Confira as aulas disponíveis.</p>
            <button onClick={() => router.push('/aulas/my-classes')}
              className="mt-4 px-6 py-2 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition">
              Ver minhas aulas →
            </button>
          </div>
        )}

        {/* Packages */}
        {coach.packages?.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="font-semibold mb-4">Pacotes</h2>
            <div className="grid gap-3">
              {coach.packages.map((pkg: any) => (
                <div key={pkg.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium">{pkg.name}</div>
                    {pkg.description && <div className="text-sm text-slate-400">{pkg.description}</div>}
                    {pkg.classCount && <div className="text-xs text-slate-500">{pkg.classCount} aulas</div>}
                  </div>
                  <div className="text-lg font-bold text-cyan-400">{pkg.currency} {parseFloat(pkg.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {coach.reviews?.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-4">Avaliações</h2>
            <div className="space-y-4">
              {coach.reviews.map((review: any) => (
                <div key={review.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.student?.user?.name}</span>
                    <span className="text-yellow-400">{'⭐'.repeat(review.rating)}</span>
                  </div>
                  {review.comment && <p className="text-sm text-slate-300">{review.comment}</p>}
                  <div className="text-xs text-slate-500 mt-1">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
