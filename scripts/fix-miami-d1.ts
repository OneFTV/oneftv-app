import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const tId = 'cmmr7bcnn0001zt839qjebwtv';
  
  // Check if Open Division 1 exists
  const existing = await p.category.findFirst({ where: { tournamentId: tId, name: 'Open Division 1' } });
  if (existing) { console.log('Open Division 1 already exists'); await p.$disconnect(); return; }
  
  // Get reference from Orlando
  const orlando = await p.tournament.findFirst({ where: { name: { contains: 'Orlando' } } });
  if (!orlando) { console.log('Orlando not found'); return; }
  
  const orlandoD1 = await p.category.findFirst({ where: { tournamentId: orlando.id, name: 'Open Division 1' } });
  if (!orlandoD1) { console.log('Orlando D1 not found'); return; }
  
  // Create D1 for Miami
  const d1 = await p.category.create({
    data: {
      tournamentId: tId,
      name: 'Open Division 1',
      format: orlandoD1.format,
      gender: orlandoD1.gender,
      skillLevel: orlandoD1.skillLevel,
      maxTeams: orlandoD1.maxTeams,
      pointsPerSet: orlandoD1.pointsPerSet,
      numSets: orlandoD1.numSets,
      sortOrder: 0,
      status: 'draft',
    }
  });
  console.log(`Created Open Division 1: ${d1.id}`);
  
  // Copy team registrations from Orlando D1
  const orlandoTeams = await p.game.findMany({
    where: { tournamentId: orlando.id, categoryId: orlandoD1.id, Round: { name: 'W1' } },
    select: { homeTeamId: true, awayTeamId: true },
    orderBy: { matchNumber: 'asc' }
  });
  
  // Get unique team registrations from Orlando
  const orlandoTRs = await p.teamRegistration.findMany({
    where: { categoryId: orlandoD1.id },
    include: { player1: true, player2: true }
  });
  
  // If no team regs, extract from games
  if (orlandoTRs.length === 0) {
    console.log('No team regs in Orlando D1, extracting from games...');
    const allGames = await p.game.findMany({
      where: { tournamentId: orlando.id, categoryId: orlandoD1.id },
      select: { homeTeamId: true, awayTeamId: true }
    });
    const teamIds = new Set<string>();
    allGames.forEach(g => { if (g.homeTeamId) teamIds.add(g.homeTeamId); if (g.awayTeamId) teamIds.add(g.awayTeamId); });
    
    // These are TournamentPlayer IDs used as team refs
    // Copy TournamentPlayers from Orlando D1 to Miami D1
    const orlandoPlayers = await p.tournamentPlayer.findMany({ where: { tournamentId: orlando.id, categoryId: orlandoD1.id } });
    console.log(`Found ${orlandoPlayers.length} players in Orlando D1`);
    
    // Find matching users and create TournamentPlayers for Miami
    for (const op of orlandoPlayers) {
      await p.tournamentPlayer.create({
        data: {
          tournamentId: tId,
          userId: op.userId,
          categoryId: d1.id,
          seed: op.seed,
          points: 0,
          wins: 0,
          losses: 0,
          pointDiff: 0,
          status: 'registered',
        }
      });
    }
    console.log(`Created ${orlandoPlayers.length} tournament players for Miami D1`);
    
    // Create team registrations (pairs from Orlando games W1)
    const w1Round = await p.round.findFirst({ where: { categoryId: orlandoD1.id, name: 'W1' } });
    if (w1Round) {
      const w1Games = await p.game.findMany({
        where: { roundId: w1Round.id },
        orderBy: { matchNumber: 'asc' }
      });
      
      // homeTeamId/awayTeamId in Orlando refer to TournamentPlayer IDs
      // We need to create TeamRegistrations for Miami
      let seed = 1;
      for (const g of w1Games) {
        if (g.homeTeamId) {
          const homeTP = await p.tournamentPlayer.findUnique({ where: { id: g.homeTeamId }, include: { User: true } });
          if (homeTP) {
            // Find this user's Miami TP
            const miamiTP = await p.tournamentPlayer.findFirst({ where: { tournamentId: tId, userId: homeTP.userId, categoryId: d1.id } });
            // We'll create TeamRegistrations after
          }
        }
      }
    }
  } else {
    // Copy team regs
    for (const tr of orlandoTRs) {
      await p.teamRegistration.create({
        data: {
          categoryId: d1.id,
          player1Id: tr.player1Id,
          player2Id: tr.player2Id,
          seed: tr.seed,
          status: 'confirmed',
          teamName: tr.teamName,
        }
      });
    }
    console.log(`Copied ${orlandoTRs.length} team registrations`);
  }
  
  // Verify
  const cats = await p.category.findMany({ where: { tournamentId: tId }, orderBy: { sortOrder: 'asc' }, include: { _count: { select: { TeamRegistration: true, TournamentPlayer: true } } } });
  for (const c of cats) {
    console.log(`  ${c.name} — Teams: ${c._count.TeamRegistration}, Players: ${c._count.TournamentPlayer}`);
  }
  
  await p.$disconnect();
}
run();
