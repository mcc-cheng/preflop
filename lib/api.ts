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

// ── Payment identifier validation ────────────────────────────────────

function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)
}

function isValidPhone(val: string): boolean {
  // 7-20 digits after stripping formatting characters
  const digits = val.replace(/[\s\-().+]/g, '')
  return /^\d{7,20}$/.test(digits)
}

/**
 * Returns a validation error message, or null if the identifier is valid for the given type.
 * Rules match each platform's published account handle requirements.
 */
export function validatePaymentIdentifier(type: string, identifier: string): string | null {
  const v = identifier.trim()

  switch (type) {
    case 'VENMO':
      // 5-30 chars; letters, numbers, periods, hyphens; must start/end with letter or number
      if (!/^[a-zA-Z0-9][a-zA-Z0-9.\-]{3,28}[a-zA-Z0-9]$/.test(v)) {
        return 'Venmo username must be 5–30 characters using letters, numbers, periods, or hyphens, and must start and end with a letter or number'
      }
      return null

    case 'CASH_APP': {
      // Optional leading $; then 1-20 chars starting with a letter, letters/numbers/underscores
      const handle = v.startsWith('$') ? v.slice(1) : v
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,19}$/.test(handle)) {
        return 'Cash App $Cashtag must start with a letter and be 1–20 characters (letters, numbers, underscores)'
      }
      return null
    }

    case 'ZELLE':
      if (!isValidEmail(v) && !isValidPhone(v)) {
        return 'Zelle requires a valid email address or phone number'
      }
      return null

    case 'APPLE_PAY':
      if (!isValidEmail(v) && !isValidPhone(v)) {
        return 'Apple Pay requires the email or phone number linked to your Apple ID'
      }
      return null

    case 'PAYPAL':
      // PayPal.me username: 1-20 chars, letters/numbers/hyphens/periods; or an email address
      if (!/^[a-zA-Z0-9][a-zA-Z0-9.\-]{0,19}$/.test(v) && !isValidEmail(v)) {
        return 'PayPal requires a username (1–20 chars, letters/numbers/hyphens/periods) or email address'
      }
      return null

    case 'BANK_TRANSFER':
      if (v.length < 2 || v.length > 120) {
        return 'Bank transfer info must be 2–120 characters'
      }
      return null

    case 'DEBIT_CARD':
      if (!/^\d{4}$/.test(v)) {
        return 'Enter the last 4 digits of your debit card number'
      }
      return null

    default:
      return null
  }
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

