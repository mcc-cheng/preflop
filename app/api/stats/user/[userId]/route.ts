import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getUserStats } from '@/lib/stats'
import { handleApiError, jsonError } from '@/lib/api'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await requireAuth()
    const { userId } = await params

    // Verify the target user shares stats with friends
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { shareStatsWithFriends: true },
    })

    if (!target) return jsonError('User not found', 404)

    if (!target.shareStatsWithFriends) {
      return jsonError('This user has not shared their stats', 403)
    }

    // Verify they are actually friends
    const friendship = await prisma.friendship.findFirst({
      where: { userId: currentUser.id, friendId: userId },
    })

    if (!friendship) return jsonError('Not friends with this user', 403)

    const stats = await getUserStats(userId)
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
