import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn as (tx: Prisma.TransactionClient) => Promise<T>, {
    maxWait: 5000,
    timeout: 10000,
  })
}
