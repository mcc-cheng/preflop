import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import {
  handleApiError,
  nameSchema,
  paymentMethodSelect,
  phoneSchema,
  privateUserSelect,
  statsSelect,
  usernameSchema,
} from '@/lib/api'

const UpdateProfileSchema = z.object({
  name: nameSchema.optional(),
  username: usernameSchema.optional(),
  phone: phoneSchema,
  profilePicture: z.string().trim().max(2048).optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ...privateUserSelect,
        paymentMethods: {
          select: paymentMethodSelect,
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        stats: {
          select: statsSelect,
        },
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
      data: {
        ...data,
        phone: data.phone === '' ? null : data.phone,
      },
      select: privateUserSelect,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Username or phone already taken' }, { status: 400 })
    }

    return handleApiError(error)
  }
}
