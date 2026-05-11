import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, jsonError } from '@/lib/api'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ friendUserId: string }> }
) {
  try {
    const user = await requireAuth()
    const { friendUserId } = await params

    const friendship = await prisma.friendship.findFirst({
      where: { userId: user.id, friendId: friendUserId },
    })
    if (!friendship) return jsonError('Not friends', 404)

    // Remove in both directions
    await prisma.$transaction([
      prisma.friendship.deleteMany({ where: { userId: user.id, friendId: friendUserId } }),
      prisma.friendship.deleteMany({ where: { userId: friendUserId, friendId: user.id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
