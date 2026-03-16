/**
 * Update NFA Miami 2026 tournament schedule configuration in production
 * - Set tournament startTime/endTime
 * - Set day assignments for categories
 * - Update tournament date times
 *
 * Run: railway run -- npx tsx scripts/update-miami-schedule-config.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏐 Updating NFA Miami 2026 schedule config...')

  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'Miami' } },
    include: {
      Category: {
        select: { id: true, name: true, divisionLabel: true, scheduledDay: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!tournament) {
    console.error('❌ Miami tournament not found!')
    return
  }

  console.log(`Found: ${tournament.name} (${tournament.id})`)
  console.log(`Categories: ${tournament.Category.map(c => c.name).join(', ')}`)

  // 1. Update tournament times
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      date: new Date('2026-04-18T13:00:00Z'),      // 9am Miami EDT
      endDate: new Date('2026-04-19T18:00:00Z'),    // 2pm Miami EDT
      startTime: '09:00',
      endTime: '18:00',
      numDays: 2,
    },
  })
  console.log('✅ Tournament times: 9am-6pm, 2 days')

  // 2. Set day assignments
  for (const cat of tournament.Category) {
    const isDivision = cat.divisionLabel && ['D1', 'D2', 'D3', 'D4'].includes(cat.divisionLabel)

    if (isDivision) {
      // Open Division → Day 1 (9am-6pm)
      await prisma.category.update({
        where: { id: cat.id },
        data: { scheduledDay: 1, dayStartTime: '09:00', dayEndTime: '18:00' },
      })
      console.log(`  ${cat.name} → Day 1 (9am-6pm)`)
    } else {
      // Non-division → Day 2 (9am-2pm)
      await prisma.category.update({
        where: { id: cat.id },
        data: { scheduledDay: 2, dayStartTime: '09:00', dayEndTime: '14:00' },
      })
      console.log(`  ${cat.name} → Day 2 (9am-2pm)`)
    }
  }

  console.log('\n✅ Done! Schedule config updated.')
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect())
