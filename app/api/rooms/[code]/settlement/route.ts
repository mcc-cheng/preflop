import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getPlayerNets, computeSettlement } from '@/lib/settlement'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const user = await requireAuth()
    const code = params.code.toUpperCase()

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const isMember = room.members.some(m => m.userId === user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const nets = await getPlayerNets(room.id)
    const edges = computeSettlement(nets)

    // Enrich with user data
    const userMap = new Map(room.members.map(m => [m.userId, m.user]))
    
    const enrichedNets = nets.map(n => ({
      ...n,
      user: userMap.get(n.userId)
    }))

    const enrichedEdges = edges.map(e => ({
      ...e,
      fromUser: userMap.get(e.fromUserId),
      toUser: userMap.get(e.toUserId)
    }))

    return NextResponse.json({
      nets: enrichedNets,
      edges: enrichedEdges
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
