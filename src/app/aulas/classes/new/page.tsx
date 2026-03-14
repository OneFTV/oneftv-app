'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function NewClassPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'individual', maxStudents: 1,
    scheduledAt: '', duration: 60, locationName: '', price: '',
    currency: 'USD', studentIds: [] as string[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/aulas/coach/students').then(r => r.json()).then(d => { if (Array.isArray(d)) setStudents(d); });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/aulas/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: form.price ? parseFloat(form.price) : undefined }),
      });
      if (res.ok) router.push('/aulas/classes');
      else alert('Erro ao criar aula');
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Nova Aula</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Aula de Ataque" />
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da aula..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="individual">Individual</option>
                <option value="group">Grupo</option>
                <option value="clinic">Clínica</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Max Alunos</label>
              <input type="number" className={inputCls} min={1} value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data/Hora *</label>
              <input type="datetime-local" className={inputCls} required value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Duração (min)</label>
              <input type="number" className={inputCls} min={15} step={15} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Local</label>
            <input className={inputCls} value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} placeholder="Ex: Praia de Copacabana, Quadra 3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Preço</label>
              <input type="number" step="0.01" className={inputCls} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Moeda</label>
              <select className={inputCls} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>

          {students.length > 0 && (
            <div>
              <label className={labelCls}>Alunos</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map((s: any) => (
                  <label key={s.student.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800">
                    <input type="checkbox" className="rounded bg-slate-700 border-slate-600"
                      checked={form.studentIds.includes(s.student.id)}
                      onChange={e => {
                        setForm(f => ({
                          ...f,
                          studentIds: e.target.checked
                            ? [...f.studentIds, s.student.id]
                            : f.studentIds.filter(id => id !== s.student.id)
                        }));
                      }}
                    />
                    <span>{s.student.user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar Aula'}
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
