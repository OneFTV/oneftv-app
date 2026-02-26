'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/contexts/TranslationContext';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  if (pathname?.startsWith('/e/')) return null;

  const footerLinks = {
    product: [
      { label: t('common.tournaments'), href: '/tournaments' },
      { label: t('common.rankings'), href: '/rankings' },
      { label: t('common.athletes'), href: '/athletes' },
      { label: t('common.dashboard'), href: '/dashboard' },
    ],
    company: [
      { label: t('common.footer_about'), href: '#' },
      { label: t('common.footer_contact'), href: '#' },
      { label: t('common.footer_privacy_policy'), href: '#' },
      { label: t('common.footer_terms_of_service'), href: '#' },
    ],
    social: [
      {
        label: 'Twitter',
        icon: 'twitter',
        href: 'https://twitter.com',
        external: true,
      },
      {
        label: 'Facebook',
        icon: 'facebook',
        href: 'https://facebook.com',
        external: true,
      },
      {
        label: 'Instagram',
        icon: 'instagram',
        href: 'https://instagram.com',
        external: true,
      },
      {
        label: 'YouTube',
        icon: 'youtube',
        href: 'https://youtube.com',
        external: true,
      },
    ],
  };

  const SocialIcon = ({ icon }: { icon: string }) => {
    switch (icon) {
      case 'twitter':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7z" />
          </svg>
        );
      case 'facebook':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18 2h-3a6 6 0 00-6 6v3H7v4h2v8h4v-8h3l1-4h-4V8a1 1 0 011-1h3z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
          </svg>
        );
      case 'youtube':
        return (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.54c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33zM9.75 15.02V8.98l5.92 3.03-5.92 3.01z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg">
                  <span className="text-white font-bold text-[10px] leading-none">One<br/>FTV</span>
                </div>
                <span className="text-xl font-bold text-white">
                  OneFTV
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {t('common.footer_brand_description')}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                {t('common.footer_nfa_credit')}
              </p>
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                {footerLinks.social.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                    aria-label={link.label}
                  >
                    <SocialIcon icon={link.icon} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('common.footer_product')}</h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">{t('common.footer_company')}</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link, index) => (
                  <li key={`company-${index}`}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 my-8 sm:my-12" />

          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-400 text-center sm:text-left">
              {t('common.footer_copyright', { year: String(currentYear) })}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors duration-200">
                {t('common.footer_privacy')}
              </a>
              <a href="#" className="hover:text-white transition-colors duration-200">
                {t('common.footer_terms')}
              </a>
              <a href="#" className="hover:text-white transition-colors duration-200">
                {t('common.footer_contact')}
              </a>
            </div>
          </div>
        </div>

        {/* Extra Info Bar */}
        <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
          <p>
            {t('common.footer_made_with')}{' '}
            <a
              href="https://nfa.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              {t('common.footer_nfa_link')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
