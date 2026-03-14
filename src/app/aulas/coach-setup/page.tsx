'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function CoachSetupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: '', experience: '', hourlyRate: '', currency: 'USD',
    city: '', state: '', country: '', locationName: '', maxGroupSize: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/aulas/coach/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined }),
      });
      if (res.ok) router.push('/aulas/dashboard');
      else alert('Erro ao criar perfil');
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Configurar Perfil de Coach</h1>
        <p className="text-slate-400 mb-8">Preencha suas informações para começar a gerenciar aulas</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Bio</label>
            <textarea className={inputCls} rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre sua experiência com futevôlei..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Experiência</label>
            <textarea className={inputCls} rows={2} value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} placeholder="Anos de experiência, competições, etc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Valor por Hora</label>
              <input type="number" step="0.01" className={inputCls} value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="50.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Moeda</label>
              <select className={inputCls} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Local das Aulas</label>
            <input className={inputCls} value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))} placeholder="Ex: Praia de Copacabana, Quadra 3" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cidade</label>
              <input className={inputCls} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
              <input className={inputCls} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">País</label>
              <input className={inputCls} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tamanho Máximo do Grupo</label>
            <input type="number" className={inputCls} min={1} value={form.maxGroupSize} onChange={e => setForm(f => ({ ...f, maxGroupSize: parseInt(e.target.value) }))} />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Perfil de Coach'}
          </button>
        </form>
      </div>
    </div>
  );
}
