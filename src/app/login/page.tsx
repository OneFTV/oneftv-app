'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/contexts/TranslationContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError(t('auth.email_required'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.email_invalid'));
      return false;
    }
    if (!password) {
      setError(t('auth.password_required'));
      return false;
    }
    if (password.length < 6) {
      setError(t('auth.password_min_6'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.invalid_credentials'));
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch {
      setError(t('common.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold">FV</span>
            </div>
            <span className="text-white font-bold text-xl">FootVolley Pro</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{t('auth.sign_in_title')}</h1>
          <p className="text-slate-400">{t('auth.sign_in_subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                {t('auth.email_label')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t('auth.email_placeholder')}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                {t('auth.password_label')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder={t('auth.password_placeholder')}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.signing_in')}
                </span>
              ) : (
                t('auth.sign_in_button')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-600/50"></div>
            <span className="px-4 text-slate-400 text-sm">{t('auth.new_to_app')}</span>
            <div className="flex-1 border-t border-slate-600/50"></div>
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="w-full block text-center py-3 border-2 border-blue-400 text-blue-300 rounded-lg font-bold text-lg hover:bg-blue-400/10 transition-all"
          >
            {t('auth.create_account')}
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            {t('auth.having_trouble')}{' '}
            <a href="#" className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">
              {t('auth.contact_support')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
