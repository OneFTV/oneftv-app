import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const inter = localFont({
  src: [
    {
      path: '../fonts/inter-var.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
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
    icon: '/favicon.svg',
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
