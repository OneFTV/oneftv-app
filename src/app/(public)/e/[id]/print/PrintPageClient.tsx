'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import PrintBracketTree from '@/components/tournament/PrintBracketTree';

interface PrintPageClientProps {
  tournament: any;
}

export default function PrintPageClient({ tournament }: PrintPageClientProps) {
  const [view, setView] = useState<'bracket' | 'table'>('bracket');

  const hasBracketCategories = tournament.categories.some(
    (cat: any) => cat.format === 'bracket' || cat.format === 'double_elimination'
  );

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 0.5in; }
          .no-print { display: none !important; }
        }

        /* ─── Print Bracket Styles ─── */
        .print-bracket-container {
          display: flex;
          align-items: stretch;
          gap: 0;
          overflow-x: auto;
        }
        .print-bracket-round {
          display: flex;
          flex-direction: column;
          min-width: 180px;
          flex-shrink: 0;
        }
        .print-round-header {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 8px;
          border-bottom: 2px solid #000;
          margin-bottom: 4px;
        }
        .print-round-games {
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: space-around;
        }
        .print-round-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 4px 0;
          min-height: 54px;
        }

        /* ─── Match Card ─── */
        .print-match {
          border: 1.5px solid #000;
          width: 160px;
          font-size: 10px;
          background: #fff;
          position: relative;
          z-index: 1;
        }
        .print-match-header {
          font-size: 8px;
          color: #666;
          text-align: center;
          border-bottom: 1px solid #ccc;
          padding: 1px 4px;
          line-height: 1.2;
        }
        .print-match-team {
          display: flex;
          justify-content: space-between;
          padding: 2px 6px;
          border-bottom: 1px solid #ddd;
          line-height: 1.4;
        }
        .print-match-team-away {
          border-bottom: none;
        }
        .print-match-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 120px;
        }
        .print-match-score {
          font-weight: 600;
          font-family: monospace;
          min-width: 16px;
          text-align: right;
        }

        /* ─── Connector Lines ─── */
        .print-connector-in {
          position: absolute;
          left: 0;
          top: 50%;
          width: 10px;
          height: 0;
          border-top: 1.5px solid #000;
        }
        .print-connector-out {
          position: absolute;
          right: 0;
          top: 50%;
          width: 10px;
          height: 0;
          border-top: 1.5px solid #000;
        }
        /* Vertical lines between connector out pairs */
        .print-round-slot:nth-child(odd) .print-connector-out::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 0;
          height: 100%;
          border-right: 1.5px solid #000;
        }
        .print-round-slot:nth-child(even) .print-connector-out::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: 0;
          width: 0;
          height: 100%;
          border-right: 1.5px solid #000;
        }

        .print-bracket-section {
          margin-bottom: 16px;
        }
        .print-bracket-empty {
          padding: 16px;
        }
      `}</style>

      <div className="p-8 bg-white text-black print:p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-gray-600">
            {tournament.location}{tournament.city ? `, ${tournament.city}` : ''}
            {tournament.state ? `, ${tournament.state}` : ''}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(tournament.date).toLocaleDateString()}
            {tournament.endDate ? ` — ${new Date(tournament.endDate).toLocaleDateString()}` : ''}
          </p>
        </div>

        {/* Controls (hidden in print) */}
        <div className="no-print flex items-center justify-center gap-4 mb-6">
          {hasBracketCategories && (
            <div className="inline-flex rounded border border-gray-300 overflow-hidden">
              <button
                onClick={() => setView('bracket')}
                className={`px-4 py-2 text-sm font-medium ${
                  view === 'bracket' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                🏆 Bracket View
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-4 py-2 text-sm font-medium ${
                  view === 'table' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                📋 Table View
              </button>
            </div>
          )}
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
            🖨️ Print
          </button>
        </div>

        {tournament.categories.map((cat: any, catIdx: number) => (
          <div key={cat.id} className={`mb-8 ${catIdx > 0 ? 'break-before-page' : ''}`}>
            <h2 className="text-xl font-bold border-b-2 border-black pb-1 mb-4">{cat.name}</h2>

            {/* Groups */}
            {cat.groups.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Groups</h3>
                <div className="grid grid-cols-2 gap-4">
                  {cat.groups.map((g: any) => (
                    <div key={g.id} className="border rounded p-2">
                      <h4 className="font-medium text-sm mb-1">{g.name}</h4>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1">Team</th>
                            <th className="text-center">W</th>
                            <th className="text-center">L</th>
                            <th className="text-center">+/-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.players.map((p: any) => (
                            <tr key={p.id}>
                              <td className="py-0.5">{p.name}</td>
                              <td className="text-center">{p.wins}</td>
                              <td className="text-center">{p.losses}</td>
                              <td className="text-center">{p.pointDiff}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bracket or Table View for Games */}
            {cat.games.length > 0 && (
              <>
                {view === 'bracket' && (cat.format === 'bracket' || cat.format === 'double_elimination') ? (
                  <PrintBracketTree
                    games={cat.games}
                    categoryName={cat.name}
                    format={cat.format}
                  />
                ) : (
                  <div>
                    <h3 className="font-semibold mb-2">Games</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2">
                          <th className="text-left py-1">#</th>
                          <th className="text-left">Round</th>
                          <th className="text-center">Court</th>
                          <th className="text-left">Home</th>
                          <th className="text-center">Score</th>
                          <th className="text-right">Away</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.games.map((g: any) => (
                          <tr key={g.id} className="border-b">
                            <td className="py-0.5">{g.matchNumber || '—'}</td>
                            <td>{g.roundName || g.groupName || '—'}</td>
                            <td className="text-center">{g.courtNumber}</td>
                            <td>{g.homeTeam}</td>
                            <td className="text-center font-mono">
                              {g.scoreHome !== null ? `${g.scoreHome}-${g.scoreAway}` : '—'}
                            </td>
                            <td className="text-right">{g.awayTeam}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        <div className="text-center mt-8 text-xs text-gray-400 print:mt-4">
          <p>Generated by OneFTV</p>
        </div>
      </div>
    </>
  );
}
