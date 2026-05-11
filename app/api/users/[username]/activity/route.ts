import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, jsonError } from '@/lib/api'

// Path param can be a userId (callers use the ID from GET /api/friends).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { username: userId } = await params

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, shareStatsWithFriends: true },
    })

    // Existence-leak prevention: return 404 whether not found or not friends
    if (!target) return jsonError('Not found', 404)

    const friendship = await prisma.friendship.findFirst({
      where: { userId: currentUser.id, friendId: target.id },
    })
    if (!friendship) return jsonError('Not found', 404)

    if (!target.shareStatsWithFriends) {
      return jsonError('This user has not shared their activity', 403)
    }

    const memberships = await prisma.roomMember.findMany({
      where: { userId: target.id },
      select: { roomId: true },
    })
    const roomIds = memberships.map(m => m.roomId)

    const rooms = await prisma.room.findMany({
      where: { id: { in: roomIds }, endedAt: { not: null } },
      select: {
        id: true,
        code: true,
        endedAt: true,
        events: {
          where: {
            userId: target.id,
            type: { in: ['BUY_IN', 'REBUY', 'CASH_OUT'] },
          },
          select: { type: true, amount: true },
        },
      },
      orderBy: { endedAt: 'desc' },
      take: 10,
    })

    const activity = rooms.map(room => {
      let buyIns = 0
      let cashOuts = 0
      for (const e of room.events) {
        if (e.type === 'BUY_IN' || e.type === 'REBUY') buyIns += e.amount
        else if (e.type === 'CASH_OUT') cashOuts += e.amount
      }
      return {
        roomCode: room.code,
        endedAt: room.endedAt,
        netCents: cashOuts - buyIns,
      }
    })

    return NextResponse.json({ activity })
  } catch (error) {
    return handleApiError(error)
  }
}
