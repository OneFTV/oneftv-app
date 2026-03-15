import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const tournaments = await p.tournament.findMany({
    include: {
      Category: { select: { id: true, name: true, divisionLabel: true, bracketType: true, _count: { select: { TeamRegistration: true, Game: true, TournamentPlayer: true } } } },
      User: { select: { email: true, name: true } },
      RefereeLink: { select: { id: true, token: true, courtNumber: true } }
    }
  });
  for (const t of tournaments) {
    console.log(`\n=== ${t.name} (${t.id}) ===`);
    console.log(`Status: ${t.status} | Organizer: ${t.User?.name} (${t.User?.email})`);
    console.log(`Referee links: ${t.RefereeLink.length}`);
    for (const c of t.Category) {
      console.log(`  ${c.name} [${c.divisionLabel || 'none'}] — Teams: ${c._count.TeamRegistration}, Games: ${c._count.Game}, Players: ${c._count.TournamentPlayer}`);
    }
  }
  await p.$disconnect();
}
run();
