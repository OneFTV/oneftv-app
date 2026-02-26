'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-2xl mx-auto mb-8">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-slate-400 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
