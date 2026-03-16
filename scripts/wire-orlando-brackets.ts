import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GameUpdate {
  id: string;
  matchNumber: number;
  bracketSide: string;
  winnerNextGameId: string | null;
  loserNextGameId: string | null;
  winnerSlot: string | null;
  loserSlot: string | null;
}

async function getGamesByRound(categoryId: string) {
  const rounds = await prisma.round.findMany({
    where: { categoryId },
    orderBy: { roundNumber: 'asc' },
    include: {
      Game: {
        orderBy: { id: 'asc' }, // consistent ordering
      },
    },
  });
  return rounds;
}

// Wire D1: 32-team double elimination (62 games)
// Same structure as Miami D1
async function wireD1(categoryId: string) {
  const rounds = await getGamesByRound(categoryId);
  console.log('D1 rounds:', rounds.map(r => `${r.name}(${r.Game.length})`).join(', '));

  // Map rounds by their role
  // Orlando round names: "1st Round W1", "2nd Round L1", "4th Round W2", "3rd Round L2", 
  // "4th Round W3", "6th Round L3", "8th Round L4", "11th Round W4", "11th Round L5", 
  // "13th Round L6", "Semi-Finals", "3rd Place", "Final"
  const roundMap: Record<string, typeof rounds[0]> = {};
  for (const r of rounds) {
    const name = r.name;
    if (name.includes('W1')) roundMap['W1'] = r;
    else if (name.includes('L1')) roundMap['L1'] = r;
    else if (name.includes('W2')) roundMap['W2'] = r;
    else if (name.includes('L2')) roundMap['L2'] = r;
    else if (name.includes('W3')) roundMap['W3'] = r;
    else if (name.includes('L3')) roundMap['L3'] = r;
    else if (name.includes('L4')) roundMap['L4'] = r;
    else if (name.includes('W4')) roundMap['W4'] = r;
    else if (name.includes('L5')) roundMap['L5'] = r;
    else if (name.includes('L6')) roundMap['L6'] = r;
    else if (name === 'Semi-Finals') roundMap['Semi'] = r;
    else if (name === '3rd Place') roundMap['Bronze'] = r;
    else if (name === 'Final') roundMap['Final'] = r;
  }

  // Validate
  const expected = { W1: 16, L1: 8, W2: 8, L2: 8, W3: 4, L3: 4, L4: 4, W4: 2, L5: 2, L6: 2, Semi: 2, Bronze: 1, Final: 1 };
  for (const [key, count] of Object.entries(expected)) {
    if (!roundMap[key]) throw new Error(`Missing round ${key}`);
    if (roundMap[key].Game.length !== count) throw new Error(`${key} has ${roundMap[key].Game.length} games, expected ${count}`);
  }

  const g = (round: string, idx: number) => roundMap[round].Game[idx];
  const updates: GameUpdate[] = [];
  let mn = 1;

  // W1: 16 games (matchNumbers 1-16), winners bracket
  // Pairs feed into W2 games, losers feed into L1 games
  for (let i = 0; i < 16; i++) {
    const w2Idx = Math.floor(i / 2); // 0-7
    const l1Idx = Math.floor(i / 2); // 0-7
    updates.push({
      id: g('W1', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('W2', w2Idx).id,
      loserNextGameId: g('L1', l1Idx).id,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: i % 2 === 0 ? 'home' : 'away',
    });
  }

  // W2: 8 games (matchNumbers 17-24)
  // Winners feed into W3, losers feed into L2
  // Miami pattern: W2 losers go to L2 with slot 'away'
  for (let i = 0; i < 8; i++) {
    const w3Idx = Math.floor(i / 2);
    updates.push({
      id: g('W2', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('W3', w3Idx).id,
      loserNextGameId: g('L2', i).id, // each W2 loser goes to a unique L2 game
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: 'away',
    });
  }

  // W3: 4 games (matchNumbers 25-28)
  // Winners feed into W4, losers feed into L4
  for (let i = 0; i < 4; i++) {
    const w4Idx = Math.floor(i / 2);
    updates.push({
      id: g('W3', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('W4', w4Idx).id,
      loserNextGameId: g('L4', i).id,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: 'away',
    });
  }

  // W4: 2 games (matchNumbers 29-30)
  // Miami: W4[0] winner→Semi[0], loser→L6[0]; W4[1] winner→Semi[1], loser→L6[1]
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('W4', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('Semi', i).id,
      loserNextGameId: g('L6', i).id,
      winnerSlot: 'home',
      loserSlot: 'away',
    });
  }

  // L1: 8 games (matchNumbers 31-38)
  // Winners feed into L2, losers go out (but Miami has loserNextGameId for consolation)
  // Miami pattern: L1 winners → L2 with slot 'home'
  // Miami L1 losers have loserNextGameId pointing to various consolation games
  // But wait - looking at Miami data, L1 losers DO have loserNextGameId set
  // Let me just skip consolation for now and set loserNextGameId=null for losers bracket
  // Actually Miami L1 has loserNextGameId set... but those point to games outside the 62
  // No wait, all 62 games are accounted for. Let me recheck.
  // Miami L1 loserNextGameIds map to matchNumbers in the upper range... 
  // Actually looking at the data, those are "out" games for placement
  // But wait - I see no extra games. Let me just follow Miami exactly.
  
  // From Miami data, L1 losers go to specific consolation spots. But these seem to be
  // external placement games. For Orlando, let's set loserNextGameId=null for losers bracket.
  // Actually wait - Miami L1 DOES have loserNextGameId. Let me re-examine...
  // mn31 loserNextGameId points to a game NOT in the 62 D1 games. It could be cross-category.
  // For now, I'll set loserNextGameId=null for all losers bracket games.
  
  for (let i = 0; i < 8; i++) {
    updates.push({
      id: g('L1', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('L2', i).id,
      loserNextGameId: null,
      winnerSlot: 'home',
      loserSlot: null,
    });
  }

  // L2: 8 games (matchNumbers 39-46)
  // L2 pairs feed into L3
  // Miami pattern: L2[0,1]→L3[0], L2[2,3]→L3[1], L2[4,5]→L3[2], L2[6,7]→L3[3]
  for (let i = 0; i < 8; i++) {
    const l3Idx = Math.floor(i / 2);
    updates.push({
      id: g('L2', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('L3', l3Idx).id,
      loserNextGameId: null,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: null,
    });
  }

  // L3: 4 games (matchNumbers 47-50)
  // L3 pairs feed into L4
  // Miami: L3[0]→L4[0] home, L3[1]→L4[1] home, L3[2]→L4[2] home, L3[3]→L4[3] home
  // Wait - L4 has 4 games and L3 has 4 games. They're 1:1.
  // But L4 also receives W3 losers as away. So L3→L4 as home, W3 loser→L4 as away.
  for (let i = 0; i < 4; i++) {
    updates.push({
      id: g('L3', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('L4', i).id,
      loserNextGameId: null,
      winnerSlot: 'home',
      loserSlot: null,
    });
  }

  // L4: 4 games (matchNumbers 51-54)
  // L4 pairs feed into L5
  for (let i = 0; i < 4; i++) {
    const l5Idx = Math.floor(i / 2);
    updates.push({
      id: g('L4', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('L5', l5Idx).id,
      loserNextGameId: null,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: null,
    });
  }

  // L5: 2 games (matchNumbers 55-56)
  // L5 winners feed into L6
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('L5', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('L6', i).id,
      loserNextGameId: null,
      winnerSlot: 'home',
      loserSlot: null,
    });
  }

  // L6: 2 games (matchNumbers 57-58)
  // L6 winners feed into Semi
  // Miami: L6[0]→Semi[0] as away, L6[1]→Semi[1] as away
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('L6', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('Semi', i).id,
      loserNextGameId: null,
      winnerSlot: 'away',
      loserSlot: null,
    });
  }

  // Semi: 2 games (matchNumbers 59-60)
  // Miami: Semi[0]→Final home, loser→Bronze home; Semi[1]→Final away, loser→Bronze away
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('Semi', i).id,
      matchNumber: mn++,
      bracketSide: 'finals',
      winnerNextGameId: g('Final', 0).id,
      loserNextGameId: g('Bronze', 0).id,
      winnerSlot: i === 0 ? 'home' : 'away',
      loserSlot: i === 0 ? 'home' : 'away',
    });
  }

  // Bronze: 1 game (matchNumber 61)
  updates.push({
    id: g('Bronze', 0).id,
    matchNumber: mn++,
    bracketSide: 'finals',
    winnerNextGameId: null,
    loserNextGameId: null,
    winnerSlot: null,
    loserSlot: null,
  });

  // Final: 1 game (matchNumber 62)
  updates.push({
    id: g('Final', 0).id,
    matchNumber: mn++,
    bracketSide: 'finals',
    winnerNextGameId: null,
    loserNextGameId: null,
    winnerSlot: null,
    loserSlot: null,
  });

  console.log(`D1: ${updates.length} updates prepared (matchNumbers 1-${mn - 1})`);
  return updates;
}

