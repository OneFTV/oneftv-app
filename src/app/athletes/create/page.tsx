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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-3xl font-bold text-white mb-8">Create Athlete Profile</h1>
        <p className="text-slate-400">This page is being reconstructed. Please check back soon.</p>
      </div>
    </div>
  );
}
