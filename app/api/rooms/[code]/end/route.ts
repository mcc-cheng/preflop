import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { computeSettlement } from '@/lib/settlement'
import { handleApiError, roomCodeSchema } from '@/lib/api'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode } = await params
    const code = roomCodeSchema.parse(rawCode)

    const settlement = await prisma.$transaction(async tx => {
      const room = await tx.room.findUnique({
        where: { code },
        include: {
          members: true,
          events: true,
        },
      })

      if (!room) {
        throw new Error('ROOM_NOT_FOUND')
      }

      if (room.hostId !== user.id) {
        throw new Error('FORBIDDEN')
      }

      if (room.endedAt) {
        throw new Error('ROOM_ALREADY_ENDED')
      }

      const endedAt = new Date()
      const update = await tx.room.updateMany({
        where: {
          id: room.id,
          endedAt: null,
        },
        data: { endedAt },
      })
      if (update.count !== 1) {
        throw new Error('ROOM_ALREADY_ENDED')
      }

      // Cancel any cash-out requests that were never resolved
      await tx.cashOutRequest.updateMany({
        where: { roomId: room.id, status: 'PENDING' },
        data: { status: 'REJECTED', resolvedAt: endedAt },
      })

      const netsByUser = new Map<string, number>()
      for (const event of room.events) {
        const current = netsByUser.get(event.userId) || 0
        if (event.type === 'BUY_IN' || event.type === 'REBUY') {
          netsByUser.set(event.userId, current - event.amount)
        } else if (event.type === 'CASH_OUT') {
          netsByUser.set(event.userId, current + event.amount)
        }
      }

      const nets = Array.from(netsByUser.entries()).map(([userId, netCents]) => ({
        userId,
        netCents,
      }))
      const edges = computeSettlement(nets)

      await tx.settlement.create({
        data: {
          roomId: room.id,
          edges: edges as any,
        },
      })

      const hoursPlayed = (endedAt.getTime() - room.createdAt.getTime()) / (1000 * 60 * 60)
      for (const member of room.members) {
        const playerEvents = room.events.filter(event => event.userId === member.userId)
        const buyIns = playerEvents
          .filter(event => event.type === 'BUY_IN' || event.type === 'REBUY')
          .reduce((sum, event) => sum + event.amount, 0)
        const cashOuts = playerEvents
          .filter(event => event.type === 'CASH_OUT')
          .reduce((sum, event) => sum + event.amount, 0)

        await tx.userStats.upsert({
          where: { userId: member.userId },
          create: {
            userId: member.userId,
            gamesPlayed: 1,
            hoursPlayed,
            totalWinnings: netsByUser.get(member.userId) || 0,
            totalBuyIns: buyIns,
            totalCashOuts: cashOuts,
          },
          update: {
            gamesPlayed: { increment: 1 },
            hoursPlayed: { increment: hoursPlayed },
            totalWinnings: { increment: netsByUser.get(member.userId) || 0 },
            totalBuyIns: { increment: buyIns },
            totalCashOuts: { increment: cashOuts },
          },
        })
      }

      return edges
    })

    return NextResponse.json({ settlement })
  } catch (error: any) {
    if (error?.message === 'ROOM_NOT_FOUND') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    if (error?.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only host can end room' }, { status: 403 })
    }
    if (error?.message === 'ROOM_ALREADY_ENDED') {
      return NextResponse.json({ error: 'Room already ended' }, { status: 400 })
    }

    return handleApiError(error)
  }
}
