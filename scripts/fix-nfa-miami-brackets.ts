/**
 * Fix NFA Miami 2026 bracket structure.
 * 
 * The Miami tournament was seeded with simple single-elimination brackets,
 * but the NFA format requires double-elimination for D1/D2 with proper
 * round names, bracketSide, and cross-division routing.
 *
 * This script:
 * 1. Deletes existing games and rounds for Open Division 1/2/3
 * 2. Creates proper NFA rounds with correct names
 * 3. Creates games with bracketSide, matchNumber
 * 4. Wires up winnerNextGameId, loserNextGameId, seedTarget
 * 5. Preserves team registrations and players
 *
 * Run against production:
 *   DATABASE_URL="mysql://..." npx tsx scripts/fix-nfa-miami-brackets.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOURNAMENT_ID = 'cmmrlfi6j0001uswj5ylegwrg';

// ── Round definitions per division ──
interface RoundDef {
  name: string;
  roundNumber: number;
  bracketSide: string;
  gameCount: number;
  startMatch: number;
}

const D1_ROUNDS: RoundDef[] = [
  { name: '1st Round W1',   roundNumber: 1,  bracketSide: 'winners', gameCount: 16, startMatch: 1  },
  { name: '4th Round W2',   roundNumber: 2,  bracketSide: 'winners', gameCount: 8,  startMatch: 17 },
  { name: '4th Round W3',   roundNumber: 3,  bracketSide: 'winners', gameCount: 4,  startMatch: 25 },
  { name: '11th Round W4',  roundNumber: 4,  bracketSide: 'winners', gameCount: 2,  startMatch: 29 },
  { name: '2nd Round L1',   roundNumber: 5,  bracketSide: 'losers',  gameCount: 8,  startMatch: 31 },
  { name: '3rd Round L2',   roundNumber: 6,  bracketSide: 'losers',  gameCount: 8,  startMatch: 39 },
  { name: '6th Round L3',   roundNumber: 7,  bracketSide: 'losers',  gameCount: 4,  startMatch: 47 },
  { name: '8th Round L4',   roundNumber: 8,  bracketSide: 'losers',  gameCount: 4,  startMatch: 51 },
  { name: '11th Round L5',  roundNumber: 9,  bracketSide: 'losers',  gameCount: 2,  startMatch: 55 },
  { name: '13th Round L6',  roundNumber: 10, bracketSide: 'losers',  gameCount: 2,  startMatch: 57 },
  { name: 'Semi-Finals',    roundNumber: 11, bracketSide: 'finals',  gameCount: 2,  startMatch: 59 },
  { name: '3rd Place',      roundNumber: 12, bracketSide: 'finals',  gameCount: 1,  startMatch: 61 },
  { name: 'Final',          roundNumber: 13, bracketSide: 'finals',  gameCount: 1,  startMatch: 62 },
];

const D3_ROUNDS: RoundDef[] = [
  { name: '7th Round W1',   roundNumber: 1,  bracketSide: 'winners', gameCount: 8,  startMatch: 63 },
  { name: '9th Round W2',   roundNumber: 2,  bracketSide: 'winners', gameCount: 4,  startMatch: 71 },
  { name: 'Semi-Finals',    roundNumber: 3,  bracketSide: 'winners', gameCount: 2,  startMatch: 75 },
  { name: '3rd Place',      roundNumber: 4,  bracketSide: 'finals',  gameCount: 1,  startMatch: 77 },
  { name: 'Final',          roundNumber: 5,  bracketSide: 'finals',  gameCount: 1,  startMatch: 78 },
];

const D2_ROUNDS: RoundDef[] = [
  { name: '10th Round W1',  roundNumber: 1,  bracketSide: 'winners', gameCount: 4,  startMatch: 79 },
  { name: '12th Round W2',  roundNumber: 2,  bracketSide: 'winners', gameCount: 2,  startMatch: 83 },
  { name: '12th Round L2',  roundNumber: 3,  bracketSide: 'losers',  gameCount: 2,  startMatch: 85 },
  { name: '14th Round L4',  roundNumber: 4,  bracketSide: 'losers',  gameCount: 2,  startMatch: 87 },
  { name: 'Semi-Finals',    roundNumber: 5,  bracketSide: 'finals',  gameCount: 2,  startMatch: 89 },
  { name: '3rd Place',      roundNumber: 6,  bracketSide: 'finals',  gameCount: 1,  startMatch: 91 },
  { name: 'Final',          roundNumber: 7,  bracketSide: 'finals',  gameCount: 1,  startMatch: 92 },
];

// ── Routing table ──
interface Route {
  wTo: number | null;
  wSlot: string;
  lTo: number | null;
  lSlot: string;
  seed?: string;
}

function buildRouting(): Map<number, Route> {
  const r = new Map<number, Route>();

  // D1 W1 (M1-M16)
  for (let i = 0; i < 16; i++) {
    const m = i + 1;
    r.set(m, {
      wTo: 17 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away',
      lTo: 31 + Math.floor(i / 2), lSlot: i % 2 === 0 ? 'home' : 'away',
    });
  }
  // D1 W2 (M17-M24)
  for (let i = 0; i < 8; i++) {
    r.set(17 + i, {
      wTo: 25 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away',
      lTo: 39 + i, lSlot: 'away',
    });
  }
  // D1 W3 (M25-M28)
  for (let i = 0; i < 4; i++) {
    r.set(25 + i, {
      wTo: 29 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away',
      lTo: 51 + i, lSlot: 'away',
    });
  }
  // D1 W4 (M29-M30)
  r.set(29, { wTo: 59, wSlot: 'home', lTo: 57, lSlot: 'away' });
  r.set(30, { wTo: 60, wSlot: 'home', lTo: 58, lSlot: 'away' });

  // D1 L1 (M31-M38)
  const d3Seeds = ['D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8'];
  for (let i = 0; i < 8; i++) {
    r.set(31 + i, { wTo: 39 + i, wSlot: 'home', lTo: null, lSlot: 'home', seed: d3Seeds[i] });
  }
  // D1 L2 (M39-M46)
  const d3Seeds2 = ['D3-S9','D3-S10','D3-S11','D3-S12','D3-S13','D3-S14','D3-S15','D3-S16'];
  for (let i = 0; i < 8; i++) {
    r.set(39 + i, { wTo: 47 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away', lTo: null, lSlot: 'home', seed: d3Seeds2[i] });
  }
  // D1 L3 (M47-M50)
  const d2Seeds = ['D2-S1','D2-S2','D2-S3','D2-S4'];
  for (let i = 0; i < 4; i++) {
    r.set(47 + i, { wTo: 51 + i, wSlot: 'home', lTo: null, lSlot: 'home', seed: d2Seeds[i] });
  }
  // D1 L4 (M51-M54)
  const d2Seeds2 = ['D2-S5','D2-S6','D2-S7','D2-S8'];
  for (let i = 0; i < 4; i++) {
    r.set(51 + i, { wTo: 55 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away', lTo: null, lSlot: 'home', seed: d2Seeds2[i] });
  }
  // D1 L5 (M55-M56)
  r.set(55, { wTo: 57, wSlot: 'home', lTo: null, lSlot: 'home' });
  r.set(56, { wTo: 58, wSlot: 'home', lTo: null, lSlot: 'home' });
  // D1 L6 (M57-M58)
  r.set(57, { wTo: 59, wSlot: 'away', lTo: null, lSlot: 'home' });
  r.set(58, { wTo: 60, wSlot: 'away', lTo: null, lSlot: 'home' });
  // D1 SF (M59-M60)
  r.set(59, { wTo: 62, wSlot: 'home', lTo: 61, lSlot: 'home' });
  r.set(60, { wTo: 62, wSlot: 'away', lTo: 61, lSlot: 'away' });
  r.set(61, { wTo: null, wSlot: 'home', lTo: null, lSlot: 'home' });
  r.set(62, { wTo: null, wSlot: 'home', lTo: null, lSlot: 'home' });

  // D3 R1 (M63-M70)
  for (let i = 0; i < 8; i++) {
    r.set(63 + i, { wTo: 71 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away', lTo: null, lSlot: 'home' });
  }
  // D3 R2 (M71-M74)
  for (let i = 0; i < 4; i++) {
    r.set(71 + i, { wTo: 75 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away', lTo: null, lSlot: 'home' });
  }
  r.set(75, { wTo: 78, wSlot: 'home', lTo: 77, lSlot: 'home' });
  r.set(76, { wTo: 78, wSlot: 'away', lTo: 77, lSlot: 'away' });
  r.set(77, { wTo: null, wSlot: 'home', lTo: null, lSlot: 'home' });
  r.set(78, { wTo: null, wSlot: 'home', lTo: null, lSlot: 'home' });

  // D2 W1 (M79-M82)
  for (let i = 0; i < 4; i++) {
    r.set(79 + i, {
      wTo: 83 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away',
      lTo: 85 + Math.floor(i / 2), lSlot: i % 2 === 0 ? 'home' : 'away',
    });
  }
  // D2 W2 (M83-M84)
  r.set(83, { wTo: 89, wSlot: 'home', lTo: 87, lSlot: 'away' });
  r.set(84, { wTo: 90, wSlot: 'home', lTo: 88, lSlot: 'away' });
  // D2 L1 (M85-M86)
  r.set(85, { wTo: 87, wSlot: 'home', lTo: null, lSlot: 'home' });
  r.set(86, { wTo: 88, wSlot: 'home', lTo: null, lSlot: 'home' });
  // D2 L2 (M87-M88)
  r.set(87, { wTo: 89, wSlot: 'away', lTo: null, lSlot: 'home' });
  r.set(88, { wTo: 90, wSlot: 'away', lTo: null, lSlot: 'home' });
  // D2 SF (M89-M90)
  r.set(89, { wTo: 92, wSlot: 'home', lTo: 91, lSlot: 'home' });
  r.set(90, { wTo: 92, wSlot: 'away', lTo: 91, lSlot: 'away' });
  r.set(91, { wTo: null, wSlot: 'home', lTo: null, lSlot: 'home' });
  r.set(92, { wTo: null, wSlot: 'home', lTo: null, lSlot: 'home' });

  return r;
}

async function main() {
  console.log('🔧 Fixing NFA Miami 2026 bracket structure...\n');

  const routing = buildRouting();

  // Verify tournament exists
  const tournament = await prisma.tournament.findUnique({ where: { id: TOURNAMENT_ID } });
  if (!tournament) throw new Error('Tournament not found!');
  console.log(`Tournament: ${tournament.name}`);

  // Get Open Division categories
  const categories = await prisma.category.findMany({
    where: { tournamentId: TOURNAMENT_ID, divisionLabel: { not: null } },
    orderBy: { sortOrder: 'asc' },
  });
  
  const catByDiv = new Map(categories.map(c => [c.divisionLabel!, c]));
  const catD1 = catByDiv.get('D1');
  const catD2 = catByDiv.get('D2');
  const catD3 = catByDiv.get('D3');
  
  if (!catD1 || !catD2 || !catD3) {
    throw new Error(`Missing division categories! Found: ${categories.map(c => c.divisionLabel).join(', ')}`);
  }

  // Delete existing games for these categories
  const divCatIds = [catD1.id, catD2.id, catD3.id];
  const deletedGames = await prisma.game.deleteMany({
    where: { categoryId: { in: divCatIds } },
  });
  console.log(`Deleted ${deletedGames.count} existing games`);

  // Delete existing rounds for these categories
  const deletedRounds = await prisma.round.deleteMany({
    where: { categoryId: { in: divCatIds }, tournamentId: TOURNAMENT_ID },
  });
  console.log(`Deleted ${deletedRounds.count} existing rounds`);

  // matchNumber → gameId map
  const matchToGameId = new Map<number, string>();

  async function createDivision(catId: string, divLabel: string, roundDefs: RoundDef[]) {
    console.log(`\nCreating ${divLabel}...`);

    for (const rd of roundDefs) {
      // Create round
      const round = await prisma.round.create({
        data: {
          name: rd.name,
          roundNumber: rd.roundNumber,
          categoryId: catId,
          tournamentId: TOURNAMENT_ID,
        },
      });

      // Create games for this round
      for (let i = 0; i < rd.gameCount; i++) {
        const matchNum = rd.startMatch + i;
        const game = await prisma.game.create({
          data: {
            tournamentId: TOURNAMENT_ID,
            categoryId: catId,
            roundId: round.id,
            courtNumber: 1,
            matchNumber: matchNum,
            bracketSide: rd.bracketSide,
            status: 'pending',
          },
        });
        matchToGameId.set(matchNum, game.id);
      }
      console.log(`  ✅ ${rd.name}: ${rd.gameCount} games (M${rd.startMatch}-M${rd.startMatch + rd.gameCount - 1})`);
    }
  }

  await createDivision(catD1.id, 'D1', D1_ROUNDS);
  await createDivision(catD3.id, 'D3', D3_ROUNDS);
  await createDivision(catD2.id, 'D2', D2_ROUNDS);

  // Wire routing
  console.log('\nWiring bracket routing...');
  let routed = 0;
  for (const [matchNumber, gameId] of matchToGameId) {
    const route = routing.get(matchNumber);
    if (!route) continue;

    const winnerNextGameId = route.wTo ? matchToGameId.get(route.wTo) || null : null;
    const loserNextGameId = route.lTo ? matchToGameId.get(route.lTo) || null : null;

    await prisma.game.update({
      where: { id: gameId },
      data: {
        winnerNextGameId,
        winnerSlot: route.wSlot,
        loserNextGameId,
        loserSlot: route.lSlot,
        seedTarget: route.seed || null,
      },
    });
    routed++;
  }
  console.log(`✅ Routed ${routed} games`);

  // Verify
  const totalGames = await prisma.game.count({ where: { categoryId: { in: divCatIds } } });
  const nullBracket = await prisma.game.count({
    where: { categoryId: { in: divCatIds }, bracketSide: null },
  });
  console.log(`\n── Verification ──`);
  console.log(`Total games: ${totalGames} (expected 92)`);
  console.log(`Null bracketSide: ${nullBracket}`);

  if (totalGames === 92 && nullBracket === 0) {
    console.log('\n🎉 Miami brackets are properly structured!');
  } else {
    console.log('\n⚠️ Check output above for issues.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
