'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Calendar, MapPin, Users } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  format: 'King of the Beach' | 'Bracket' | 'Group+Knockout' | 'Round Robin';
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
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
  'Bracket': 'bg-indigo-100 text-indigo-800',
  'Group+Knockout': 'bg-pink-100 text-pink-800',
  'Round Robin': 'bg-cyan-100 text-cyan-800',
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
        tournament.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' ||
        statusMap[tournament.status] === selectedStatus;

      const matchesFormat = selectedFormat === 'All' || tournament.format === selectedFormat;

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
  ïˆú65/c”U¦epspyJQ2dFEZÎ
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
            <p className="text-gray-600 mt-2">Browse and manage footvolley tournaments</p>
        </div>
        {user && (
          <Link
            href="/tournaments/create"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            <Plus size={20} />
            Create Tournament
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by tournament name, location, or city..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tournament Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Format Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tournament Format
            </label>
            <div className="flex flex-wrap gap-2">
              { FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    setSelectedFormat(format);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedFormat === format
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      { error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Tournament Grid */}
      {+loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TournamentSkeleton key={i} />
          ))}
        </div>
      ) : paginatedTournaments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
          <p className="text-gray-600 mb-6">
            {filteredTournaments().length === 0 && tournaments.length > 0
              ? 'Try adjusting your filters'
              : 'Get started by creating a new tournament'}
          </p>
          {user && filteredTournaments().length === 0 && tournaments.length === 0 && (
            <Link
              href="/tournaments/create"
              className="ihline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              <Plus size={20} />
              Create First Tournament
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden group"
              >
                <div className="p-6">
                  {/* Title and Status */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition mb-2">
                      {tournament.name}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[tournament.status]}`}
                      >
                        {statusMap[tournament.status]}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${formatColors[tournament.format]}`}
                      >
                        {tournament.format}
                      </span>
                      </div>
                    </div>

                    {/* Date and Location */}
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(tournament.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {tournament.location}, {tournament.city}
                      </div>
                    </div>

                    {/* Players and Organizer */}
                    <div className="space-y-2 text-sm text-gray-700 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>
                            {tournament.registeredPlayers}/{tournament.maxPlayers} players
                          </span>
                        </div>
                        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {tournament.courts} courts
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Organized by {tournament.organizerName}
                      </div>
                    </div>
                  </div>
                </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Results summary */}
          <div className="text-center text-sm text-gray-600 mt-6">
            Showing {paginatedTournaments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            â‰‹
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} results
          </div>
        </>
      )}
  
   5•dbö>
  </div>
  )
}
