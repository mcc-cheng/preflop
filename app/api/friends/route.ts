import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePicture: true,
            stats: true
          }
        }
      }
    })

    return NextResponse.json(friendships.map(f => f.friend))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
