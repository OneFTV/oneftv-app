import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import { generateKOTBSchedule, generateBracketSchedule } from "@/lib/scheduling"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        organizer: {
          select: { id: true },
        },
        players: {
          select: { id: true, userId: true },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      )
    }

    // Check authorization
    if (tournament.organizer.id !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only organizer can generate schedule" },
        { status: 403 }
      )
    }

    // Check status
    if (tournament.status !== "REGISTRATION") {
      return NextResponse.json(
        { error: "Tournament must be in registration status" },
        { status: 400 }
      )
    }

    // Check minimum players
    if (tournament.players.length < 2) {
      return NextResponse.json(
        { error: "Minimum 2 players required" },
        { status: 400 }
      )
    }

    const playerIds = tournament.players.map((p) => p.id)

    if (tournament.format === "KOTB") {
      // Generate KOTB schedule
      const schedule = generateKOTBSchedule(playerIds)

      // Create groups
      const groupsData = []
      for (let i = 0; i < schedule.groups.length; i++) {
        const group = await prisma.group.create({
          data: {
            tournamentId: params.id,
            name: `Group ${String.fromCharCode(65 + i)}`,
          },
        })
        groupsData.push(group)

        // Add players to group
        await prisma.groupPlayer.createMany({
          data: schedule.groups[i].map((playerId) => ({
            groupId: group.id,
            tournamentPlayerId: playerId,
          })),
        })
      }

      // Create rounds and games
      let roundNumber = 1
      for (const round of schedule.rounds) {
        const roundRecord = await prisma.round.create({
          data: {
            tournamentId: params.id,
            roundNumber,
          },
        })

        for (const match of round) {
          await prisma.game.create({
            data: {
              tournamentId: params.id,
              roundId: roundRecord.id,
              team1Id: match.player1Id,
              team2Id: match.player2Id,
              status: "SCHEDULED",
            },
          })
        }

        roundNumber++
      }
    } else if (tournament.format === "BRACKET") {
      // Generate bracket schedule
      const schedule = generateBracketSchedule(playerIds)

      // Create round 1 games
      const roundRecord = await prisma.round.create({
        data: {
          tournamentId: params.id,
          roundNumber: 1,
        },
      })

      for (const match of schedule.firstRound) {
        await prisma.game.create({
          data: {
            tournamentId: params.id,
            roundId: roundRecord.id,
            team1Id: match.player1Id,
            team2Id: match.player2Id,
            status: "SCHEDULED",
          },
        })
      }
    }

    // Update tournament status
    const updatedTournament = await prisma.tournament.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
      },
      include: {
        groups: true,
        games: {
          include: {
            team1: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            team2: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        rounds: {
          include: {
            games: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Tournament schedule generated successfully",
        data: updatedTournament,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Generate schedule error:", error)
    return NextResponse.json(
      { error: "Failed to generate tournament schedule" },
      { status: 500 }
    )
  }
}
