import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const publicUserSelect = {
  id: true,
  username: true,
  name: true,
  profilePicture: true,
} satisfies Prisma.UserSelect

export const roomUserSelect = {
  ...publicUserSelect,
  email: true,
} satisfies Prisma.UserSelect

export const privateUserSelect = {
  ...roomUserSelect,
  phone: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const statsSelect = {
  gamesPlayed: true,
  hoursPlayed: true,
  totalWinnings: true,
  totalBuyIns: true,
  totalCashOuts: true,
  updatedAt: true,
} satisfies Prisma.UserStatsSelect

export const paymentMethodSelect = {
  id: true,
  type: true,
  identifier: true,
  nickname: true,
  isDefault: true,
  createdAt: true,
} satisfies Prisma.PaymentMethodSelect

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NP-Z2-9]{6}$/, 'Invalid room code')

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')

export const nameSchema = z.string().trim().min(1).max(80)
export const phoneSchema = z.string().trim().max(32).optional().or(z.literal(''))

export const moneyAmountSchema = z
  .number()
  .finite()
  .positive()
  .max(1_000_000)

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return jsonError(error.issues[0]?.message || 'Invalid request', 400)
  }

  if (error instanceof Error && error.message === 'Unauthorized') {
    return jsonError('Unauthorized', 401)
  }

  return jsonError('Something went wrong', 500)
}

