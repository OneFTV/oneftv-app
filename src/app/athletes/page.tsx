'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  nationality: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  country: string;
  totalPoints: number;
  gamesWon: number;
  gamesPlayed: number;
  winRate: number;
  flagEmoji: string;
}

const LEVEL_COLORS = {
  Beginner: 'bg-blue-100 text-blue-800',
  Intermediate: 'bg-green-100 text-green-800',
  Advanced: 'bg-purple-100 text-purple-800',
  Pro: 'bg-yellow-100 text-yellow-800',
};

const ITEMS_PER_PAGE = 12;

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [countries, setCountries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/athletes');
        const data = await response.json();
        setAthletes(data);

        // Extract unique countries
        const uniqueCountries = Array.from(
          new Set(data.map((athlete: Athlete) => athlete.country))
        ).sort() as string[];
        setCountries(uniqueCountries);
      } catch (error) {
        console.error('Failed to fetch athletes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, []);

  useEffect(() => {
    let filtered = athletes;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((athlete) =>
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (selectedLevel !== 'All') {
      filtered = filtered.filter((athlete) => athlete.level === selectedLevel);
    }

    // Country filter
    if (selectedCountry !== 'All') {
      filtered = filtered.filter((athlete) => athlete.country === selectedCountry);
    }

    setFilteredAthletes(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedLevel, selectedCountry, athletes]);

  const totalPages = Math.ceil(filteredAthletes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAthletes = filteredAthletes.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const AthleteCard = ({ athlete }: { athlete: Athlete }) => (
    <Link href={`/athletes/${athlete.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{athlete.flagEmoji}</span>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{athlete.name}</h3>
              <p className="text-sm text-gray-600">{athlete.country}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              LEVEL_COLORS[athlete.level]
            }`}
          >
            {athlete.level}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Total Points</span>
            <span className="font-bold text-lg text-blue-600">
              {athlete.totalPoints}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Games Won</span>
            <span className="font-bold text-lg text-green-600">
              {athlete.gamesWon}/{athlete.gamesPlayed}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Win Rate</span>
            <span className="font-bold text-lg text-purple-600">
              {(athlete.winRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="mb-4 flex gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse mb-4 w-24" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  +ctrl click to see where it goes>
        </div>
      </div>
    </Link>
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="mb-4 flex gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse mb-4 w-24" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  +ctrl click to see where it goes>
        </div>
      </div>
    </Link>
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="mb-4 flex gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full animate-pulse mb-4 w-24" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  +ctrl click to see where it goes>
        </div>
      </div>
    </Link>
  );

