'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClassDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [cls, setCls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/aulas/classes/${params.id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCls(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const updateAttendance = async (studentId: string, status: string) => {
    setSaving(true);
    try {
      await fetch(`/api/aulas/classes/${params.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendances: [{ studentId, status }] }),
      });
      // Refresh
      const r = await fetch(`/api/aulas/classes/${params.id}`);
      const d = await r.json();
      if (!d.error) setCls(d);
    } finally { setSaving(false); }
  };

  const completeClass = async () => {
    await fetch(`/api/aulas/classes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const r = await fetch(`/api/aulas/classes/${params.id}`);
    const d = await r.json();
    if (!d.error) setCls(d);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!cls) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Aula não encontrada</div>;

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const attendanceColors: Record<string, string> = {
    registered: 'bg-slate-700 text-slate-300',
    attended: 'bg-green-500/20 text-green-400',
    no_show: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1">← Voltar</button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{cls.title}</h1>
            <p className="text-slate-400 mt-1">
              {new Date(cls.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[cls.status] || ''}`}>
            {cls.status === 'scheduled' ? 'Agendada' : cls.status === 'completed' ? 'Concluída' : 'Cancelada'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Tipo</div>
            <div className="font-semibold">{cls.type === 'individual' ? 'Individual' : cls.type === 'group' ? 'Grupo' : 'Clínica'}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Duração</div>
            <div className="font-semibold">{cls.duration} min</div>
          </div>
          {cls.locationName && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Local</div>
              <div className="font-semibold">{cls.locationName}</div>
            </div>
          )}
          {cls.price && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Preço</div>
              <div className="font-semibold">{cls.currency} {parseFloat(cls.price).toFixed(2)}</div>
            </div>
          )}
        </div>

        {cls.description && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-slate-300">{cls.description}</p>
          </div>
        )}

        {/* Attendance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Presença ({cls.attendances?.length || 0} alunos)</h3>
          {cls.attendances?.length === 0 ? (
            <p className="text-slate-400">Nenhum aluno registrado nesta aula.</p>
          ) : (
            <div className="space-y-3">
              {cls.attendances?.map((att: any) => (
                <div key={att.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {att.student?.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-medium">{att.student?.user?.name || 'Aluno'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${attendanceColors[att.status] || ''}`}>
                      {att.status === 'registered' ? 'Registrado' : att.status === 'attended' ? 'Presente' : att.status === 'no_show' ? 'Faltou' : 'Cancelou'}
                    </span>
                    {cls.status === 'scheduled' && (
                      <div className="flex gap-1">
                        <button onClick={() => updateAttendance(att.studentId, 'attended')} disabled={saving} className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">✓</button>
                        <button onClick={() => updateAttendance(att.studentId, 'no_show')} disabled={saving} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">✗</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cls.status === 'scheduled' && (
          <div className="flex gap-3">
            <button onClick={completeClass} className="px-6 py-3 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition">
              Concluir Aula
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
