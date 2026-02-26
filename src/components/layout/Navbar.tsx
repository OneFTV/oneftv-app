'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: t('common.home') },
    { href: '/tournaments', label: t('common.tournaments') },
    { href: '/rankings', label: t('common.rankings') },
    { href: '/athletes', label: t('common.athletes') },
    { href: '/livefeed', label: t('common.live_feed') },
  ];

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  if (pathname?.startsWith('/e/')) return null;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'backdrop-blur-sm bg-slate-900/95 shadow-md shadow-blue-500/5' : 'bg-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
          >
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg group-hover:from-blue-600 group-hover:to-cyan-500 transition-all duration-200">
              <span className="text-white font-bold text-[8px] sm:text-[10px] leading-none">One<br/>FTV</span>
            </div>
            <span className="hidden sm:inline text-lg sm:text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">
              OneFTV
            </span>
            <span className="sm:hidden text-lg font-bold text-white">
              OneFTV
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`link-nav transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section + Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {status === 'loading' ? (
              <div className="w-10 h-10 bg-slate-700 rounded-lg animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {session.user.email}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {session.user.name?.charAt(0) || 'U'}
                </div>
                <div className="border-l border-slate-700 pl-4 flex items-center space-x-3">
                  <Link href="/dashboard" className="btn-outline btn-sm">
                    {t('common.dashboard')}
                  </Link>
                  <Link href="/profile" className="btn-outline btn-sm">
                    {t('common.profile') || 'Profile'}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="btn-primary btn-sm"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" className="btn-outline btn-sm">
                  {t('common.login')}
                </Link>
                <Link href="/register" className="btn-primary btn-sm">
                  {t('common.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  isOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                  {isOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive(link.href)
                      ? 'bg-blue-500/20 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Auth Section */}
              <div className="border-t border-slate-800 mt-4 pt-4 space-y-2">
                {status === 'loading' ? (
                  <div className="h-10 bg-slate-700 rounded-lg animate-pulse" />
                ) : session?.user ? (
                  <>
                    <div className="px-3 py-2 text-sm font-medium text-white">
                      {session.user.name}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="block btn-outline w-full text-center"
                    >
                      {t('common.dashboard')}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block btn-outline w-full text-center"
                    >
                      {t('common.profile') || 'Profile'}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block btn-primary w-full"
                    >
                      {t('common.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block btn-outline w-full text-center"
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="block btn-primary w-full text-center"
                    >
                      {t('common.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
