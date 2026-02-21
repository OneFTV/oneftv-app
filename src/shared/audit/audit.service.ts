interface AuditLogEntry {
  action: string
  entityType: string
  entityId: string
  userId?: string
  details?: unknown
  ipAddress?: string
}

export class AuditService {
  static async log(entry: AuditLogEntry): Promise<void> {
    // Placeholder: will create AuditLog records when model is added to Prisma
    console.log('[AUDIT]', JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    }))
  }
}
