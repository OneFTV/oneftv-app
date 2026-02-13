'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  format: 'king_of_the_beach' | 'bracket' | 'group_knockout' | 'round_robin';
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

const FORMATS = [
  { value: 'king_of_the_beach', label: 'King of the Beach' },
  { value: 'bracket', label: 'Bracket' },
  { value: 'group_knockout', label: 'Group+Knockout' },
  { value: 'round_robin', label: 'Round Robin' },
] as const;
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
    format: 'king_of_the_beach',
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
) => {
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

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle size={20} />
            {errors.submit}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Miami Beach Open 2025"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell athletes about this tournament..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Copacabana Beach"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Tournament Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courts</label>
                <input
                  type="number"
                  name="courts"
                  value={formData.courts}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.courts && <p className="text-red-500 text-sm mt-1">{errors.courts}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
                <input
                  type="number"
                  name="days"
                  value={formData.days}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.days && <p className="text-red-500 text-sm mt-1">{errors.days}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours Per Day</label>
                <input
                  type="number"
                  name="hoursPerDay"
                  value={formData.hoursPerDay}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.hoursPerDay && <p className="text-red-500 text-sm mt-1">{errors.hoursPerDay}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Players</label>
                <input
                  type="number"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  min={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.maxPlayers && <p className="text-red-500 text-sm mt-1">{errors.maxPlayers}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points Per Set</label>
                <input
                  type="number"
                  name="pointsPerSet"
                  value={formData.pointsPerSet}
                  onChange={handleChange}
                  min={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.pointsPerSet && <p className="text-red-500 text-sm mt-1">{errors.pointsPerSet}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avg Game Duration (min)</label>
                <input
                  type="number"
                  name="avgGameDuration"
                  value={formData.avgGameDuration}
                  onChange={handleChange}
                  min={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Capacity Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Estimated capacity:</strong> Up to {calculateMaxGames()} games with current settings
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
