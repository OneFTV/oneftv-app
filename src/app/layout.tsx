import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OneFTV - Tournament Management',
  description:
    'Organize, manage, and execute footvolley tournaments worldwide. Real-time scoring, athlete rankings, team management, and tournament scheduling.',
  keywords: [
    'footvolley',
    'tournament',
    'management',
    'beach sports',
    'volleyball',
    'rankings',
  ],
  authors: [{ name: 'OneFTV' }],
  openGraph: {
    title: 'OneFTV - Tournament Management',
    description: 'Organize and manage footvolley tournaments with ease',
    type: 'website',
    locale: 'en_US',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
