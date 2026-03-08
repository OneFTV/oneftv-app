'use client';

import { QRCodeSVG } from 'qrcode.react';

interface RefereeQRCodeProps {
  token: string;
  courtNumber: number;
  tournamentName: string;
  baseUrl?: string;
}

export default function RefereeQRCode({
  token,
  courtNumber,
  tournamentName,
  baseUrl,
}: RefereeQRCodeProps) {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://oneftv.com');
  const url = `${origin}/ref/${token}`;

  return (
    <div className="inline-flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 print:border-black print:shadow-none">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {tournamentName}
      </h3>
      <h2 className="text-2xl font-black text-gray-900 mb-4">Court {courtNumber}</h2>
      <QRCodeSVG value={url} size={200} level="M" includeMargin />
      <p className="mt-4 text-xs text-gray-400 break-all max-w-[200px] text-center">{url}</p>
      <p className="mt-2 text-sm font-medium text-gray-600">Scan to score this court</p>
    </div>
  );
}
