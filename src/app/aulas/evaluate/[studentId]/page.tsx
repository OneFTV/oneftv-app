'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

const skillGroups = [
  {
    name: 'Ataque (Offense)',
    skills: [
      { key: 'shark', label: 'Tubarão (Shark) — sola do pé por cima da rede' },
      { key: 'pingo', label: 'Pingo — ataque curto que cai logo após a rede' },
      { key: 'lobby', label: 'Lobby (Lob) — ataque alto ao fundo da quadra' },
      { key: 'paralela', label: 'Paralela — ataque reto na linha lateral' },
      { key: 'meioFundo', label: 'Meio Fundo — ataque ao centro da quadra' },
      { key: 'diagonalCurta', label: 'Diagonal Curta — cruzado curto' },
      { key: 'diagonalLonga', label: 'Diagonal Longa — cruzado longo' },
      { key: 'cabeceio', label: 'Cabeceio — finalização com a cabeça' },
      { key: 'chapa', label: 'Chapa — precisão com parte interna do pé' },
      { key: 'peitoDePe', label: 'Peito de Pé — potência com dorso do pé' },
    ],
  },
  {
    name: 'Levantamento (Setting)',
    skills: [
      { key: 'chestSet', label: 'Levantada de Peito (Chest Set)' },
      { key: 'headSet', label: 'Levantada de Cabeça (Head Set)' },
      { key: 'shoulderSet', label: 'Levantada de Ombro (Shoulder Set)' },
      { key: 'footSet', label: 'Levantada de Pé (Foot Set)' },
    ],
  },
  {
    name: 'Defesa e Recepção (Defense & Reception)',
    skills: [
      { key: 'defesaLobby', label: 'Defesa de Lobby — bolas altas no fundo' },
      { key: 'defesaPingo', label: 'Defesa de Pingo — bolas curtas na rede' },
      { key: 'defesaParalela', label: 'Defesa Paralela — ataque reto na linha' },
      { key: 'defesaMeioFundo', label: 'Defesa Meio Fundo — zona central' },
      { key: 'defesaDiagonal', label: 'Defesa Diagonal — ataques cruzados' },
      { key: 'recepcao', label: 'Recepção — controle de saque/ataque' },
    ],
  },
  {
    name: 'Saque e Tático',
    skills: [
      { key: 'saque', label: 'Saque (Serve) — qualidade e variedade' },
      { key: 'posicionamento', label: 'Posicionamento e Leitura de Jogo' },
      { key: 'bloqueio', label: 'Bloqueio — na rede, geralmente via shark' },
    ],
  },
];

export default function EvaluatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    overallLevel: 'beginner',
    overallNotes: '',
    strengths: '',
    weaknesses: '',
    recommendations: '',
  });

  const setSkill = (key: string, val: number) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/aulas/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, studentId: params.studentId }),
      });
      if (res.ok) router.push(`/aulas/students/${params.studentId}`);
      else alert('Erro ao salvar avaliação');
    } finally { setSaving(false); }
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1">← Voltar</button>
        <h1 className="text-3xl font-bold mb-8">Avaliar Aluno</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Level */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nível Geral *</label>
            <select className={inputCls} value={form.overallLevel} onChange={e => setForm(f => ({ ...f, overallLevel: e.target.value }))}>
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
              <option value="pro">Profissional</option>
            </select>
          </div>

          {/* Skill Groups */}
          {skillGroups.map(group => (
            <div key={group.name}>
              <h3 className="text-lg font-bold mb-4 text-cyan-400">{group.name}</h3>
              <div className="space-y-4">
                {group.skills.map(skill => (
                  <div key={skill.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-300">{skill.label}</label>
                      <span className="text-sm font-bold text-cyan-400">{form[skill.key] || '-'}</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => setSkill(skill.key, v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${form[skill.key] === v ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Text fields */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Observações Gerais</label>
            <textarea className={inputCls} rows={3} value={form.overallNotes} onChange={e => setForm(f => ({ ...f, overallNotes: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pontos Fortes 💪</label>
            <textarea className={inputCls} rows={2} value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Pontos a Melhorar ⚠️</label>
            <textarea className={inputCls} rows={2} value={form.weaknesses} onChange={e => setForm(f => ({ ...f, weaknesses: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Recomendações 📝</label>
            <textarea className={inputCls} rows={2} value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar Avaliação'}
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
