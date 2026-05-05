import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getPlayerNets } from '@/lib/settlement'
import { handleApiError, roomCodeSchema, roomUserSelect } from '@/lib/api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode } = await params
    const code = roomCodeSchema.parse(rawCode)

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        host: {
          select: roomUserSelect,
        },
        members: {
          include: {
            user: {
              select: roomUserSelect,
            }
          }
        },
        events: {
          include: {
            user: {
              select: roomUserSelect,
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is a member
    const isMember = room.members.some(m => m.userId === user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    const settings = room.settings as any
    const netsByUser = new Map((await getPlayerNets(room.id)).map(n => [n.userId, n.netCents]))
    const players = room.members.map(member => ({
      user: member.user,
      net: netsByUser.get(member.userId) || 0,
    }))
    const events = room.events.map(event => ({
      ...event,
      amountCents: event.amount,
    }))

    return NextResponse.json({
      ...room,
      room: {
        id: room.id,
        code: room.code,
        name: settings.name,
        status: room.endedAt ? 'ENDED' : 'ACTIVE',
        defaultBuyInCents: Math.round((settings.defaultBuyIn || 0) * 100),
        settings,
        host: room.host,
        endedAt: room.endedAt,
        createdAt: room.createdAt,
      },
      players,
      events,
    })
  } catch (error: any) {
    return handleApiError(error)
  }
}
