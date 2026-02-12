import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

const createTournamentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  format: z.enum(["KOTB", "BRACKET"], {
    errorMap: () => ({ message: "Format must be KOTB or BRACKET" }),
  }),
  maxPlayers: z.number().int().min(4, "Minimum 4 players").max(256),
  startDate: z.string().datetime(),
  location: z.string().max(200).optional(),
  entranceFee: z.number().nonnegative().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const status = searchParams.get("status")
    const format = searchParams.get("format")
    const search = searchParams.get("search")

    // Build filters
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (format) {
      where.format = format
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get total count
    const total = await prisma.tournament.count({ where })

    // Get paginated tournaments
    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    const data = tournaments.map((t) => ({
      ...t,
      playerCount: t.players.length,
      players: undefined,
    }))

    return NextResponse.json(
      {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get tournaments error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const result = createTournamentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, description, format, maxPlayers, startDate, location, entranceFee } =
      result.data

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        format,
        maxPlayers,
        startDate: new Date(startDate),
        location,
        entranceFee,
        organizerId: session.user.id,
        status: "REGISTRATION",
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Tournament created successfully",
        data: tournament,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create tournament error:", error)
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    )
  }
}
