import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, jsonError, roomCodeSchema, roomUserSelect } from '@/lib/api'

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode, id } = await params
    const code = roomCodeSchema.parse(rawCode)
    const { action } = ActionSchema.parse(await request.json())

    const room = await prisma.room.findUnique({ where: { code } })

    if (!room) return jsonError('Room not found', 404)
    if (room.endedAt) return jsonError('Room has ended', 400)
    if (room.hostId !== user.id) return jsonError('Only the host can approve or reject cash out requests', 403)

    const cashOutRequest = await prisma.cashOutRequest.findUnique({
      where: { id },
      include: { user: { select: roomUserSelect } },
    })

    if (!cashOutRequest || cashOutRequest.roomId !== room.id) {
      return jsonError('Cash out request not found', 404)
    }

    if (cashOutRequest.status !== 'PENDING') {
      return jsonError('Request has already been resolved', 400)
    }

    if (action === 'reject') {
      const updated = await prisma.cashOutRequest.update({
        where: { id },
        data: { status: 'REJECTED', resolvedAt: new Date() },
        include: { user: { select: roomUserSelect } },
      })
      return NextResponse.json(updated)
    }

    // approve — balance check and event creation are atomic
    let updatedRequest: any
    try {
      updatedRequest = await prisma.$transaction(async tx => {
        const events = await tx.event.findMany({
          where: { roomId: room.id },
          select: { type: true, amount: true },
        })
        const tableBalance = events.reduce((sum, e) => {
          if (e.type === 'BUY_IN' || e.type === 'REBUY') return sum + e.amount
          if (e.type === 'CASH_OUT') return sum - e.amount
          return sum
        }, 0)

        if (cashOutRequest.amountCents > tableBalance) {
          const balanceUSD = (tableBalance / 100).toFixed(2)
          throw Object.assign(new Error('BALANCE_EXCEEDED'), { balanceUSD })
        }

        await tx.event.create({
          data: {
            roomId: room.id,
            userId: cashOutRequest.userId,
            type: 'CASH_OUT',
            amount: cashOutRequest.amountCents,
          },
        })

        return tx.cashOutRequest.update({
          where: { id },
          data: { status: 'APPROVED', resolvedAt: new Date() },
          include: { user: { select: roomUserSelect } },
        })
      }, { isolationLevel: 'Serializable' })
    } catch (err: any) {
      if (err.message === 'BALANCE_EXCEEDED') {
        return jsonError(`Cannot approve: amount exceeds current table balance of $${err.balanceUSD}`, 400)
      }
      throw err
    }

    return NextResponse.json(updatedRequest)
  } catch (error: any) {
    return handleApiError(error)
  }
}
