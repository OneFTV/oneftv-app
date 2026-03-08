import { notFound } from 'next/navigation';
import { prisma } from '@/shared/database/prisma';
import PrintPageClient from './PrintPageClient';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const t = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  return { title: t ? `Print Brackets — ${t.name}` : 'Print Brackets' };
}

export default async function PrintPage({ params }: PageProps) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          groups: {
            include: {
              players: {
                include: {
                  user: { select: { name: true } },
                  teamRegistration: {
                    include: {
                      player1: { select: { name: true } },
                      player2: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          games: {
            orderBy: [{ scheduledTime: 'asc' }, { matchNumber: 'asc' }],
            include: {
              player1Home: { select: { name: true } },
              player2Home: { select: { name: true } },
              player1Away: { select: { name: true } },
              player2Away: { select: { name: true } },
              round: { select: { name: true, roundNumber: true, type: true } },
              group: { select: { name: true } },
            },
          },
          rounds: {
            orderBy: { roundNumber: 'asc' },
          },
        },
      },
    },
  });

  if (!tournament) notFound();

  // Assign global game numbers
  let gameNumber = 1;
  const gamesWithNumbers: Array<{
    gameNumber: number;
    categoryName: string;
    categoryId: string;
    game: (typeof tournament.categories)[0]['games'][0];
  }> = [];

  for (const category of tournament.categories) {
    for (const game of category.games) {
      gamesWithNumbers.push({
        gameNumber: game.matchNumber ?? gameNumber,
        categoryName: category.name,
        categoryId: category.id,
        game,
      });
      gameNumber++;
    }
  }

  // Serialize for client component
  const serialized = {
    id: tournament.id,
    name: tournament.name,
    date: tournament.date.toISOString(),
    endDate: tournament.endDate?.toISOString() || null,
    location: tournament.location,
    city: tournament.city,
    state: tournament.state,
    numCourts: tournament.numCourts,
    categories: tournament.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      format: cat.format,
      maxTeams: cat.maxTeams,
      groups: cat.groups.map((g) => ({
        id: g.id,
        name: g.name,
        players: g.players.map((p) => {
          const teamName = p.teamRegistration
            ? `${p.teamRegistration.player1.name} & ${p.teamRegistration.player2.name}`
            : p.user.name;
          return {
            id: p.id,
            name: teamName,
            wins: p.wins,
            losses: p.losses,
            points: p.points,
            pointDiff: p.pointDiff,
          };
        }),
      })),
      games: cat.games.map((g) => {
        const home = [g.player1Home?.name, g.player2Home?.name].filter(Boolean).join(' & ') || 'TBD';
        const away = [g.player1Away?.name, g.player2Away?.name].filter(Boolean).join(' & ') || 'TBD';
        return {
          id: g.id,
          matchNumber: g.matchNumber,
          courtNumber: g.courtNumber,
          scheduledTime: g.scheduledTime?.toISOString() || null,
          homeTeam: home,
          awayTeam: away,
          scoreHome: g.scoreHome,
          scoreAway: g.scoreAway,
          status: g.status,
          winningSide: g.winningSide,
          roundName: g.round?.name || null,
          roundNumber: g.round?.roundNumber || null,
          roundType: g.round?.type || null,
          groupName: g.group?.name || null,
          bracketSide: g.bracketSide,
          winnerNextGameId: g.winnerNextGameId,
          loserNextGameId: g.loserNextGameId,
        };
      }),
      rounds: cat.rounds.map((r) => ({
        id: r.id,
        name: r.name,
        roundNumber: r.roundNumber,
        type: r.type,
        bracketSide: r.bracketSide,
      })),
    })),
  };

  return <PrintPageClient tournament={serialized} />;
}
