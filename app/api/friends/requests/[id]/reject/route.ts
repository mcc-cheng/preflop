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

    await prisma.friendRequest.update({ where: { id }, data: { status: 'DECLINED' } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
