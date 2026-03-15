import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const tournaments = await p.tournament.findMany({ select: { id: true, name: true, status: true } });
  console.log('All tournaments:');
  tournaments.forEach(t => console.log(`  - ${t.name} (${t.id}) [${t.status}]`));
  await p.$disconnect();
}
run();
