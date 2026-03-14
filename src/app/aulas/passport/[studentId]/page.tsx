'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const skillLabels: Record<string, string> = {
  // Ataque
  shark: 'Tubarão', pingo: 'Pingo', lobby: 'Lobby',
  paralela: 'Paralela', meioFundo: 'Meio Fundo',
  diagonalCurta: 'Diag. Curta', diagonalLonga: 'Diag. Longa',
  cabeceio: 'Cabeceio', chapa: 'Chapa', peitoDePe: 'Peito de Pé',
  // Levantamento
  chestSet: 'Lev. Peito', headSet: 'Lev. Cabeça', shoulderSet: 'Lev. Ombro', footSet: 'Lev. Pé',
  // Defesa e Recepção
  defesaLobby: 'Def. Lobby', defesaPingo: 'Def. Pingo',
  defesaParalela: 'Def. Paralela', defesaMeioFundo: 'Def. M.Fundo',
  defesaDiagonal: 'Def. Diagonal', recepcao: 'Recepção',
  // Saque e Tático
  saque: 'Saque', posicionamento: 'Posicionamento', bloqueio: 'Bloqueio',
};

function RadarChart({ skills }: { skills: Record<string, number> }) {
  const entries = Object.entries(skills).filter(([, v]) => v != null);
  if (entries.length < 3) return <p className="text-slate-400 text-sm">Dados insuficientes para o gráfico radar</p>;

  const cx = 150, cy = 150, r = 120;
  const n = entries.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i: number, val: number) => {
    const angle = angleStep * i - Math.PI / 2;
    const dist = (val / 5) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-sm mx-auto">
      {/* Grid */}
      {gridLevels.map(level => {
        const pts = entries.map((_, i) => getPoint(i, level));
        return <polygon key={level} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#334155" strokeWidth={0.5} />;
      })}
      {/* Axes */}
      {entries.map((_, i) => {
        const p = getPoint(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#334155" strokeWidth={0.5} />;
      })}
      {/* Data */}
      <polygon
        points={entries.map(([, v], i) => { const p = getPoint(i, v); return `${p.x},${p.y}`; }).join(' ')}
        fill="rgba(34,211,238,0.2)" stroke="#22d3ee" strokeWidth={2}
      />
      {/* Points & Labels */}
      {entries.map(([key, v], i) => {
        const p = getPoint(i, v);
        const labelP = getPoint(i, 5.8);
        return (
          <g key={key}>
            <circle cx={p.x} cy={p.y} r={3} fill="#22d3ee" />
            <text x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[8px]">
              {skillLabels[key] || key}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PassportPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/aulas/student/passport/${params.studentId}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStudent(d); })
      .finally(() => setLoading(false));
  }, [params.studentId]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Passaporte não encontrado</div>;

  const latestEval = student.evaluations?.[0];
  const skills: Record<string, number> = {};
  if (latestEval) {
    Object.keys(skillLabels).forEach(k => { if (latestEval[k] != null) skills[k] = latestEval[k]; });
  }

  const levelLabel = (l: string) => l === 'beginner' ? 'Iniciante' : l === 'intermediate' ? 'Intermediário' : l === 'advanced' ? 'Avançado' : 'Pro';
  const levelColor = (l: string) => l === 'beginner' ? 'from-green-500 to-green-400' : l === 'intermediate' ? 'from-yellow-500 to-yellow-400' : l === 'advanced' ? 'from-orange-500 to-orange-400' : 'from-purple-500 to-purple-400';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1">← Voltar</button>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {student.user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student.user?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {latestEval && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${levelColor(latestEval.overallLevel)} text-white`}>
                    {levelLabel(latestEval.overallLevel)}
                  </span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-sm text-slate-400">
                <span>🏐 {student.classAttendances?.length || 0} aulas</span>
                <span>👨‍🏫 {student.coaches?.length || 0} coach(es)</span>
                {student.dominantFoot && <span>🦶 {student.dominantFoot === 'right' ? 'Destro' : student.dominantFoot === 'left' ? 'Canhoto' : 'Ambos'}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        {Object.keys(skills).length >= 3 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Habilidades</h2>
            <RadarChart skills={skills} />
          </div>
        )}

        {/* Strengths & Weaknesses */}
        {latestEval && (latestEval.strengths || latestEval.weaknesses) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {latestEval.strengths && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                <h3 className="font-semibold text-green-400 mb-2">💪 Pontos Fortes</h3>
                <p className="text-slate-300 text-sm">{latestEval.strengths}</p>
              </div>
            )}
            {latestEval.weaknesses && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
                <h3 className="font-semibold text-orange-400 mb-2">⚠️ A Melhorar</h3>
                <p className="text-slate-300 text-sm">{latestEval.weaknesses}</p>
              </div>
            )}
          </div>
        )}

        {/* Evaluation Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Histórico de Avaliações</h2>
          {student.evaluations?.length === 0 ? (
            <p className="text-slate-400">Nenhuma avaliação registrada.</p>
          ) : (
            <div className="space-y-4">
              {student.evaluations?.map((ev: any) => (
                <div key={ev.id} className="relative pl-6 border-l-2 border-slate-700 pb-4 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-cyan-400" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{levelLabel(ev.overallLevel)}</span>
                    <span className="text-sm text-slate-400">{new Date(ev.evaluatedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="text-sm text-slate-500">Coach: {ev.coach?.user?.name}</div>
                  {ev.overallNotes && <p className="text-sm text-slate-300 mt-1">{ev.overallNotes}</p>}
                  {ev.recommendations && <p className="text-sm text-cyan-400 mt-1">📝 {ev.recommendations}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coach History */}
        {student.coaches?.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-6">
            <h2 className="text-lg font-bold mb-4">Coaches</h2>
            <div className="space-y-3">
              {student.coaches.map((rel: any) => (
                <div key={rel.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="font-medium">{rel.coach?.user?.name}</div>
                  <div className="text-sm text-slate-400">
                    Desde {new Date(rel.startDate).toLocaleDateString('pt-BR')}
                    {rel.status !== 'active' && <span className="ml-2 text-red-400">({rel.status})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
