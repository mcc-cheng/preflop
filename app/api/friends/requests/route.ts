import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { handleApiError, jsonError } from '@/lib/api'

const SendRequestSchema = z.object({
  targetUserId: z.string().min(1),
})

const otherUserSelect = {
  id: true,
  username: true,
  name: true,
} as const

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction') ?? 'incoming'

    if (direction === 'incoming') {
      const requests = await prisma.friendRequest.findMany({
        where: { receiverId: user.id, status: 'PENDING' },
        select: {
          id: true,
          createdAt: true,
          sender: { select: otherUserSelect },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        requests: requests.map(r => ({
          id: r.id,
          createdAt: r.createdAt,
          otherUser: { id: r.sender.id, username: r.sender.username, displayName: r.sender.name },
        })),
      })
    }

    if (direction === 'outgoing') {
      const requests = await prisma.friendRequest.findMany({
        where: { senderId: user.id, status: 'PENDING' },
        select: {
          id: true,
          createdAt: true,
          receiver: { select: otherUserSelect },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        requests: requests.map(r => ({
          id: r.id,
          createdAt: r.createdAt,
          otherUser: { id: r.receiver.id, username: r.receiver.username, displayName: r.receiver.name },
        })),
      })
    }

    return jsonError('direction must be incoming or outgoing', 400)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const { targetUserId } = SendRequestSchema.parse(await request.json())

    if (targetUserId === user.id) return jsonError('Cannot add yourself', 400)

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })
    if (!target) return jsonError('User not found', 404)

    // Already friends?
    const existingFriendship = await prisma.friendship.findFirst({
      where: { userId: user.id, friendId: targetUserId },
    })
    if (existingFriendship) return jsonError('Already friends', 400)

    // Pending outgoing request already?
    const outgoing = await prisma.friendRequest.findFirst({
      where: { senderId: user.id, receiverId: targetUserId, status: 'PENDING' },
    })
    if (outgoing) return jsonError('Friend request already sent', 400)

    // Incoming request from target → auto-accept (mutual request)
    const incoming = await prisma.friendRequest.findFirst({
      where: { senderId: targetUserId, receiverId: user.id, status: 'PENDING' },
    })

    if (incoming) {
      await prisma.$transaction([
        prisma.friendship.create({ data: { userId: user.id, friendId: targetUserId } }),
        prisma.friendship.create({ data: { userId: targetUserId, friendId: user.id } }),
        prisma.friendRequest.update({ where: { id: incoming.id }, data: { status: 'ACCEPTED' } }),
      ])
      return NextResponse.json({ autoAccepted: true })
    }

    const friendRequest = await prisma.friendRequest.create({
      data: { senderId: user.id, receiverId: targetUserId },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ autoAccepted: false, request: friendRequest })
  } catch (error: any) {
    if (error?.code === 'P2002') return jsonError('Friend request already sent', 400)
    return handleApiError(error)
  }
}
