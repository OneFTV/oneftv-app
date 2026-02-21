'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { TranslationProvider } from '@/contexts/TranslationContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </SessionProvider>
  );
}
