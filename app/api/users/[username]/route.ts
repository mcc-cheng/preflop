import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, statsSelect, usernameSchema } from '@/lib/api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    await requireAuth()
    const { username: rawUsername } = await params
    const username = usernameSchema.parse(rawUsername)
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        profilePicture: true,
        createdAt: true,
        stats: {
          select: statsSelect,
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    return handleApiError(error)
  }
}
