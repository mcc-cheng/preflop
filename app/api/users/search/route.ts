import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, jsonError } from '@/lib/api'
import { normalizePhoneToE164 } from '@/lib/validation'

type FriendshipState = 'none' | 'friends' | 'request_sent' | 'request_received'

async function getFriendshipState(
  currentUserId: string,
  targetUserId: string,
): Promise<FriendshipState> {
  const [friendship, outgoing, incoming] = await Promise.all([
    prisma.friendship.findFirst({ where: { userId: currentUserId, friendId: targetUserId } }),
    prisma.friendRequest.findFirst({
      where: { senderId: currentUserId, receiverId: targetUserId, status: 'PENDING' },
    }),
    prisma.friendRequest.findFirst({
      where: { senderId: targetUserId, receiverId: currentUserId, status: 'PENDING' },
    }),
  ])

  if (friendship) return 'friends'
  if (outgoing) return 'request_sent'
  if (incoming) return 'request_received'
  return 'none'
}

const publicSelect = {
  id: true,
  username: true,
  name: true,
} as const

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q) return jsonError('q is required', 400)

    // Determine if this looks like a phone number
    const e164 = normalizePhoneToE164(q)

    let candidates: Array<{ id: string; username: string; name: string }>

    if (e164) {
      // Exact phone match — never echo the phone back
      const found = await prisma.user.findUnique({
        where: { phone: e164 },
        select: publicSelect,
      })
      candidates = found ? [found] : []
    } else {
      // Prefix-match on username, case-insensitive, max 10
      candidates = await prisma.user.findMany({
        where: {
          username: {
            startsWith: q.toLowerCase(),
            mode: 'insensitive',
          },
        },
        select: publicSelect,
        take: 10,
        orderBy: { username: 'asc' },
      })
    }

    // Exclude self
    candidates = candidates.filter(c => c.id !== user.id)

    const results = await Promise.all(
      candidates.map(async c => ({
        id: c.id,
        username: c.username,
        displayName: c.name,
        friendshipState: await getFriendshipState(user.id, c.id),
      })),
    )

    return NextResponse.json({ results })
  } catch (error) {
    return handleApiError(error)
  }
}
