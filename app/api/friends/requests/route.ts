import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

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

    return NextResponse.json(requests)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { receiverId } = SendRequestSchema.parse(body)

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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
