'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nationality: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  state: string;
  country: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
}

interface FormErrors {
  [key: string]: string;
}

const COUNTRIES = [
  'Argentina',
  'Brazil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Denmark',
  'Egypt',
  'France',
  'Germany',
  'Italy',
  'Japan',
  'Mexico',
  'Netherlands',
  'Peru',
  'Portugal',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'United States',
  'Uruguay',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'] as const;

const STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
];

export default function CreateAthleteePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nationality: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    state: '',
    country: '',
    level: 'Beginner',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Street number is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/athletes');
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || 'Failed to create athlete' });
      }
    } catch {
      setErrors({ submit: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-semibold text-white mb-2';
  const errorClass = 'text-red-400 text-xs mt-1';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white mb-6 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-3xl font-bold text-white mb-8">
          Create Athlete Profile
        </h1>

        {successMessage && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 mb-6">
            <p className="text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className={inputClass}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="athlete@email.com"
                className={inputClass}
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Password *</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 characters"
                className={inputClass}
              />
              {errors.password && (
                <p className={errorClass}>{errors.password}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Confirm Password *</label>
              <input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className={inputClass}
              />
              {errors.confirmPassword && (
                <p className={errorClass}>{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Level & Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className={inputClass}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nationality *</label>
              <input
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="e.g. Brazilian"
                className={inputClass}
              />
              {errors.nationality && (
                <p className={errorClass}>{errors.nationality}</p>
              )}
            </div>
          </div>

          {/* Country & State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Country *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className={errorClass}>{errors.country}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select state</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.state && <p className={errorClass}>{errors.state}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Phone *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className={inputClass}
            />
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Street *</label>
              <input
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Street address"
                className={inputClass}
              />
              {errors.street && <p className={errorClass}>{errors.street}</p>}
            </div>
            <div>
              <label className={labelClass}>Number *</label>
              <input
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="123"
                className={inputClass}
              />
              {errors.number && <p className={errorClass}>{errors.number}</p>}
            </div>
          </div>

          <div>
            <label className={labelClass}>Complement</label>
            <input
              name="complement"
              value={formData.complement}
              onChange={handleChange}
              placeholder="Apt, suite, etc. (optional)"
              className={inputClass}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading && <Loader size={20} className="animate-spin" />}
            {loading ? 'Creating...' : 'Create Athlete'}
          </button>
        </form>
      </div>
    </div>
  );
}
