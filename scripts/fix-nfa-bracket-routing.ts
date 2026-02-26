/**
 * Fix NFA Orlando 2022 bracket routing.
 * Assigns matchNumber, bracketSide, winnerNextGameId, loserNextGameId, winnerSlot, loserSlot, seedTarget
 * for all Open Division 1/2/3 games.
 *
 * Run: npx ts-node scripts/fix-nfa-bracket-routing.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Round-to-match mapping ──
// Each entry: [roundName, bracketSide, startMatchNumber, count]
type RoundMapping = [string, string, number, number];

const D1_ROUND_MAP: RoundMapping[] = [
  ['1st Round W1',    'winners', 1,  16],
  ['4th Round W2',    'winners', 17, 8],
  ['4th Round W3',    'winners', 25, 4],
  ['11th Round W4',   'winners', 29, 2],
  ['2nd Round L1',    'losers',  31, 8],
  ['3rd Round L2',    'losers',  39, 8],
  ['6th Round L3',    'losers',  47, 4],
  ['8th Round L4',    'losers',  51, 4],
  ['11th Round L5',   'losers',  55, 2],
  ['13th Round L6',   'losers',  57, 2],
  ['Semi-Finals',     'finals',  59, 2],
  ['3rd Place',       'finals',  61, 1],
  ['Final',           'finals',  62, 1],
];

const D2_ROUND_MAP: RoundMapping[] = [
  ['10th Round W1',   'winners', 79, 4],
  ['12th Round W2',   'winners', 83, 2],
  ['12th Round L2',   'losers',  85, 2],
  ['14th Round L4',   'losers',  87, 2],
  ['Semi-Finals',     'finals',  89, 2],
  ['3rd Place',       'finals',  91, 1],
  ['Final',           'finals',  92, 1],
];

const D3_ROUND_MAP: RoundMapping[] = [
  ['7th Round W1',    'winners', 63, 8],
  ['9th Round W2',    'winners', 71, 4],
  ['Semi-Finals',     'winners', 75, 2],
  ['3rd Place',       'finals',  77, 1],
  ['Final',           'finals',  78, 1],
];

// ── Full routing table (from NFA_Tournament_Bracket_Visual_References.md) ──
// matchNumber → { winnerGoesTo, winnerSlot, loserGoesTo, loserSlot, seedTarget? }
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
    const m = 17 + i;
    r.set(m, {
      wTo: 25 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away',
      lTo: 39 + i, lSlot: 'away',
    });
  }
  // D1 W3 (M25-M28)
  for (let i = 0; i < 4; i++) {
    const m = 25 + i;
    r.set(m, {
      wTo: 29 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away',
      lTo: 51 + i, lSlot: 'away',
    });
  }
  // D1 W4 (M29-M30)
  r.set(29, { wTo: 59, wSlot: 'home', lTo: 57, lSlot: 'away' });
  r.set(30, { wTo: 60, wSlot: 'home', lTo: 58, lSlot: 'away' });

  // D1 L1 (M31-M38)
  const d3FromL1 = ['D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8'];
  for (let i = 0; i < 8; i++) {
    r.set(31 + i, { wTo: 39 + i, wSlot: 'home', lTo: null, lSlot: 'home', seed: d3FromL1[i] });
  }
  // D1 L2 (M39-M46)
  const d3FromL2 = ['D3-S9','D3-S10','D3-S11','D3-S12','D3-S13','D3-S14','D3-S15','D3-S16'];
  for (let i = 0; i < 8; i++) {
    r.set(39 + i, { wTo: 47 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away', lTo: null, lSlot: 'home', seed: d3FromL2[i] });
  }
  // D1 L3 (M47-M50)
  const d2FromL3 = ['D2-S1','D2-S2','D2-S3','D2-S4'];
  for (let i = 0; i < 4; i++) {
    r.set(47 + i, { wTo: 51 + i, wSlot: 'home', lTo: null, lSlot: 'home', seed: d2FromL3[i] });
  }
  // D1 L4 (M51-M54)
  const d2FromL4 = ['D2-S5','D2-S6','D2-S7','D2-S8'];
  for (let i = 0; i < 4; i++) {
    r.set(51 + i, { wTo: 55 + Math.floor(i / 2), wSlot: i % 2 === 0 ? 'home' : 'away', lTo: null, lSlot: 'home', seed: d2FromL4[i] });
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
  // D1 Bronze & Final
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
  // D3 SF (M75-M76)
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
  console.log('🔧 Fixing NFA Orlando 2022 bracket routing...\n');

  const routing = buildRouting();

  // Find tournament
  const tournament = await prisma.tournament.findFirst({
    where: { name: '2022 NFA Tour - 4th Stop Orlando, FL' },
  });
  if (!tournament) throw new Error('Tournament not found!');

  // Find categories
  const categories = await prisma.category.findMany({
    where: { tournamentId: tournament.id },
  });
  const catMap = new Map(categories.map(c => [c.name, c]));

  const catD1 = catMap.get('Open Division 1')!;
  const catD2 = catMap.get('Open Division 2')!;
  const catD3 = catMap.get('Open Division 3')!;

  // matchNumber → gameId map (across all divisions, since M1-M92 is global)
  const matchToGameId = new Map<number, string>();

  // Process each division
  async function processDivision(catId: string, catName: string, roundMap: RoundMapping[]) {
    console.log(`Processing ${catName}...`);

    // Get all rounds for this category
    const rounds = await prisma.round.findMany({
      where: { categoryId: catId, tournamentId: tournament!.id },
    });
    const roundByName = new Map(rounds.map(r => [r.name, r]));

    let totalUpdated = 0;

    for (const [roundName, bracketSide, startMatch, count] of roundMap) {
      const round = roundByName.get(roundName);
      if (!round) {
        console.error(`  ❌ Round "${roundName}" not found!`);
        continue;
      }

      // Get games in this round, ordered by scheduledTime then creation order
      const games = await prisma.game.findMany({
        where: { roundId: round.id, categoryId: catId },
        orderBy: [{ scheduledTime: 'asc' }, { createdAt: 'asc' }],
      });

      if (games.length !== count) {
        console.warn(`  ⚠️ Round "${roundName}": expected ${count} games, found ${games.length}`);
      }

      for (let i = 0; i < games.length; i++) {
        const matchNumber = startMatch + i;
        const game = games[i];
        matchToGameId.set(matchNumber, game.id);

        // Update bracketSide and matchNumber immediately
        await prisma.game.update({
          where: { id: game.id },
          data: { matchNumber, bracketSide },
        });
        totalUpdated++;
      }
    }

    console.log(`  ✅ Assigned matchNumber + bracketSide to ${totalUpdated} games`);
  }

  await processDivision(catD1.id, 'Open Division 1', D1_ROUND_MAP);
  await processDivision(catD2.id, 'Open Division 2', D2_ROUND_MAP);
  await processDivision(catD3.id, 'Open Division 3', D3_ROUND_MAP);

  // Now wire up routing (winnerNextGameId, loserNextGameId, winnerSlot, loserSlot, seedTarget)
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

  // Also set bracketSide for group-stage divisions (Women, Master, Beginners)
  // These don't need routing but bracketSide = null is fine for group_knockout format
  // Just log their counts
  for (const name of ["Women's Division", 'Master Division', 'Beginners Division']) {
    const cat = catMap.get(name);
    if (cat) {
      const count = await prisma.game.count({ where: { categoryId: cat.id } });
      console.log(`ℹ️ ${name}: ${count} games (group_knockout format, no bracket routing needed)`);
    }
  }

  // Verify
  console.log('\n── Verification ──');
  const nullBracket = await prisma.game.count({
    where: {
      categoryId: { in: [catD1.id, catD2.id, catD3.id] },
      bracketSide: null,
    },
  });
  const nullMatch = await prisma.game.count({
    where: {
      categoryId: { in: [catD1.id, catD2.id, catD3.id] },
      matchNumber: null,
    },
  });
  console.log(`Games with null bracketSide: ${nullBracket}`);
  console.log(`Games with null matchNumber: ${nullMatch}`);

  if (nullBracket === 0 && nullMatch === 0) {
    console.log('\n🎉 All bracket games have been properly routed!');
  } else {
    console.log('\n⚠️ Some games still have null fields - check above for warnings.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
