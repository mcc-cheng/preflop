import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError } from '@/lib/api'

const SendRequestSchema = z.object({
  receiverId: z.string(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests, items: requests })
  } catch (error: any) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { receiverId } = SendRequestSchema.parse(body)

    if (receiverId === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    })
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        userId: user.id,
        friendId: receiverId
      }
    })

    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends' }, { status: 400 })
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: user.id }
        ],
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 })
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.id,
        receiverId: receiverId
      }
    })

    return NextResponse.json(friendRequest)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Request already exists' }, { status: 400 })
    }

    return handleApiError(error)
  }
}
