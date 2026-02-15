import { prisma } from '@/shared/database/prisma'

const profileSelect = {
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
} as const

export class AuthRepository {
  static async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }

  static async createUser(data: { email: string; name: string; password: string }) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    })
  }

  static async getUserProfile(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: profileSelect,
    })
  }

  static async updateUserProfile(id: string, data: Record<string, unknown>) {
    return prisma.user.update({
      where: { id },
      data: data as Parameters<typeof prisma.user.update>[0]['data'],
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
  }

  static async getUserStats(userId: string) {
    return prisma.tournamentPlayer.findMany({
      where: { userId },
      include: {
        tournament: { select: { name: true, status: true } },
      },
    })
  }
}
