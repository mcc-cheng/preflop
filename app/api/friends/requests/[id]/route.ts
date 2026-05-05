import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError } from '@/lib/api'

const RespondSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { action } = RespondSchema.parse(body)

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id }
    })

    if (!friendRequest || friendRequest.receiverId !== user.id) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    if (action === 'accept') {
      // Create friendship (bidirectional)
      await prisma.$transaction([
        prisma.friendship.create({
          data: {
            userId: user.id,
            friendId: friendRequest.senderId
          }
        }),
        prisma.friendship.create({
          data: {
            userId: friendRequest.senderId,
            friendId: user.id
          }
        }),
        prisma.friendRequest.update({
          where: { id },
          data: { status: 'ACCEPTED' }
        })
      ])

      return NextResponse.json({ success: true, action: 'accepted' })
    } else if (action === 'decline') {
      await prisma.friendRequest.update({
        where: { id },
        data: { status: 'DECLINED' }
      })

      return NextResponse.json({ success: true, action: 'declined' })
    }

  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 })
    }

    return handleApiError(error)
  }
}