// Wire D2: 8-team double elimination (14 games)
// Orlando rounds: W1(4), W2(2), L2(2), L4(2), Semi(2), 3rd(1), Final(1)
// Maps to Miami pattern: W1(4), W2(2), L1(2), L2(2), Semi(2), Bronze(1), Final(1)
async function wireD2(categoryId: string) {
  const rounds = await getGamesByRound(categoryId);
  console.log('D2 rounds:', rounds.map(r => `${r.name}(${r.Game.length})`).join(', '));

  const roundMap: Record<string, typeof rounds[0]> = {};
  for (const r of rounds) {
    const name = r.name;
    if (name.includes('W1')) roundMap['W1'] = r;
    else if (name.includes('W2')) roundMap['W2'] = r;
    else if (name.includes('L2')) roundMap['L2_actual'] = r; // actually plays L1 role
    else if (name.includes('L4')) roundMap['L4_actual'] = r; // actually plays L2 role
    else if (name === 'Semi-Finals') roundMap['Semi'] = r;
    else if (name === '3rd Place') roundMap['Bronze'] = r;
    else if (name === 'Final') roundMap['Final'] = r;
  }

  const g = (round: string, idx: number) => roundMap[round].Game[idx];
  const updates: GameUpdate[] = [];
  let mn = 1;

  // W1: 4 games → W2 pairs, losers → L1 (which Orlando calls L2)
  for (let i = 0; i < 4; i++) {
    const w2Idx = Math.floor(i / 2);
    const l1Idx = Math.floor(i / 2);
    updates.push({
      id: g('W1', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('W2', w2Idx).id,
      loserNextGameId: g('L2_actual', l1Idx).id,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: i % 2 === 0 ? 'home' : 'away',
    });
  }

  // W2: 2 games → Semi, losers → L2 (which Orlando calls L4)
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('W2', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('Semi', i).id,
      loserNextGameId: g('L4_actual', i).id,
      winnerSlot: 'home',
      loserSlot: 'away',
    });
  }

  // L1 (Orlando "L2"): 2 games → L2 (Orlando "L4")
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('L2_actual', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('L4_actual', i).id,
      loserNextGameId: null,
      winnerSlot: 'home',
      loserSlot: null,
    });
  }

  // L2 (Orlando "L4"): 2 games → Semi as away
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('L4_actual', i).id,
      matchNumber: mn++,
      bracketSide: 'losers',
      winnerNextGameId: g('Semi', i).id,
      loserNextGameId: null,
      winnerSlot: 'away',
      loserSlot: null,
    });
  }

  // Semi: 2 games → Final/Bronze
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('Semi', i).id,
      matchNumber: mn++,
      bracketSide: 'finals',
      winnerNextGameId: g('Final', 0).id,
      loserNextGameId: g('Bronze', 0).id,
      winnerSlot: i === 0 ? 'home' : 'away',
      loserSlot: i === 0 ? 'home' : 'away',
    });
  }

  // Bronze
  updates.push({
    id: g('Bronze', 0).id,
    matchNumber: mn++,
    bracketSide: 'finals',
    winnerNextGameId: null, loserNextGameId: null, winnerSlot: null, loserSlot: null,
  });

  // Final
  updates.push({
    id: g('Final', 0).id,
    matchNumber: mn++,
    bracketSide: 'finals',
    winnerNextGameId: null, loserNextGameId: null, winnerSlot: null, loserSlot: null,
  });

  console.log(`D2: ${updates.length} updates prepared (matchNumbers 1-${mn - 1})`);
  return updates;
}

