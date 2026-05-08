import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, roomCodeSchema } from '@/lib/api'
import { requirePaymentSetup } from '@/lib/payment-eligibility'

const JoinRoomSchema = z.object({
  code: roomCodeSchema,
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await requirePaymentSetup(user.id)
    const body = await request.json()
    const { code } = JoinRoomSchema.parse(body)

    const room = await prisma.room.findFirst({
      where: { code: code.toUpperCase(), endedAt: null },
      include: {
        members: true
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found or has ended' }, { status: 404 })
    }

    const settings = room.settings as any
    const existingMember = room.members.find(m => m.userId === user.id)
    if (!existingMember && settings.maxPlayers && room.members.length >= settings.maxPlayers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    // Check if already a member
    if (!existingMember) {
      await prisma.roomMember.upsert({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId: user.id,
          },
        },
        update: {},
        create: {
          roomId: room.id,
          userId: user.id,
          role: 'PLAYER',
        },
      })
    }

    return NextResponse.json({
      roomCode: room.code,
      room: {
        id: room.id,
        code: room.code,
        settings: room.settings,
      },
    })
  } catch (error: any) {
    if (error?.message === 'PAYMENT_SETUP_REQUIRED') {
      return NextResponse.json(
        { error: 'Link at least two payment types before joining a room' },
        { status: 403 }
      )
    }

    return handleApiError(error)
  }
}
