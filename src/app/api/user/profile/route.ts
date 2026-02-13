import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        nationality: true,
        phone: true,
        street: true,
        number: true,
        complement: true,
        state: true,
        country: true,
        level: true,
        avatar: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        profile: {
          name: user.name,
          email: user.email,
          nationality: user.nationality || "",
          phone: user.phone || "",
          street: user.street || "",
          number: user.number || "",
          complement: user.complement || "",
          state: user.state || "",
          country: user.country || "",
          level: user.level || "Beginner",
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        nationality: body.nationality || null,
        phone: body.phone || null,
        street: body.street || null,
        number: body.number || null,
        complement: body.complement || null,
        state: body.state || null,
        country: body.country || null,
        level: body.level || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        nationality: true,
        phone: true,
        street: true,
        number: true,
        complement: true,
        state: true,
        country: true,
        level: true,
      },
    })

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        profile: updatedUser,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
