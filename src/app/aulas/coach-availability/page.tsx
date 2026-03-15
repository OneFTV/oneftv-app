'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const LEVEL_OPTIONS = [
  { value: 'all', label: 'Todos os níveis' },
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
  { value: 'pro', label: 'Profissional' },
];

export default function CoachAvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '08:00', endTime: '09:00', level: 'all', maxStudents: 4, locationName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadSlots = () => {
    fetch('/api/aulas/coach/availability')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSlots(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session?.user?.id) loadSlots();
  }, [session]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/aulas/coach/availability/${editingId}` : '/api/aulas/coach/availability';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxStudents: Number(form.maxStudents), dayOfWeek: Number(form.dayOfWeek) }),
      });
      if (res.ok) {
        loadSlots();
        resetForm();
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este horário?')) return;
    await fetch(`/api/aulas/coach/availability/${id}`, { method: 'DELETE' });
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleEdit = (slot: any) => {
    setForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      level: slot.level,
      maxStudents: slot.maxStudents,
      locationName: slot.locationName || '',
    });
    setEditingId(slot.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ dayOfWeek: 1, startTime: '08:00', endTime: '09:00', level: 'all', maxStudents: 4, locationName: '' });
    setEditingId(null);
    setShowForm(false);
  };

  // Group slots by day
  const slotsByDay: Record<number, any[]> = {};
  slots.forEach(s => {
    if (!slotsByDay[s.dayOfWeek]) slotsByDay[s.dayOfWeek] = [];
    slotsByDay[s.dayOfWeek].push(s);
  });

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">📅 Disponibilidade</h1>
            <p className="text-slate-400 mt-1">Configure seus horários semanais de aula</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold text-sm">
              + Novo Horário
            </button>
            <Link href="/aulas/dashboard" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700">← Dashboard</Link>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-cyan-400">{editingId ? 'Editar Horário' : 'Novo Horário'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Dia da semana</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                  {DAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nível</label>
                <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                  {LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Início</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fim</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Máx. alunos</label>
                <input type="number" min="1" value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: Number(e.target.value) }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Local</label>
                <input type="text" value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
                  placeholder="Ex: Praia de Copacabana"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar Horário'}
              </button>
              <button onClick={resetForm} className="px-6 py-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700">Cancelar</button>
            </div>
          </div>
        )}

        {/* Weekly Grid */}
        {slots.length === 0 && !showForm ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">Nenhum horário configurado</p>
            <p>Clique em &quot;Novo Horário&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 0].map(day => {
              const daySlots = slotsByDay[day];
              if (!daySlots?.length) return null;
              return (
                <div key={day} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="font-semibold mb-3 text-lg">{DAY_NAMES[day]}</h3>
                  <div className="space-y-2">
                    {daySlots.map((slot: any) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="text-cyan-400 font-mono font-semibold">{slot.startTime} - {slot.endTime}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                            {LEVEL_OPTIONS.find(o => o.value === slot.level)?.label || slot.level}
                          </span>
                          <span className="text-sm text-slate-400">👥 máx {slot.maxStudents}</span>
                          {slot.locationName && <span className="text-sm text-slate-500">📍 {slot.locationName}</span>}
                          {!slot.isActive && <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">Inativo</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(slot)} className="text-sm text-slate-400 hover:text-white">✏️</button>
                          <button onClick={() => handleDelete(slot.id)} className="text-sm text-slate-400 hover:text-red-400">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
