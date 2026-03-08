import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/database/prisma'
import { AppError } from '@/shared/api/errors'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      select: {
        numCourts: true,
        numDays: true,
        hoursPerDay: true,
        avgGameMinutes: true,
        numReferees: true,
        groupSize: true,
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const { numCourts, numDays, hoursPerDay, avgGameMinutes, numReferees, groupSize } = tournament

    const maxSimultaneousGames = Math.min(numCourts, numReferees)
    const gamesPerDay = maxSimultaneousGames * Math.floor((hoursPerDay * 60) / avgGameMinutes)
    const totalSlots = gamesPerDay * numDays

    // Bracket: maxTeams = largest power of 2 where (teams - 1) <= totalSlots
    // A single-elimination bracket with N teams needs N-1 games
    const bracketMaxTeams = Math.pow(2, Math.floor(Math.log2(totalSlots + 1)))

    // Round robin: n*(n-1)/2 <= totalSlots => find max n
    let rrMax = 2
    while ((rrMax * (rrMax - 1)) / 2 <= totalSlots) {
      rrMax++
    }
    rrMax-- // back off one

    // Group + knockout: groups of `groupSize`, then single-elim knockout
    // Each group plays groupSize*(groupSize-1)/2 games
    // Then top 2 per group go to knockout
    const gamesPerGroup = (groupSize * (groupSize - 1)) / 2
    // Try increasing number of groups
    let gkMax = 0
    for (let numGroups = 1; numGroups <= 64; numGroups++) {
      const groupGames = numGroups * gamesPerGroup
      const knockoutTeams = numGroups * 2 // top 2 per group
      // Need power of 2 for knockout
      const actualKnockout = Math.pow(2, Math.ceil(Math.log2(knockoutTeams)))
      const knockoutGames = actualKnockout - 1
      if (groupGames + knockoutGames <= totalSlots) {
        gkMax = numGroups * groupSize
      } else {
        break
      }
    }

    return NextResponse.json({
      data: {
        maxSimultaneousGames,
        totalSlots,
        maxTeamsByFormat: {
          bracket: bracketMaxTeams,
          round_robin: rrMax,
          group_knockout: gkMax,
        },
        params: { numCourts, numDays, hoursPerDay, avgGameMinutes, numReferees, groupSize },
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Capacity calc error:', error)
    return NextResponse.json({ error: 'Failed to calculate capacity' }, { status: 500 })
  }
}
