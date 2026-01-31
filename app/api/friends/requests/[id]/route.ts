import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { action } = body // 'accept' or 'decline'

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: params.id }
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
          where: { id: params.id },
          data: { status: 'ACCEPTED' }
        })
      ])

      return NextResponse.json({ success: true, action: 'accepted' })
    } else if (action === 'decline') {
      await prisma.friendRequest.update({
        where: { id: params.id },
        data: { status: 'DECLINED' }
      })

      return NextResponse.json({ success: true, action: 'declined' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
