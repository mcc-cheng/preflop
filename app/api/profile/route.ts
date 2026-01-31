import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).max(20).optional(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        paymentMethods: true,
        stats: true,
        _count: {
          select: {
            friendshipsInitiated: true
          }
        }
      }
    })

    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = UpdateProfileSchema.parse(body)

    // Check if username is taken
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: user.id }
        }
      })

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
