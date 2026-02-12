'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  format: 'King of the Beach' | 'Bracket' | 'Group+Knockout' | 'Round Robin';
  location: string;
  city: string;
  state: string;
  country: string;
  startDate: string;
  endDate: string;
  courts: number;
  days: number;
  hoursPerDay: number;
  avgGameDuration: number;
  maxPlayers: number;
  pointsPerSet: number;
  sets: 1 | 3;
  groupSize: number;
}

interface FormErrors {
  [key: string]: string;
}

const FORMATS = ['King of the Beach', 'Bracket', 'Group+Knockout', 'Round Robin'] as const;
const COUNTRIES = [
  'United States',
  'Canada',
  'Brazil',
  'Mexico',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Other',
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    format: 'King of the Beach',
    location: '',
    city: '',
    state: '',
    country: 'United States',
    startDate: '',
    endDate: '',
    courts: 2,
    days: 1,
    hoursPerDay: 8,
    avgGameDuration: 20,
    maxPlayers: 16,
    pointsPerSet: 18,
    sets: 1,
    groupSize: 4,
  });

  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          router.push('/login?redirect=/tournaments/create');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login?redirect=/tournaments/create');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const calculateMaxGames = () => {
    const totalMinutesAvailable = formData.courts * formData.days * formData.hoursPerDay * 60;
    return Math.floor(totalMinutesAvailable / formData.avgGameDuration);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tournament name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.courts < 1) {
      newErrors.courts = 'At least 1 court is required';
    }
    if (formData.days < 1) {
      newErrors.days = 'At least 1 day is required';
    }
    if (formData.hoursPerDay < 1) {
      newErrors.hoursPerDay = 'Hours per day must be at least 1';
    }
    if (formData.maxPlayers < 2) {
      newErrors.maxPlayers = 'At least 2 players required';
    }
    if (formData.pointsPerSet < 10) {
      newErrors.pointsPerSet = 'Points per set must be at least 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tournament');
      }

      const createdTournament = await response.json();
      setSuccessMessage('Tournament created successfully!');

      setTimeout(() => {
        router.push(`/tournaments/${createdTournament.id}`);
      }, 1500);
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'An error occurred while creating the tournament',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
% => {
    const { name, value } = e.target;
    setFormData((prev) => (
      {
        ...prev,
        [name]: name === 'courts' || name === 'days' || name === 'hoursPerDay' || name === 'avgGameDuration' || name === 'maxPlayers' || name === 'pointsPerSet' || name === 'groupSize'
          ? parseInt(value, 10)
          : name === 'sets'
          ? (parseInt(value, 10) as 1 | 3)
          : value,
      }
    ));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Tournament</h1>
          <p className="text-gray-600">Set up a new footvolley tournament with all the details</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
