/**
 * Seed script for NFA 2026 Tour - Miami, FL
 * Copies all players, categories, and team registrations from the NFA Orlando tournament.
 * Does NOT copy games/results.
 *
 * Run: npx tsx scripts/seed-nfa-miami.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏐 Seeding NFA 2026 Tour - Miami, FL...');

  // Check if already exists
  const existing = await prisma.tournament.findFirst({
    where: { name: '2026 NFA Tour - Miami, FL' },
  });
  if (existing) {
    console.log('Tournament already exists, skipping seed.');
    return;
  }

  // Find the Orlando tournament
  const orlando = await prisma.tournament.findFirst({
    where: { name: { contains: 'Orlando' } },
    include: {
      Category: {
        include: {
          TeamRegistration: true,
          TournamentPlayer: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!orlando) {
    throw new Error('Orlando tournament not found in database!');
  }

  console.log(`Found Orlando tournament: ${orlando.name} (${orlando.id})`);
  console.log(`  Categories: ${orlando.Category.length}`);

  // Find the organizer
  const organizer = await prisma.user.findUnique({
    where: { email: 'nfa@footvolleyusa.com' },
  });
  if (!organizer) {
    throw new Error('Organizer (nfa@footvolleyusa.com) not found!');
  }

  // Create the Miami tournament
  const miami = await prisma.tournament.create({
    data: {
      name: '2026 NFA Tour - Miami, FL',
      description: 'NFA National Footvolley Association Tour 2026 - Miami, FL. Features Open Division 1/2/3, Women\'s, Master, and Beginners divisions.',
      date: new Date('2026-04-18T13:00:00Z'),
      endDate: new Date('2026-04-19T18:00:00Z'),
      location: 'South Beach',
      city: 'Miami',
      state: 'FL',
      country: 'United States',
      status: 'draft',
      numCourts: orlando.numCourts,
      numDays: orlando.numDays,
      hoursPerDay: orlando.hoursPerDay,
      avgGameMinutes: orlando.avgGameMinutes,
      pointsPerSet: orlando.pointsPerSet,
      numSets: orlando.numSets,
      groupSize: orlando.groupSize,
      organizerId: organizer.id,
      allowMultiCategory: orlando.allowMultiCategory,
    },
  });

  console.log(`Created tournament: ${miami.name} (${miami.id})`);

  let totalTeams = 0;
  let totalPlayers = 0;

  for (const cat of orlando.Category) {
    // Create category for Miami
    const newCat = await prisma.category.create({
      data: {
        tournamentId: miami.id,
        name: cat.name,
        format: cat.format,
        gender: cat.gender,
        skillLevel: cat.skillLevel,
        maxTeams: cat.maxTeams,
        pointsPerSet: cat.pointsPerSet,
        numSets: cat.numSets,
        groupSize: cat.groupSize,
        sortOrder: cat.sortOrder,
        status: 'draft',
      },
    });

    console.log(`  Created category: ${newCat.name} (${newCat.id})`);

    // Copy TeamRegistrations if they exist in Orlando
    if (cat.TeamRegistration.length > 0) {
      for (const reg of cat.TeamRegistration) {
        await prisma.teamRegistration.create({
          data: {
            categoryId: newCat.id,
            player1Id: reg.player1Id,
            player2Id: reg.player2Id,
            teamName: reg.teamName,
            seed: reg.seed,
            status: 'confirmed',
          },
        });
        totalTeams++;
      }
    } else {
      // Extract teams from games if no TeamRegistrations exist
      const games = await prisma.game.findMany({
        where: { categoryId: cat.id },
        select: { player1HomeId: true, player2HomeId: true, player1AwayId: true, player2AwayId: true },
      });
      const seen = new Set<string>();
      let seed = 1;
      for (const g of games) {
        for (const [p1, p2] of [[g.player1HomeId, g.player2HomeId], [g.player1AwayId, g.player2AwayId]]) {
          if (!p1 || !p2) continue;
          const key = [p1, p2].sort().join(':');
          if (seen.has(key)) continue;
          seen.add(key);
          await prisma.teamRegistration.create({
            data: { categoryId: newCat.id, player1Id: p1, player2Id: p2, seed: seed++, status: 'confirmed' },
          });
          totalTeams++;
        }
      }
    }

    // Copy TournamentPlayers (deduplicated by the unique constraint)
    const seenPlayers = new Set<string>();
    for (const tp of cat.TournamentPlayer) {
      const key = `${tp.userId}:${newCat.id}`;
      if (seenPlayers.has(key)) continue;
      seenPlayers.add(key);

      await prisma.tournamentPlayer.create({
        data: {
          tournamentId: miami.id,
          userId: tp.userId,
          categoryId: newCat.id,
          seed: tp.seed,
          status: 'registered',
        },
      });
      totalPlayers++;
    }

    console.log(`    Teams: ${cat.TeamRegistration.length}, Players: ${seenPlayers.size}`);
  }

  console.log(`\n✅ Done! Created ${orlando.Category.length} categories, ${totalTeams} team registrations, ${totalPlayers} player entries.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
