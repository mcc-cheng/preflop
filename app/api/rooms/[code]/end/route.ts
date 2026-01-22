import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { saveSettlement } from '@/lib/settlement'

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const user = await requireAuth()
    const code = params.code.toUpperCase()

    const room = await prisma.room.findUnique({
      where: { code }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.hostId !== user.id) {
      return NextResponse.json({ error: 'Only host can end room' }, { status: 403 })
    }

    if (room.endedAt) {
      return NextResponse.json({ error: 'Room already ended' }, { status: 400 })
    }

    // End the room and compute settlement
    await prisma.room.update({
      where: { id: room.id },
      data: { endedAt: new Date() }
    })

    const settlement = await saveSettlement(room.id)

    return NextResponse.json({ settlement })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
