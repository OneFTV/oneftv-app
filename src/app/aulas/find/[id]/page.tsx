'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado', pro: 'Profissional', all: 'Todos',
};

export default function CoachPublicPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<string>('not_enrolled');
  const [studentLevel, setStudentLevel] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [studentForm, setStudentForm] = useState({
    dominantFoot: 'right', currentLevel: 'beginner', position: 'both',
  });

  // Availability & booking
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookingSlot, setBookingSlot] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState('');

  useEffect(() => {
    fetch(`/api/aulas/discover/${params.id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setCoach(d); })
      .finally(() => setLoading(false));
  }, [params.id]);

  // Check enrollment status
  useEffect(() => {
    if (session?.user && params.id) {
      fetch(`/api/aulas/enrollment-status?coachId=${params.id}`)
        .then(r => r.json())
        .then(d => {
          setEnrollStatus(d.status || 'not_enrolled');
          setStudentLevel(d.studentLevel);
        });
    }
  }, [session, params.id]);

  // Load availability when enrolled
  useEffect(() => {
    if (enrollStatus === 'active' && params.id) {
      const levelParam = studentLevel ? `?level=${studentLevel}` : '';
      fetch(`/api/aulas/availability/${params.id}${levelParam}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setAvailability(d); });
    }
  }, [enrollStatus, params.id, studentLevel]);

  const handleEnroll = async () => {
    if (!session?.user) { router.push(`/login?callbackUrl=${encodeURIComponent(`/aulas/find/${params.id}`)}`); return; }
    setShowForm(true);
  };

  const submitEnroll = async () => {
    setEnrolling(true);
    setEnrollError('');
    try {
      const res = await fetch('/api/aulas/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId: params.id, ...studentForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnrollStatus(data.status || 'pending');
        setStudentLevel(studentForm.currentLevel);
        setShowForm(false);
      } else {
        setEnrollError(data.error || 'Erro ao se inscrever');
      }
    } catch {
      setEnrollError('Erro de conexão');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBook = async () => {
    if (!bookingSlot || !bookingDate) return;
    setBookingLoading(true);
    setBookingMsg('');
    try {
      const res = await fetch('/api/aulas/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId: coach.id, availabilityId: bookingSlot.id, date: bookingDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookingMsg(data.message);
        setBookingSlot(null);
        setBookingDate('');
      } else {
        setBookingMsg(data.error || 'Erro ao agendar');
      }
    } catch {
      setBookingMsg('Erro de conexão');
    } finally {
      setBookingLoading(false);
    }
  };

  // Get next date for a given day of week (local timezone safe)
  const getNextDate = (dayOfWeek: number) => {
    const now = new Date();
    const todayDow = now.getDay();
    const diff = (dayOfWeek - todayDow + 7) % 7 || 7;
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    const yyyy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, '0');
    const dd = String(next.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!coach) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Coach não encontrado</div>;

  // Group availability by day
  const byDay: Record<number, any[]> = {};
  availability.forEach(a => {
    if (!byDay[a.dayOfWeek]) byDay[a.dayOfWeek] = [];
    byDay[a.dayOfWeek].push(a);
  });

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

        {/* Enrollment Status Messages */}
        {enrollStatus === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6 text-center">
            <p className="text-2xl mb-2">⏳</p>
            <p className="text-lg font-bold text-yellow-400">Aguardando aprovação do coach</p>
            <p className="text-slate-300 mt-1">Sua inscrição foi enviada. O coach irá analisá-la em breve.</p>
          </div>
        )}

        {enrollStatus === 'rejected' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6 text-center">
            <p className="text-2xl mb-2">❌</p>
            <p className="text-lg font-bold text-red-400">Inscrição não aprovada</p>
            <p className="text-slate-300 mt-1">Infelizmente o coach não aprovou sua inscrição.</p>
          </div>
        )}

        {enrollStatus === 'active' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-lg font-bold text-green-400">Você é aluno deste coach!</p>
            <p className="text-slate-300 mt-1">Veja os horários disponíveis abaixo para agendar aulas.</p>
          </div>
        )}

        {/* Enroll CTA */}
        {enrollStatus === 'not_enrolled' && !showForm && (
          <button onClick={handleEnroll}
            className="w-full py-4 mb-6 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl text-lg font-bold hover:from-blue-600 hover:to-cyan-500 transition shadow-lg shadow-cyan-500/20">
            🏐 Quero treinar com {coach.user?.name?.split(' ')[0]}!
          </button>
        )}

        {showForm && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-cyan-400">Complete seu perfil de aluno</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Pé dominante</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  value={studentForm.dominantFoot} onChange={e => setStudentForm(f => ({ ...f, dominantFoot: e.target.value }))}>
                  <option value="right">Destro</option>
                  <option value="left">Canhoto</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Seu nível</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  value={studentForm.currentLevel} onChange={e => setStudentForm(f => ({ ...f, currentLevel: e.target.value }))}>
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                  <option value="pro">Profissional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Posição preferida</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  value={studentForm.position} onChange={e => setStudentForm(f => ({ ...f, position: e.target.value }))}>
                  <option value="attacker">Atacante</option>
                  <option value="setter">Levantador</option>
                  <option value="both">Ambos</option>
                </select>
              </div>
              {enrollError && <p className="text-red-400 text-sm">{enrollError}</p>}
              <div className="flex gap-3">
                <button onClick={submitEnroll} disabled={enrolling}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
                  {enrolling ? 'Inscrevendo...' : 'Confirmar Inscrição'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Availability Calendar */}
        {enrollStatus === 'active' && availability.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📅 Horários Disponíveis</h2>
            {bookingMsg && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${bookingMsg.includes('Erro') || bookingMsg.includes('lotado') ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'}`}>
                {bookingMsg}
              </div>
            )}
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const slots = byDay[day];
                if (!slots) return null;
                return (
                  <div key={day}>
                    <h3 className="font-semibold text-slate-300 mb-2">{DAY_NAMES[day]}</h3>
                    <div className="grid gap-2">
                      {slots.map((slot: any) => (
                        <button key={slot.id}
                          onClick={() => { setBookingSlot(slot); setBookingDate(getNextDate(slot.dayOfWeek)); setBookingMsg(''); }}
                          className={`flex items-center justify-between p-3 rounded-lg transition text-left ${
                            bookingSlot?.id === slot.id
                              ? 'bg-cyan-500/20 border border-cyan-500/50'
                              : 'bg-slate-800/50 border border-slate-700 hover:border-cyan-500/30'
                          }`}>
                          <div>
                            <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                            {slot.locationName && <span className="text-slate-400 text-sm ml-2">📍 {slot.locationName}</span>}
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                              {LEVEL_LABELS[slot.level] || slot.level}
                            </span>
                            <span className="text-xs text-slate-500">máx {slot.maxStudents}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Booking Modal */}
            {bookingSlot && (
              <div className="mt-6 p-5 bg-slate-800 border border-cyan-500/30 rounded-xl">
                <h3 className="font-bold text-cyan-400 mb-3">Agendar Aula</h3>
                <p className="text-sm text-slate-300 mb-3">
                  {DAY_NAMES[bookingSlot.dayOfWeek]} • {bookingSlot.startTime} - {bookingSlot.endTime}
                  {bookingSlot.locationName && ` • 📍 ${bookingSlot.locationName}`}
                </p>
                <label className="block text-sm font-medium text-slate-300 mb-1">Selecione a data</label>
                <input type="date" value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 mb-4" />
                <div className="flex gap-3">
                  <button onClick={handleBook} disabled={bookingLoading || !bookingDate}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition disabled:opacity-50">
                    {bookingLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                  </button>
                  <button onClick={() => { setBookingSlot(null); setBookingDate(''); }}
                    className="px-4 py-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {enrollStatus === 'active' && availability.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 text-center text-slate-400">
            <p>O coach ainda não definiu horários disponíveis.</p>
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
