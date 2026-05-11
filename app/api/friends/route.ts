import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()

    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      select: {
        friend: {
          select: {
            id: true,
            username: true,
            name: true,
            shareStatsWithFriends: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const friends = friendships.map(f => ({
      id: f.friend.id,
      username: f.friend.username,
      displayName: f.friend.name,
      shareStatsWithFriends: f.friend.shareStatsWithFriends,
    }))

    return NextResponse.json({ friends })
  } catch (error) {
    return handleApiError(error)
  }
}
