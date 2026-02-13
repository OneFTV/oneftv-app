import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

// Force new client when schema changes (bumped after prisma generate)
const SCHEMA_VERSION = 2
const versionKey = globalThis as unknown as { _prismaSchemaVersion?: number }
if (versionKey._prismaSchemaVersion !== SCHEMA_VERSION) {
  versionKey._prismaSchemaVersion = SCHEMA_VERSION
  globalForPrisma.prisma = undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
