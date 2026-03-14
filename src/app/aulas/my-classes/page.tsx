'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/aulas/classes/upcoming')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setClasses(d); })
        .finally(() => setLoading(false));
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Minhas Aulas</h1>
          <Link href="/aulas/find" className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700">
            Encontrar Coach
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg mb-2">Nenhuma aula agendada</p>
            <Link href="/aulas/find" className="text-cyan-400 hover:underline">Encontre um coach para começar!</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((att: any) => (
              <div key={att.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{att.class?.title}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      👨‍🏫 {att.class?.coach?.user?.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      {new Date(att.class?.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {att.class?.locationName && <div className="text-sm text-slate-500 mt-1">📍 {att.class.locationName}</div>}
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                    {att.class?.duration}min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
