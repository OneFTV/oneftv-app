'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Calendar, MapPin, Users } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  location: string;
  city: string | null;
  state: string | null;
  country: string | null;
  startDate: string;
  endDate: string | null;
  format: string;
  status: string;
  maxPlayers: number;
  registeredPlayers: number;
  organizerId: string;
  organizerName: string;
  courts: number;
}

const FORMATS = ['All', 'King of the Beach', 'Bracket', 'Group+Knockout', 'Round Robin'] as const;
const STATUSES = ['All', 'Registration Open', 'In Progress', 'Completed'] as const;

const statusMap: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  registration: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
};

const formatColors: Record<string, string> = {
  'King of the Beach': 'bg-yellow-100 text-yellow-800',
  'king_of_the_beach': 'bg-yellow-100 text-yellow-800',
  'Bracket': 'bg-indigo-100 text-indigo-800',
  'bracket': 'bg-indigo-100 text-indigo-800',
  'Group+Knockout': 'bg-pink-100 text-pink-800',
  'group_knockout': 'bg-pink-100 text-pink-800',
  'Round Robin': 'bg-cyan-100 text-cyan-800',
  'round_robin': 'bg-cyan-100 text-cyan-800',
};

const formatLabels: Record<string, string> = {
  'king_of_the_beach': 'King of the Beach',
  'bracket': 'Bracket',
  'group_knockout': 'Group+Knockout',
  'round_robin': 'Round Robin',
};

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const itemsPerPage = 12;

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/tournaments');
        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }
        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const filteredTournaments = useCallback(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch =
        searchTerm === '' ||
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tournament.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tournament.city || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' ||
        statusMap[tournament.status] === selectedStatus;

      const matchesFormat = selectedFormat === 'All' ||
        tournament.format === selectedFormat ||
        (formatLabels[tournament.format] || tournament.format) === selectedFormat;

      return matchesSearch && matchesStatus && matchesFormat;
    });
  }, [tournaments, searchTerm, selectedStatus, selectedFormat]);

  const filtered = filteredTournaments();
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTournaments = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TournamentSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <TournamentSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Tournaments</h1>
          <Link
            href="/tournaments/create"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Plus size={20} /> Create Tournament
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={selectedFormat}
            onChange={(e) => { setSelectedFormat(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-400"
          >
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:outline-none focus:border-blue-400"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {paginatedTournaments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No tournaments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6 hover:border-blue-400/50 transition-all"
              >
                <h3 className="text-xl font-bold text-white mb-2">{tournament.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <MapPin size={14} /> {tournament.city || 'Unknown'}{tournament.country ? `, ${tournament.country}` : ''}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Calendar size={14} /> {new Date(tournament.startDate).toLocaleDateString()}
                </div>
                <div className="flex gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${formatColors[tournament.format] || 'bg-gray-100 text-gray-800'}`}>
                    {formatLabels[tournament.format] || tournament.format}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[tournament.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusMap[tournament.status] || tournament.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Users size={14} /> {tournament.registeredPlayers}/{tournament.maxPlayers} players
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
