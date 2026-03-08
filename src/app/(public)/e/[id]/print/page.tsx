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
      Category: {
        orderBy: { sortOrder: 'asc' },
        include: {
          Group: {
            include: {
              TournamentPlayer: {
                include: {
                  User: { select: { name: true } },
                  TeamRegistration: {
                    include: {
                      User_TeamRegistration_player1IdToUser: { select: { name: true } },
                      User_TeamRegistration_player2IdToUser: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          Game: {
            orderBy: [{ scheduledTime: 'asc' }, { matchNumber: 'asc' }],
            include: {
              User_Game_player1HomeIdToUser: { select: { name: true } },
              User_Game_player2HomeIdToUser: { select: { name: true } },
              User_Game_player1AwayIdToUser: { select: { name: true } },
              User_Game_player2AwayIdToUser: { select: { name: true } },
              Round: { select: { name: true, roundNumber: true, type: true } },
              Group: { select: { name: true } },
            },
          },
          Round: {
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
    game: (typeof tournament.Category)[0]['Game'][0];
  }> = [];

  for (const category of tournament.Category) {
    for (const game of category.Game) {
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
    categories: tournament.Category.map((cat) => ({
      id: cat.id,
      name: cat.name,
      format: cat.format,
      maxTeams: cat.maxTeams,
      groups: cat.Group.map((g) => ({
        id: g.id,
        name: g.name,
        players: g.TournamentPlayer.map((p) => {
          const teamName = p.TeamRegistration
            ? `${p.TeamRegistration.User_TeamRegistration_player1IdToUser.name} & ${p.TeamRegistration.User_TeamRegistration_player2IdToUser.name}`
            : p.User.name;
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
      games: cat.Game.map((g) => {
        const home = [g.User_Game_player1HomeIdToUser?.name, g.User_Game_player2HomeIdToUser?.name].filter(Boolean).join(' & ') || 'TBD';
        const away = [g.User_Game_player1AwayIdToUser?.name, g.User_Game_player2AwayIdToUser?.name].filter(Boolean).join(' & ') || 'TBD';
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
          roundName: g.Round?.name || null,
          roundNumber: g.Round?.roundNumber || null,
          roundType: g.Round?.type || null,
          groupName: g.Group?.name || null,
          bracketSide: g.bracketSide,
          winnerNextGameId: g.winnerNextGameId,
          loserNextGameId: g.loserNextGameId,
        };
      }),
      rounds: cat.Round.map((r) => ({
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
