import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const user = await requireAuth()
    const code = params.code.toUpperCase()

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        host: true,
        members: {
          include: {
            user: true
          }
        },
        events: {
          include: {
            user: true
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

    return NextResponse.json(room)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
