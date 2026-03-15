import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const t = await p.tournament.findFirst({ where: { name: { contains: 'Miami' } } });
  if (!t) { console.log('Not found'); return; }
  console.log(`Resetting ${t.name} (${t.id})`);
  
  // Delete games
  const gd = await p.game.deleteMany({ where: { tournamentId: t.id } });
  console.log(`Deleted ${gd.count} games`);
  
  // Delete rounds
  const rd = await p.round.deleteMany({ where: { categoryId: { in: (await p.category.findMany({ where: { tournamentId: t.id }, select: { id: true } })).map(c => c.id) } } });
  console.log(`Deleted ${rd.count} rounds`);
  
  // Delete schedule slots
  const sd = await p.scheduleSlot.deleteMany({ where: { categoryId: { in: (await p.category.findMany({ where: { tournamentId: t.id }, select: { id: true } })).map(c => c.id) } } });
  console.log(`Deleted ${sd.count} schedule slots`);
  
  // Delete referee links
  const rl = await p.refereeLink.deleteMany({ where: { tournamentId: t.id } });
  console.log(`Deleted ${rl.count} referee links`);
  
  // Reset cascade-generated categories (remove divisionLabel, seedingSource etc)
  await p.category.updateMany({ where: { tournamentId: t.id }, data: { divisionLabel: null, seedingSource: null, seedingFromCategoryId: null } });
  
  // Delete any cascade-created categories (ones with " - Division" in name)
  const cascadeCats = await p.category.findMany({ where: { tournamentId: t.id, name: { contains: ' - Division' } } });
  for (const c of cascadeCats) {
    await p.tournamentPlayer.deleteMany({ where: { categoryId: c.id } });
    await p.teamRegistration.deleteMany({ where: { categoryId: c.id } });
    await p.category.delete({ where: { id: c.id } });
    console.log(`Deleted cascade category: ${c.name}`);
  }
  
  // Reset tournament status
  await p.tournament.update({ where: { id: t.id }, data: { status: 'draft', openDivisionCount: 0 } });
  console.log('Tournament reset to draft');
  
  // Verify
  const cats = await p.category.findMany({ where: { tournamentId: t.id }, include: { _count: { select: { TeamRegistration: true, Game: true, TournamentPlayer: true } } } });
  for (const c of cats) {
    console.log(`  ${c.name} — Teams: ${c._count.TeamRegistration}, Games: ${c._count.Game}, Players: ${c._count.TournamentPlayer}`);
  }
  
  await p.$disconnect();
}
run();
