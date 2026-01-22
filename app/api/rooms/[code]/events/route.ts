import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { usdToCents } from '@/lib/utils'
import { z } from 'zod'

const CreateEventSchema = z.object({
  type: z.enum(['BUY_IN', 'REBUY', 'CASH_OUT', 'NOTE']),
  amount: z.number().positive(), // in USD
  metadata: z.any().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const user = await requireAuth()
    const code = params.code.toUpperCase()
    const body = await request.json()
    const data = CreateEventSchema.parse(body)

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
        amount: usdToCents(data.amount),
        metadata: data.metadata
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(event)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
