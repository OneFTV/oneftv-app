/**
 * NFA Miami 2026 Data Fix
 * - Delete Amateur category and all linked data (games, rounds, tournament players, team registrations)
 * - Rename "Professional" category to "Open" with NFA settings (maxTeams: 96, proLeague: true)
 *
 * Usage: npx tsx scripts/fix-nfa-miami-2026.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find NFA Miami 2026 tournament
  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'NFA Miami' } },
    include: {
      categories: {
        include: {
          _count: { select: { players: true, games: true, rounds: true, teamRegistrations: true } },
        },
      },
    },
  })

  if (!tournament) {
    console.error('Tournament "NFA Miami" not found')
    process.exit(1)
  }

  console.log(`Found tournament: ${tournament.name} (${tournament.id})`)
  console.log(`Categories: ${tournament.categories.map(c => c.name).join(', ')}`)

  // Find Amateur category
  const amateurCat = tournament.categories.find(
    c => c.name.toLowerCase().includes('amateur')
  )

  // Find Professional category
  const proCat = tournament.categories.find(
    c => c.name.toLowerCase().includes('professional') || c.name.toLowerCase() === 'pro'
  )

  // --- Delete Amateur category and all linked data ---
  if (amateurCat) {
    console.log(`\nDeleting Amateur category "${amateurCat.name}" (${amateurCat.id})`)
    console.log(`  Players: ${amateurCat._count.players}, Games: ${amateurCat._count.games}, Rounds: ${amateurCat._count.rounds}, Teams: ${amateurCat._count.teamRegistrations}`)

    // Delete in order respecting FK constraints
    await prisma.game.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted games')

    await prisma.round.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted rounds')

    await prisma.tournamentPlayer.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted tournament players')

    await prisma.teamRegistration.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted team registrations')

    await prisma.scheduleSlot.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted schedule slots')

    await prisma.waitlistEntry.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted waitlist entries')

    await prisma.pricingLot.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted pricing lots')

    await prisma.group.deleteMany({ where: { categoryId: amateurCat.id } })
    console.log('  Deleted groups')

    await prisma.category.delete({ where: { id: amateurCat.id } })
    console.log('  Deleted Amateur category')
  } else {
    console.log('\nNo Amateur category found — skipping deletion')
  }

  // --- Rename Professional to Open ---
  if (proCat) {
    console.log(`\nRenaming "${proCat.name}" → "Open"`)
    await prisma.category.update({
      where: { id: proCat.id },
      data: {
        name: 'Open',
        maxTeams: 96,
        proLeague: true,
      },
    })
    console.log('  Updated: name=Open, maxTeams=96, proLeague=true')
  } else {
    console.log('\nNo Professional category found — skipping rename')
  }

  // --- Verify final state ---
  const updated = await prisma.tournament.findUnique({
    where: { id: tournament.id },
    include: {
      categories: {
        include: {
          _count: { select: { players: true, games: true, teamRegistrations: true } },
        },
      },
    },
  })

  console.log('\n--- Final State ---')
  console.log(`Tournament: ${updated!.name}`)
  for (const cat of updated!.categories) {
    console.log(`  ${cat.name}: ${cat._count.players} players, ${cat._count.games} games, ${cat._count.teamRegistrations} teams | maxTeams=${cat.maxTeams} proLeague=${cat.proLeague}`)
  }

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
