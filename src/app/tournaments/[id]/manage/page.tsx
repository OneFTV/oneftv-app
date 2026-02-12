'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader, AlertCircle, CheckCircle, ArrowLeft, Save } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: 'draft' | 'registration' | 'in_progress' | 'completed';
  startDate: string;
  endDate: string;
  organizerId: string;
}

interface Game {
  id: string;
  roundName: string;
  court: number;
  scheduledTime: string;
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  status: 'pending' | 'completed' | 'in_progress';
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['registration', 'in_progress'],
  registration: ['in_progress', 'completed'],
  in_progress: ['completed'],
  completed: [],
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  registration: 'Registration Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function ManageTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [generating, setGenerating]} = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [gameScores, setGameScores] = useState<Record<string, { score1: number; score2: number }>>({});

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
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tournamentRes, gamesRes] = await Promise.all([
          fetch(`/api/tournaments/${tournamentId}`),
          fetch(`/api/tournaments/${tournamentId}/games`),
        ]);

        if (!tournamentRes.ok) {
          throw new Error('Failed to fetch tournament');
        }

        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);

        // Check authorization
        if (user && user.id === tournamentData.organizerId) {
          setAuthorized(true);
        } else if (user) {
          setError('You are not authorized to manage this tournament');
          setAuthorized(false);
        }

        if (gamesRes.ok) {
          const gamesData = await gamesRes.json();
          setGames(gamesData);
          // Initialize game scores
          const initialScores: Record<string, { score1: number; score2: number }> = {};
          gamesData.forEach((game: Game) => {
            initialScores[game.id] = {
              score1: game.score1 || 0,
              score2: game.score2 || 0,
            };
          });
          setGameScores(initialScores);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId && user) {
      fetchTournamentData();
    }
  }, [tournamentId, user]);
