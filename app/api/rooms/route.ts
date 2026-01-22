import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateRoomCode } from '@/lib/utils'
import { z } from 'zod'

const CreateRoomSchema = z.object({
  name: z.string().min(1),
  defaultBuyIn: z.number().positive(),
  blinds: z.string().optional(),
  currency: z.string().default('USD'),
  maxPlayers: z.number().optional(),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const data = CreateRoomSchema.parse(body)

    let code = generateRoomCode()
    // Ensure uniqueness
    let existing = await prisma.room.findUnique({ where: { code } })
    while (existing) {
      code = generateRoomCode()
      existing = await prisma.room.findUnique({ where: { code } })
    }

    const room = await prisma.room.create({
      data: {
        code,
        hostId: user.id,
        settings: {
          name: data.name,
          defaultBuyIn: data.defaultBuyIn,
          blinds: data.blinds,
          currency: data.currency,
          maxPlayers: data.maxPlayers,
        },
        members: {
          create: {
            userId: user.id,
            role: 'HOST'
          }
        }
      },
      include: {
        host: true,
        members: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(room)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        host: true,
        members: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            events: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rooms)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
