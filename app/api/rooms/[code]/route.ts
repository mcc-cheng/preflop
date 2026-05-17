import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getPlayerNets } from '@/lib/settlement'
import { handleApiError, roomCodeSchema, roomUserSelect, moneyAmountSchema } from '@/lib/api'
import { z } from 'zod'

const UpdateRoomSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  defaultBuyIn: moneyAmountSchema.optional(),
  entryFee: z.number().finite().min(0).max(1_000_000).optional().nullable(),
  blinds: z.string().trim().max(24).optional().or(z.literal('')),
  maxPlayers: z.number().int().min(2).max(20).optional().nullable(),
})

// Matches a Prisma CUID (starts with 'c', 25 chars) or a 6-char room code
const CUID_RE = /^c[a-z0-9]{24}$/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode } = await params

    // Build the where clause: accept a room ID (for past games) or an active room code.
    // page.tsx uppercases the URL param, so lowercase before using as a DB ID.
    const where = CUID_RE.test(rawCode)
      ? { id: rawCode.toLowerCase() }
      : { code: roomCodeSchema.parse(rawCode), endedAt: null as Date | null }

    const room = await prisma.room.findFirst({
      where,
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
        },
        cashOutRequests: {
          include: { user: { select: roomUserSelect } },
          orderBy: { createdAt: 'asc' },
        },
        buyInRequests: {
          include: { user: { select: roomUserSelect } },
          orderBy: { createdAt: 'asc' },
        },
        chipTypes: {
          orderBy: { denomination: 'asc' },
        },
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode } = await params
    const body = await request.json()
    const data = UpdateRoomSchema.parse(body)

    const room = await prisma.room.findFirst({
      where: { code: roomCodeSchema.parse(rawCode), endedAt: null },
      select: { id: true, hostId: true, settings: true },
    })

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    if (room.hostId !== user.id) return NextResponse.json({ error: 'Only the host can edit room settings' }, { status: 403 })

    const current = room.settings as any
    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        settings: {
          ...current,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.defaultBuyIn !== undefined && { defaultBuyIn: data.defaultBuyIn }),
          ...(data.entryFee !== undefined && { entryFee: data.entryFee ?? undefined }),
          ...(data.blinds !== undefined && { blinds: data.blinds || undefined }),
          ...(data.maxPlayers !== undefined && { maxPlayers: data.maxPlayers ?? undefined }),
        },
      },
      select: { id: true, settings: true },
    })

    return NextResponse.json({ settings: updated.settings })
  } catch (error: any) {
    return handleApiError(error)
  }
}
