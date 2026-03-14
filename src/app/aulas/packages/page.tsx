'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PackagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'fixed_count', classCount: 10, price: '', currency: 'USD', validDays: 90 });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const load = () => {
    fetch('/api/aulas/packages').then(r => r.json()).then(d => { if (Array.isArray(d)) setPackages(d); }).finally(() => setLoading(false));
  };

  useEffect(() => { if (session?.user?.id) load(); }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/aulas/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), classCount: form.type === 'fixed_count' ? form.classCount : undefined }),
      });
      if (res.ok) { setShowForm(false); setForm({ name: '', description: '', type: 'fixed_count', classCount: 10, price: '', currency: 'USD', validDays: 90 }); load(); }
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pacotes</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold text-sm">
            + Novo Pacote
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nome *</label>
              <input className={inputCls} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pacote 10 Aulas" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
              <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="fixed_count">Quantidade Fixa</option>
                  <option value="monthly">Mensal</option>
                  <option value="unlimited">Ilimitado</option>
                </select>
              </div>
              {form.type === 'fixed_count' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nº de Aulas</label>
                  <input type="number" className={inputCls} min={1} value={form.classCount} onChange={e => setForm(f => ({ ...f, classCount: parseInt(e.target.value) }))} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Preço *</label>
                <input type="number" step="0.01" className={inputCls} required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Moeda</label>
                <select className={inputCls} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="USD">USD</option>
                  <option value="BRL">BRL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Validade (dias)</label>
                <input type="number" className={inputCls} value={form.validDays} onChange={e => setForm(f => ({ ...f, validDays: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-cyan-500 rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : 'Criar Pacote'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-slate-800 border border-slate-700 rounded-lg">Cancelar</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>Nenhum pacote criado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg: any) => (
              <div key={pkg.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{pkg.name}</div>
                    {pkg.description && <p className="text-sm text-slate-400 mt-1">{pkg.description}</p>}
                    <div className="flex gap-3 mt-2 text-sm text-slate-500">
                      <span>{pkg.type === 'fixed_count' ? `${pkg.classCount} aulas` : pkg.type === 'monthly' ? 'Mensal' : 'Ilimitado'}</span>
                      {pkg.validDays && <span>Validade: {pkg.validDays} dias</span>}
                      <span>{pkg._count?.purchases || 0} compra(s)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-cyan-400">{pkg.currency} {parseFloat(pkg.price).toFixed(2)}</div>
                    <span className={`text-xs ${pkg.isActive ? 'text-green-400' : 'text-red-400'}`}>{pkg.isActive ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
