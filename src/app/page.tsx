'use client';

import Link from 'next/link';
import { useTranslation } from '@/contexts/TranslationContext';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {t('home.hero_title')}
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            {t('home.hero_description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tournaments/create"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              {t('home.create_tournament')}
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 border-2 border-blue-400 text-blue-300 rounded-lg font-bold text-lg hover:bg-blue-400/10 transition-all"
            >
              {t('home.view_rankings')}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-cyan-300 mb-2">500+</div>
            <div className="text-slate-300 text-lg font-semibold">{t('home.stat_athletes')}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-cyan-300 mb-2">100+</div>
            <div className="text-slate-300 text-lg font-semibold">{t('home.stat_tournaments')}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-cyan-300 mb-2">20+</div>
            <div className="text-slate-300 text-lg font-semibold">{t('home.stat_countries')}</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">{t('home.features_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V6.5m-11-3v3m4-3v3m4-3v3M3.5 9.5h13" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{t('home.feature_kotb_title')}</h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_kotb_1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_kotb_2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_kotb_3')}</span>
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h3a1 1 0 000-2 2 2 0 01-2-2V3a1 1 0 10-2 0v1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 00-2 0zm6 7a1 1 0 11-2 0 1 1 0 012 0zm2 0a1 1 0 11-2 0 1 1 0 012 0zm2 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{t('home.feature_scheduling_title')}</h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_scheduling_1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_scheduling_2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_scheduling_3')}</span>
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{t('home.feature_rankings_title')}</h3>
            <ul className="text-slate-300 space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_rankings_1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_rankings_2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold mt-1">&bull;</span>
                <span>{t('home.feature_rankings_3')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl my-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">{t('home.how_it_works')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: 1, title: t('home.step1_title'), desc: t('home.step1_desc') },
            { step: 2, title: t('home.step2_title'), desc: t('home.step2_desc') },
            { step: 3, title: t('home.step3_title'), desc: t('home.step3_desc') },
            { step: 4, title: t('home.step4_title'), desc: t('home.step4_desc') },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">{item.step}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tournament Formats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-16">{t('home.formats_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 border border-blue-400/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">{t('home.format_kotb_title')}</h3>
            <p className="text-slate-300 mb-4">
              {t('home.format_kotb_desc')}
            </p>
            <ul className="text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                {t('home.format_kotb_1')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                {t('home.format_kotb_2')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                {t('home.format_kotb_3')}
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 border border-blue-400/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">{t('home.format_bracket_title')}</h3>
            <p className="text-slate-300 mb-4">
              {t('home.format_bracket_desc')}
            </p>
            <ul className="text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                {t('home.format_bracket_1')}
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-white mb-4">{t('home.cta_title')}</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            {t('home.cta_description')}
          </p>
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            {t('home.cta_button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
