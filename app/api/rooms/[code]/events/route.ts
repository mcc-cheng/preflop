import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { usdToCents } from '@/lib/utils'
import { z } from 'zod'
import { handleApiError, moneyAmountSchema, roomCodeSchema, roomUserSelect } from '@/lib/api'
import { Prisma } from '@prisma/client'

const CreateEventSchema = z.object({
  type: z.enum(['BUY_IN', 'REBUY', 'CASH_OUT']),
  amount: moneyAmountSchema.optional(), // in USD
  amountCents: z.number().int().positive().max(100_000_000).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(data => data.amount !== undefined || data.amountCents !== undefined, {
  message: 'Amount is required',
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode } = await params
    const code = roomCodeSchema.parse(rawCode)
    const body = await request.json()
    const data = CreateEventSchema.parse(body)
    const amount = data.amountCents ?? usdToCents(data.amount as number)

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        members: true
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.endedAt) {
      return NextResponse.json({ error: 'Room has ended' }, { status: 400 })
    }

    const isMember = room.members.some(m => m.userId === user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    const event = await prisma.event.create({
      data: {
        roomId: room.id,
        userId: user.id,
        type: data.type,
        amount,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      },
      include: {
        user: {
          select: roomUserSelect,
        }
      }
    })

    return NextResponse.json({
      ...event,
      amountCents: event.amount,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
