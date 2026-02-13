import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"
import {
  generateKotBGroups,
  generateKotBGames,
  generateBracketGames,
  generateRoundRobinGames,
  scheduleGames,
} from "@/lib/scheduling"

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

    // Check minimum players
    if (tournament.players.length < 2) {
      return NextResponse.json(
        { error: "Minimum 2 players required" },
        { status: 400 }
      )
    }

    const playerIds = tournament.players.map((p) => p.userId)

    // Delete existing games and rounds for regeneration
    await prisma.game.deleteMany({ where: { tournamentId: params.id } })
    await prisma.round.deleteMany({ where: { tournamentId: params.id } })
    await prisma.group.deleteMany({ where: { tournamentId: params.id } })

    const format = tournament.format

    if (format === "king_of_the_beach") {
      // Generate KotB groups and games
      const groups = generateKotBGroups(playerIds, tournament.groupSize || 4)

      for (let i = 0; i < groups.length; i++) {
        const group = await prisma.group.create({
          data: {
            tournamentId: params.id,
            name: `Group ${String.fromCharCode(65 + i)}`,
          },
        })

        // Assign players to group
        for (const userId of groups[i]) {
          await prisma.tournamentPlayer.updateMany({
            where: {
              tournamentId: params.id,
              userId: userId,
            },
            data: {
              groupId: group.id,
            },
          })
        }

        // Generate games for this group
        const groupGames = generateKotBGames(groups[i])

        const round = await prisma.round.create({
          data: {
            name: `Group ${String.fromCharCode(65 + i)} - Round`,
            roundNumber: i + 1,
            tournamentId: params.id,
            type: "group",
          },
        })

        for (const game of groupGames) {
          await prisma.game.create({
            data: {
              tournamentId: params.id,
              groupId: group.id,
              roundId: round.id,
              courtNumber: 1,
              player1HomeId: game.team1[0] || null,
              player2HomeId: game.team1[1] || null,
              player1AwayId: game.team2[0] || null,
              player2AwayId: game.team2[1] || null,
              status: "scheduled",
            },
          })
        }
      }
    } else if (format === "bracket") {
      // Generate bracket games
      const rounds = generateBracketGames(playerIds)

      // Calculate total rounds needed for the full bracket
      const totalBracketRounds = Math.ceil(Math.log2(playerIds.length))

      for (let r = 0; r < rounds.length; r++) {
        // Determine round name and whether it's bestOf3
        const roundsFromEnd = totalBracketRounds - r
        let roundName = `Round ${r + 1}`
        let isBestOf3 = false

        if (roundsFromEnd === 1) {
          roundName = "Final"
          isBestOf3 = tournament.proLeague
        } else if (roundsFromEnd === 2) {
          roundName = "Semifinals"
          isBestOf3 = tournament.proLeague
        } else if (roundsFromEnd === 3) {
          roundName = "Quarterfinals"
        } else if (roundsFromEnd === 4) {
          roundName = "Round of 16"
        } else if (roundsFromEnd === 5) {
          roundName = "Round of 32"
        }

        const round = await prisma.round.create({
          data: {
            name: roundName,
            roundNumber: r + 1,
            tournamentId: params.id,
            type: "knockout",
            bestOf3: isBestOf3,
          },
        })

        for (const game of rounds[r]) {
          await prisma.game.create({
            data: {
              tournamentId: params.id,
              roundId: round.id,
              courtNumber: 1,
              player1HomeId: game.team1[0] || null,
              player2HomeId: game.team1[1] || null,
              player1AwayId: game.team2[0] || null,
              player2AwayId: game.team2[1] || null,
              status: "scheduled",
            },
          })
        }
      }
    } else if (format === "round_robin") {
      const games = generateRoundRobinGames(playerIds)

      const round = await prisma.round.create({
        data: {
          name: "Round Robin",
          roundNumber: 1,
          tournamentId: params.id,
          type: "group",
        },
      })

      for (const game of games) {
        await prisma.game.create({
          data: {
            tournamentId: params.id,
            roundId: round.id,
            courtNumber: 1,
            player1HomeId: game.team1[0] || null,
            player2HomeId: game.team1[1] || null,
            player1AwayId: game.team2[0] || null,
            player2AwayId: game.team2[1] || null,
            status: "scheduled",
          },
        })
      }
    }

    // Update tournament status
    await prisma.tournament.update({
      where: { id: params.id },
      data: { status: "in_progress" },
    })

    // Return updated tournament
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        groups: true,
        games: {
          include: {
            player1Home: { select: { id: true, name: true } },
            player2Home: { select: { id: true, name: true } },
            player1Away: { select: { id: true, name: true } },
            player2Away: { select: { id: true, name: true } },
          },
        },
        rounds: {
          include: { games: true },
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
