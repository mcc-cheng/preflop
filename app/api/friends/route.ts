import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, statsSelect } from '@/lib/api'
import { z } from 'zod'

const SendFriendSchema = z.object({
  friendId: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
            stats: {
              select: statsSelect,
            }
          }
        }
      }
    })

    const friends = friendships.map(f => f.friend)
    return NextResponse.json({ friends, items: friends })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { friendId } = SendFriendSchema.parse(body)

    if (friendId === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
    }

    const receiver = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true },
    })
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        userId: user.id,
        friendId,
      },
    })
    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 })
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId },
          { senderId: friendId, receiverId: user.id },
        ],
        status: 'PENDING',
      },
    })
    if (existingRequest) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 })
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: friendId,
      },
    })

    return NextResponse.json({ request: friendRequest })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 })
    }

    return handleApiError(error)
  }
}
