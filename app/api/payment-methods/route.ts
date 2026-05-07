import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, jsonError, paymentMethodSelect, validatePaymentIdentifier } from '@/lib/api'

const CreatePaymentMethodSchema = z.object({
  type: z.enum(['VENMO', 'APPLE_PAY', 'BANK_TRANSFER', 'DEBIT_CARD', 'PAYPAL', 'ZELLE', 'CASH_APP']),
  identifier: z.string().trim().min(1).max(120),
  nickname: z.string().trim().max(80).optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: user.id },
      select: paymentMethodSelect,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ paymentMethods })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = CreatePaymentMethodSchema.parse(body)

    const identifierError = validatePaymentIdentifier(data.type, data.identifier)
    if (identifierError) {
      return jsonError(identifierError, 400)
    }

    const paymentMethod = await prisma.$transaction(async tx => {
      if (data.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        })
      }

      return tx.paymentMethod.create({
        data: {
          userId: user.id,
          type: data.type,
          identifier: data.identifier.trim(),
          nickname: data.nickname || null,
          isDefault: data.isDefault ?? false,
        },
        select: paymentMethodSelect,
      })
    })

    return NextResponse.json(paymentMethod)
  } catch (error: any) {
    return handleApiError(error)
  }
}
