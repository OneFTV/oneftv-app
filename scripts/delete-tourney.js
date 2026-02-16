const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const t = await p.tournament.findFirst({ where: { name: '2022 NFA Tour - 4th Stop Orlando, FL' } });
  if (!t) { console.log('Not found'); return; }
  const id = t.id;
  await p.game.deleteMany({ where: { round: { tournamentId: id } } });
  await p.round.deleteMany({ where: { tournamentId: id } });
  await p.category.deleteMany({ where: { tournamentId: id } });
  await p.tournament.delete({ where: { id } });
  console.log('Deleted');
})().then(() => p.$disconnect());
