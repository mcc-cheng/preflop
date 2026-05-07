import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { usdToCents } from '@/lib/utils'
import { z } from 'zod'
import { handleApiError, jsonError, moneyAmountSchema, roomCodeSchema, roomUserSelect } from '@/lib/api'
import { Prisma } from '@prisma/client'

const CreateEventSchema = z.object({
  type: z.enum(['BUY_IN', 'REBUY', 'CASH_OUT']),
  amount: moneyAmountSchema.optional(), // in USD
  amountCents: z.number().int().positive().max(100_000_000).optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(data => data.amount !== undefined || data.amountCents !== undefined, {
  message: 'Amount is required',
})

async function getTableBalanceCents(roomId: string): Promise<number> {
  const events = await prisma.event.findMany({
    where: { roomId },
    select: { type: true, amount: true },
  })
  return events.reduce((sum, e) => {
    if (e.type === 'BUY_IN' || e.type === 'REBUY') return sum + e.amount
    if (e.type === 'CASH_OUT') return sum - e.amount
    return sum
  }, 0)
}

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
      include: { members: true }
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

    const isHost = room.hostId === user.id

    if (data.type === 'CASH_OUT') {
      const tableBalance = await getTableBalanceCents(room.id)
      if (amount > tableBalance) {
        const balanceUSD = (tableBalance / 100).toFixed(2)
        return jsonError(`Cash out amount exceeds table balance of $${balanceUSD}`, 400)
      }

      if (!isHost) {
        // Check for an existing pending request from this player
        const existingPending = await prisma.cashOutRequest.findFirst({
          where: { roomId: room.id, userId: user.id, status: 'PENDING' },
        })
        if (existingPending) {
          return jsonError('You already have a pending cash out request', 400)
        }

        const cashOutRequest = await prisma.cashOutRequest.create({
          data: {
            roomId: room.id,
            userId: user.id,
            amountCents: amount,
          },
          include: {
            user: { select: roomUserSelect },
          },
        })

        return NextResponse.json({ pending: true, request: cashOutRequest }, { status: 202 })
      }
    }

    // Host cash out and all non-CASH_OUT events go through directly
    const event = await prisma.event.create({
      data: {
        roomId: room.id,
        userId: user.id,
        type: data.type,
        amount,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      },
      include: {
        user: { select: roomUserSelect }
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