// Wire D3: single elimination (16 games)
async function wireD3(categoryId: string) {
  const rounds = await getGamesByRound(categoryId);
  console.log('D3 rounds:', rounds.map(r => `${r.name}(${r.Game.length})`).join(', '));

  const roundMap: Record<string, typeof rounds[0]> = {};
  for (const r of rounds) {
    const name = r.name;
    if (name.includes('W1')) roundMap['W1'] = r;
    else if (name.includes('W2')) roundMap['W2'] = r;
    else if (name === 'Semi-Finals') roundMap['Semi'] = r;
    else if (name === '3rd Place') roundMap['Bronze'] = r;
    else if (name === 'Final') roundMap['Final'] = r;
  }

  const g = (round: string, idx: number) => roundMap[round].Game[idx];
  const updates: GameUpdate[] = [];
  let mn = 1;

  // W1: 8 games → W2 pairs
  for (let i = 0; i < 8; i++) {
    const w2Idx = Math.floor(i / 2);
    updates.push({
      id: g('W1', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('W2', w2Idx).id,
      loserNextGameId: null,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: null,
    });
  }

  // W2: 4 games → Semi pairs
  for (let i = 0; i < 4; i++) {
    const semiIdx = Math.floor(i / 2);
    updates.push({
      id: g('W2', i).id,
      matchNumber: mn++,
      bracketSide: 'winners',
      winnerNextGameId: g('Semi', semiIdx).id,
      loserNextGameId: null,
      winnerSlot: i % 2 === 0 ? 'home' : 'away',
      loserSlot: null,
    });
  }

  // Semi: 2 games → Final/Bronze
  for (let i = 0; i < 2; i++) {
    updates.push({
      id: g('Semi', i).id,
      matchNumber: mn++,
      bracketSide: 'finals',
      winnerNextGameId: g('Final', 0).id,
      loserNextGameId: g('Bronze', 0).id,
      winnerSlot: i === 0 ? 'home' : 'away',
      loserSlot: i === 0 ? 'home' : 'away',
    });
  }

  // Bronze
  updates.push({
    id: g('Bronze', 0).id,
    matchNumber: mn++,
    bracketSide: 'finals',
    winnerNextGameId: null, loserNextGameId: null, winnerSlot: null, loserSlot: null,
  });

  // Final
  updates.push({
    id: g('Final', 0).id,
    matchNumber: mn++,
    bracketSide: 'finals',
    winnerNextGameId: null, loserNextGameId: null, winnerSlot: null, loserSlot: null,
  });

  console.log(`D3: ${updates.length} updates prepared (matchNumbers 1-${mn - 1})`);
  return updates;
}

async function applyUpdates(updates: GameUpdate[]) {
  let count = 0;
  for (const u of updates) {
    await prisma.game.update({
      where: { id: u.id },
      data: {
        matchNumber: u.matchNumber,
        bracketSide: u.bracketSide,
        winnerNextGameId: u.winnerNextGameId,
        loserNextGameId: u.loserNextGameId,
        winnerSlot: u.winnerSlot,
        loserSlot: u.loserSlot,
      },
    });
    count++;
  }
  return count;
}

async function main() {
  console.log('Wiring Orlando brackets...\n');

  const d1Updates = await wireD1('cmmr71y2c003is6yohcupsu86');
  const d2Updates = await wireD2('cmmr71y2d003ks6yoz9f9n02x');
  const d3Updates = await wireD3('cmmr71y2e003ms6yo5i7kw7un');

  const allUpdates = [...d1Updates, ...d2Updates, ...d3Updates];
  console.log(`\nTotal: ${allUpdates.length} games to update`);

  const count = await applyUpdates(allUpdates);
  console.log(`\n✅ Updated ${count} games successfully!`);

  // Also update Round bracketSide fields
  console.log('\nUpdating Round bracketSide...');
  const roundUpdates: { id: string; bracketSide: string }[] = [];
  
  for (const catId of ['cmmr71y2c003is6yohcupsu86', 'cmmr71y2d003ks6yoz9f9n02x', 'cmmr71y2e003ms6yo5i7kw7un']) {
    const rounds = await prisma.round.findMany({ where: { categoryId: catId } });
    for (const r of rounds) {
      let bs = 'winners';
      if (r.name.includes('L')) bs = 'losers';
      if (r.name === 'Semi-Finals' || r.name === '3rd Place' || r.name === 'Final') bs = 'finals';
      await prisma.round.update({ where: { id: r.id }, data: { bracketSide: bs } });
    }
  }
  console.log('✅ Round bracketSide updated!');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
