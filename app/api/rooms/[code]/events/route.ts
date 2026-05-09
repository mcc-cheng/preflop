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

// Used for multipart/form-data submissions (cash-out with image)
const MultipartEventSchema = z.object({
  type: z.enum(['BUY_IN', 'REBUY', 'CASH_OUT']),
  amount: z.string().optional(),
  amountCents: z.string().optional(),
}).refine(d => d.amount || d.amountCents, { message: 'Amount is required' })

const ChipImageSchema = z.string().min(1, 'A chip stack photo is required to cash out')

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

    // Parse body — multipart for submissions with images, JSON otherwise
    const contentType = request.headers.get('content-type') || ''
    let eventType: 'BUY_IN' | 'REBUY' | 'CASH_OUT'
    let amount: number
    let imageData: string | undefined
    let metadata: Record<string, unknown> | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const parsed = MultipartEventSchema.parse({
        type: formData.get('type'),
        amount: formData.get('amount') || undefined,
        amountCents: formData.get('amountCents') || undefined,
      })
      eventType = parsed.type
      amount = parsed.amountCents
        ? parseInt(parsed.amountCents, 10)
        : usdToCents(parseFloat(parsed.amount!))

      const imageFile = formData.get('image') as File | null
      if (imageFile && imageFile.size > 0) {
        if (imageFile.size > 5 * 1024 * 1024) {
          return jsonError('Image must be under 5 MB', 400)
        }
        const buf = Buffer.from(await imageFile.arrayBuffer())
        imageData = `data:${imageFile.type};base64,${buf.toString('base64')}`
      }
    } else {
      const body = await request.json()
      const data = CreateEventSchema.parse(body)
      eventType = data.type
      amount = data.amountCents ?? usdToCents(data.amount as number)
      metadata = data.metadata
    }

    const room = await prisma.room.findFirst({
      where: { code, endedAt: null },
      include: { members: true }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const isMember = room.members.some(m => m.userId === user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    const isHost = room.hostId === user.id

    if (!isHost && (eventType === 'BUY_IN' || eventType === 'REBUY')) {
      const existingPending = await prisma.buyInRequest.findFirst({
        where: { roomId: room.id, userId: user.id, status: 'PENDING' },
      })
      if (existingPending) {
        return jsonError('You already have a pending buy-in request', 400)
      }

      const buyInRequest = await prisma.buyInRequest.create({
        data: { roomId: room.id, userId: user.id, type: eventType, amountCents: amount },
        include: { user: { select: roomUserSelect } },
      })
      return NextResponse.json({ pending: true, request: buyInRequest }, { status: 202 })
    }

    if (eventType === 'CASH_OUT') {
      const tableBalance = await getTableBalanceCents(room.id)
      if (amount > tableBalance) {
        const balanceUSD = (tableBalance / 100).toFixed(2)
        return jsonError(`Cash out amount exceeds table balance of $${balanceUSD}`, 400)
      }

      if (!isHost) {
        // Require chip stack photo (Zod-validated)
        const imageResult = ChipImageSchema.safeParse(imageData)
        if (!imageResult.success) {
          return jsonError('A chip stack photo is required to cash out', 400)
        }

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
            imageData: imageResult.data,
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
        type: eventType,
        amount,
        metadata: metadata as Prisma.InputJsonValue | undefined
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
