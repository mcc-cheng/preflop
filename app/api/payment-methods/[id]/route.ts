import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, paymentMethodSelect } from '@/lib/api'

const UpdatePaymentMethodSchema = z.object({
  type: z.enum(['VENMO', 'APPLE_PAY', 'BANK_TRANSFER', 'DEBIT_CARD', 'PAYPAL', 'ZELLE', 'CASH_APP']).optional(),
  identifier: z.string().trim().min(1).max(120).optional(),
  nickname: z.string().trim().max(80).optional().or(z.literal('')),
  isDefault: z.boolean().optional(),
}).strict()

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id }
    })

    if (!paymentMethod || paymentMethod.userId !== user.id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    await prisma.paymentMethod.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const data = UpdatePaymentMethodSchema.parse(body)

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id }
    })

    if (!paymentMethod || paymentMethod.userId !== user.id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // If setting as default, unset others
    const updated = await prisma.$transaction(async tx => {
      if (data.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        })
      }

      return tx.paymentMethod.update({
        where: { id },
        data: {
          ...data,
          nickname: data.nickname === '' ? null : data.nickname,
        },
        select: paymentMethodSelect,
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return handleApiError(error)
  }
}
