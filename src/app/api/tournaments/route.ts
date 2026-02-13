import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

const createTournamentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  format: z.string(),
  maxPlayers: z.number().int().min(2, "Minimum 2 players").max(256).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  courts: z.number().int().optional(),
  days: z.number().int().optional(),
  hoursPerDay: z.number().optional(),
  avgGameDuration: z.number().int().optional(),
  pointsPerSet: z.number().int().optional(),
  sets: z.number().int().optional(),
  groupSize: z.number().int().optional(),
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
    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }
    if (format) {
      where.format = format
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
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
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    })

    const data = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      location: t.location,
      city: t.city,
      state: t.state,
      country: t.country,
      startDate: t.date,
      endDate: t.endDate,
      format: t.format,
      status: t.status,
      maxPlayers: t.maxPlayers,
      registeredPlayers: t.players.length,
      courts: t.numCourts,
      organizerId: t.organizerId,
      organizerName: t.organizer.name,
    }))

    return NextResponse.json(data, { status: 200 })
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

    const d = result.data

    const tournament = await prisma.tournament.create({
      data: {
        name: d.name,
        description: d.description,
        format: d.format,
        maxPlayers: d.maxPlayers ?? 16,
        date: d.startDate ? new Date(d.startDate) : new Date(),
        endDate: d.endDate ? new Date(d.endDate) : undefined,
        location: d.location ?? "",
        city: d.city,
        state: d.state,
        country: d.country,
        numCourts: d.courts ?? 1,
        numDays: d.days ?? 1,
        hoursPerDay: d.hoursPerDay ?? 8,
        avgGameMinutes: d.avgGameDuration ?? 20,
        pointsPerSet: d.pointsPerSet ?? 18,
        numSets: d.sets ?? 1,
        groupSize: d.groupSize ?? 4,
        organizerId: session.user.id,
        status: "registration",
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
        id: tournament.id,
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
