import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, jsonError } from '@/lib/api'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const friendRequest = await prisma.friendRequest.findUnique({ where: { id } })

    if (!friendRequest || friendRequest.receiverId !== user.id) {
      return jsonError('Request not found', 404)
    }
    if (friendRequest.status !== 'PENDING') {
      return jsonError('Request already processed', 400)
    }

    const [, newFriend] = await prisma.$transaction([
      prisma.friendship.create({ data: { userId: user.id, friendId: friendRequest.senderId } }),
      prisma.friendship.create({ data: { userId: friendRequest.senderId, friendId: user.id } }),
      prisma.friendRequest.update({ where: { id }, data: { status: 'ACCEPTED' } }),
    ])

    const friend = await prisma.user.findUnique({
      where: { id: friendRequest.senderId },
      select: { id: true, username: true, name: true, shareStatsWithFriends: true },
    })

    return NextResponse.json({
      id: friend!.id,
      username: friend!.username,
      displayName: friend!.name,
      shareStatsWithFriends: friend!.shareStatsWithFriends,
    })
  } catch (error: any) {
    if (error?.code === 'P2002') return jsonError('Already friends', 400)
    return handleApiError(error)
  }
}
