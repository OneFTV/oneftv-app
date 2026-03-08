'use client';

import Link from 'next/link';

interface PrintBracketButtonProps {
  tournamentId: string;
  className?: string;
}

export default function PrintBracketButton({ tournamentId, className }: PrintBracketButtonProps) {
  return (
    <Link
      href={`/e/${tournamentId}/print`}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors print:hidden ${className || ''}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print Brackets
    </Link>
  );
}
