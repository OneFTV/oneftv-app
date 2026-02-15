import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterData = z.infer<typeof registerSchema>

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nationality: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Pro']).nullable().optional(),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
