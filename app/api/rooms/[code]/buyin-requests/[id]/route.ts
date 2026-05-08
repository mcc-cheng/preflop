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

    const room = await prisma.room.findFirst({ where: { code, endedAt: null } })
    if (!room) return jsonError('Room not found', 404)
    if (room.hostId !== user.id) return jsonError('Only the host can approve or reject buy-in requests', 403)

    const buyInRequest = await prisma.buyInRequest.findUnique({
      where: { id },
      include: { user: { select: roomUserSelect } },
    })

    if (!buyInRequest || buyInRequest.roomId !== room.id) return jsonError('Buy-in request not found', 404)
    if (buyInRequest.status !== 'PENDING') return jsonError('Request has already been resolved', 400)

    if (action === 'reject') {
      const updated = await prisma.buyInRequest.update({
        where: { id },
        data: { status: 'REJECTED', resolvedAt: new Date() },
        include: { user: { select: roomUserSelect } },
      })
      return NextResponse.json(updated)
    }

    // Approve — create the event atomically
    const updatedRequest = await prisma.$transaction(async tx => {
      await tx.event.create({
        data: {
          roomId: room.id,
          userId: buyInRequest.userId,
          type: buyInRequest.type,
          amount: buyInRequest.amountCents,
        },
      })
      return tx.buyInRequest.update({
        where: { id },
        data: { status: 'APPROVED', resolvedAt: new Date() },
        include: { user: { select: roomUserSelect } },
      })
    }, { isolationLevel: 'Serializable' })

    return NextResponse.json(updatedRequest)
  } catch (error: any) {
    return handleApiError(error)
  }
}
