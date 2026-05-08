import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, jsonError, paymentMethodSelect, validatePaymentIdentifier } from '@/lib/api'

// type is intentionally excluded — it cannot be changed after creation
const UpdatePaymentMethodSchema = z.object({
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
      return jsonError('Payment method not found', 404)
    }

    await prisma.paymentMethod.delete({ where: { id } })
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
      return jsonError('Payment method not found', 404)
    }

    // Validate the new identifier against the method's existing (immutable) type
    if (data.identifier !== undefined) {
      const identifierError = validatePaymentIdentifier(paymentMethod.type, data.identifier)
      if (identifierError) {
        return jsonError(identifierError, 400)
      }
    }

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
          ...(data.identifier !== undefined && { identifier: data.identifier.trim() }),
          ...(data.nickname !== undefined && { nickname: data.nickname === '' ? null : data.nickname }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
        select: paymentMethodSelect,
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return handleApiError(error)
  }
}
