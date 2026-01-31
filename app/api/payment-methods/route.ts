import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const CreatePaymentMethodSchema = z.object({
  type: z.enum(['VENMO', 'APPLE_PAY', 'BANK_TRANSFER', 'DEBIT_CARD', 'PAYPAL', 'ZELLE', 'CASH_APP']),
  identifier: z.string().min(1),
  nickname: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(paymentMethods)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = CreatePaymentMethodSchema.parse(body)

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        ...data
      }
    })

    return NextResponse.json(paymentMethod)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
