'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/contexts/TranslationContext';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nationality: string;
  phone: string;
  level: string;
}

const COUNTRIES = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Ecuador',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Peru',
  'Poland',
  'Portugal',
  'Russia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Vietnam',
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nationality: '',
    phone: '',
    level: 'Beginner',
  });
  const [errors, setErrors] = useState<Partial<FormData> & { submit?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> & { submit?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = t('auth.name_required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.name_min_2');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('auth.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.email_invalid_short');
    }

    if (!formData.password) {
      newErrors.password = t('auth.password_required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.password_min_8');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwords_no_match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          nationality: formData.nationality,
          phone: formData.phone,
          level: formData.level,
        }),
      });

      if (res.ok) {
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
          callbackUrl: '/dashboard',
        });

        if (signInResult?.ok) {
          router.push(signInResult.url || '/dashboard');
        } else {
          // Auto-login failed, still send to dashboard via login
          router.push('/login?callbackUrl=%2Fdashboard');
        }
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || t('auth.registration_failed') });
      }
    } catch {
      setErrors({ submit: t('auth.registration_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name as keyof typeof n];
        return n;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">{t('auth.register_title')}</h1>
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">{t('auth.name_label')}</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">{t('auth.email_label')}</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">{t('auth.password_label')}</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">{t('auth.confirm_password_label')}</label>
            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg" />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? t('auth.creating_account') : t('auth.register_button')}
          </button>
        </form>
        <p className="text-slate-400 text-center mt-6">
          {t('auth.already_have_account')}{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">{t('common.sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}
