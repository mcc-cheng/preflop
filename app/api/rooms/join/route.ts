import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const JoinRoomSchema = z.object({
  code: z.string().length(6),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { code } = JoinRoomSchema.parse(body)

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
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

    // Check if already a member
    const existingMember = room.members.find(m => m.userId === user.id)
    if (!existingMember) {
      await prisma.roomMember.create({
        data: {
          roomId: room.id,
          userId: user.id,
          role: 'PLAYER'
        }
      })
    }

    return NextResponse.json({ roomCode: room.code })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
