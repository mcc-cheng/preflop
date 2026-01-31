import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const foundUser = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        profilePicture: true,
        stats: true
      }
    })

    if (!foundUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (foundUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 })
    }

    // Check if already friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        userId: user.id,
        friendId: foundUser.id
      }
    })

    // Check if friend request exists
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: foundUser.id },
          { senderId: foundUser.id, receiverId: user.id }
        ],
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      user: foundUser,
      isFriend: !!friendship,
      hasPendingRequest: !!friendRequest,
      requestSentByMe: friendRequest?.senderId === user.id
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
