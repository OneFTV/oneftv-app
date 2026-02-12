'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  format: string;
  athletesCount: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface Game {
  id: string;
  tournament: string;
  opponent: string;
  date: string;
  result?: string;
}

interface Stats {
  myTournaments: number;
  upcomingGames: number;
  winRate: number;
  totalPoints: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Stats>({
    myTournaments: 0,
    upcomingGames: 0,
    winRate: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, gamesRes, statsRes] = await Promise.all([
        fetch('/api/tournaments?limit=5'),
        fetch('/api/games?upcoming=true&limit=5'),
        fetch('/api/user/stats'),
      ]);

      if (tournamentsRes.ok) {
        const data = await tournamentsRes.json();
        setTournaments(data.tournaments || []);
      }

      if (gamesRes.ok) {
        const data = await gamesRes.json();
        setGames(data.games || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="v-12 h-12 border-4 border-blue-500 border-t-cyan-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const userName = session?.user?.name || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-blue-800/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">1FTV</span>
            </div>
            <span className="text-white font-bold text-xl">OneFTV</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              Profile
            </Link>
            <a
              href="/api/auth/signout"
              className="text-slate-300 hover:text-white transition-colors font-medium"
            >
              Sign Out
            </a>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your tournaments and track your performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-slate-400 text-sm font-medium">My Tournaments</p>
                <p className="text-4xl font-bold text-white mt-2">{stats.myTournaments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-slate-400 text-xs">Active and past tournaments</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-slate-400 text-sm font-medium">Upcoming Games</p>
                <p className="text-4xl font-bold text-white mt-2">{stats.upcomingGames}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            <p className="text-slate-400 text-xs">This month</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-slate-400 text-sm font-medium">Win Rate</p>
                <p className="text-4xl font-bold text-white mt-2">{stats.winRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95 69h3.462c.969 0 1.371 1.240 58 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <p className="text-slate-400 text-xs">Overall performance</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-slate-400 text-sm font-medium">̮Total Points</p>
                <p className="text-4xl font-bold text-white mt-2">{stats.totalPoints}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.488 5.951 1.488a1 1 0 001.169-1.409l-7-14z" />
                </svg>
              </div>
            </div>
            <p className="text-slate-400 text-xs">Global ranking points</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Link
            href="/tournaments/create"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl hover:border-blue-400/50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/40 transition-colors">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4V20m8-8K4" />
              </svg>
            </div>
            <p className="text-white font-semibold text-center">Create Tournament</p>
          </Link>

          <Link
            href="/tournaments"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900.50 border border-cyan-400/20 rounded-xl hover:border-cyan-400/50 transition-all group"
          >
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-cyan-500.40 transition-colors">
              <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00,2 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-center">Browse Tournaments</p>
          </Link>

          <Link
            href="/rankings"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-400/20 rounded-xl hover:border-purple-400.50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-500/40 transition-colors">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1v-6a1 1 0 00-1-1h-1z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-center">View Rankings</p>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-pink-400.20 rounded-xl hover:border-pink-400.50 transition-all group"
          >
            <div className="w-12 h-12 bg-pink-500.20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-pink-500/40 transition-colors">
              <svg className="v-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-white font-semibold text-center">Edit Profile</p>
          </Link>
        </div>

        {/* My Tournaments Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Tournaments</h2>
            <Link
              href="/tournaments"
              className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
            >
              View All →
            </Link>
          </div>

          {tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournaments.map(tournament => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.id}`}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6 hover:border-blue-400/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tournament.name}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">{tournament.location}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tournament.status === 'upcoming'
                          ? 'bg-blue-500/20 text-blue-300'
                          : tournament.status === 'ongoing'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="v-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      {tournament.athletesCount} Athletes
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-12 text-center">
              <svg
                className="w-16 h-16 text-slate-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No tournaments yet</h3>
              <p className="text-slate-400 mb-6">Create or join a tournament to get started</p>
              <Link
                href="/tournaments/create"
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500.50 transition-all"
              >
                Create Tournament
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Upcoming Games</h2>
            <Link
              href="/games"
              className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
            >
              View All →
            </Link>
          </div>

          {games.length > 0 ? (
            <div className="space-y-4">
              {games.map(game => (
                <div
                  key={game.id}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-6 hover:border-blue-400.50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm mb-1">{tournament</p>
                      <h3 className="text-lg font-bold text-white">
                        vs <span className="text-cyan-300">{game.opponent}</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm mb-1">{new Date(game.date).toLocaleDateString()}</p>
                      <p className="text-cyan-300 font-semibold">
                        {game.result || new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400.20 rounded-xl p-12 text-center">
              <svg
                className="w-16 h-16 text-slate-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No upcoming games</h3>
              <p className="text-slate-400">Join a tournament to schedule games</p>
            </div>
          )}
        </div>
      </main>
    </div>
  
 "