'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CoachSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/aulas/coach/settings')
        .then(r => r.json())
        .then(d => { if (!d.error) setSettings(d); })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/aulas/coach/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoApproveEnrollment: settings.autoApproveEnrollment,
          autoApproveBooking: settings.autoApproveBooking,
          cancellationPolicyHours: Number(settings.cancellationPolicyHours),
          noShowPolicy: settings.noShowPolicy || null,
          requirePaymentUpfront: settings.requirePaymentUpfront,
          autoAdjustLevel: settings.autoAdjustLevel,
          notifyByEmail: settings.notifyByEmail,
          notifyInApp: settings.notifyInApp,
        }),
      });
      if (res.ok) setMsg('Configurações salvas!');
      else setMsg('Erro ao salvar');
    } catch { setMsg('Erro de conexão'); }
    finally { setSaving(false); }
  };

  const Toggle = ({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-sm text-slate-400">{description}</div>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!settings) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Perfil de coach não encontrado</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">⚙️ Configurações</h1>
            <p className="text-slate-400 mt-1">Personalize o comportamento das suas aulas</p>
          </div>
          <Link href="/aulas/dashboard" className="text-slate-400 hover:text-white">← Dashboard</Link>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-cyan-400">Aprovações</h2>
            <div className="space-y-3">
              <Toggle label="Aprovar alunos automaticamente" description="Novos alunos são aceitos sem revisão manual"
                checked={settings.autoApproveEnrollment} onChange={v => setSettings((s: any) => ({ ...s, autoApproveEnrollment: v }))} />
              <Toggle label="Aprovar reservas automaticamente" description="Reservas de aula são confirmadas sem revisão"
                checked={settings.autoApproveBooking} onChange={v => setSettings((s: any) => ({ ...s, autoApproveBooking: v }))} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-cyan-400">Políticas</h2>
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <label className="block font-medium mb-2">Horas mínimas para cancelamento</label>
                <input type="number" min="0" value={settings.cancellationPolicyHours}
                  onChange={e => setSettings((s: any) => ({ ...s, cancellationPolicyHours: e.target.value }))}
                  className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500" />
                <p className="text-sm text-slate-400 mt-1">Alunos devem cancelar com esta antecedência mínima</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <label className="block font-medium mb-2">Política de no-show</label>
                <textarea value={settings.noShowPolicy || ''}
                  onChange={e => setSettings((s: any) => ({ ...s, noShowPolicy: e.target.value }))}
                  placeholder="Descreva sua política para faltas sem aviso..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 resize-none" />
              </div>
              <Toggle label="Exigir pagamento antecipado" description="Alunos devem pagar antes de confirmar a reserva"
                checked={settings.requirePaymentUpfront} onChange={v => setSettings((s: any) => ({ ...s, requirePaymentUpfront: v }))} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-4 text-cyan-400">Outros</h2>
            <div className="space-y-3">
              <Toggle label="Ajuste automático de nível" description="Atualizar nível do aluno baseado nas avaliações"
                checked={settings.autoAdjustLevel} onChange={v => setSettings((s: any) => ({ ...s, autoAdjustLevel: v }))} />
              <Toggle label="Notificações por email" checked={settings.notifyByEmail}
                onChange={v => setSettings((s: any) => ({ ...s, notifyByEmail: v }))} />
              <Toggle label="Notificações no app" checked={settings.notifyInApp}
                onChange={v => setSettings((s: any) => ({ ...s, notifyInApp: v }))} />
            </div>
          </div>

          {msg && <p className={`text-sm ${msg.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}
