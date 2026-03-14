'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CoachPublicPage() {
  const params = useParams();
  const router = useRouter();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/aulas/discover/${params.id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCoach(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

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
