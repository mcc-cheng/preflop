import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateRoomCode } from '@/lib/utils'
import { z } from 'zod'
import { handleApiError, moneyAmountSchema, roomUserSelect } from '@/lib/api'
import { requirePaymentSetup } from '@/lib/payment-eligibility'

const ChipEntrySchema = z.object({
  color: z.string().trim().min(1, 'Color is required').max(30),
  denomination: z.number().int().positive('Denomination must be a positive integer (cents)'),
})

const CreateRoomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  defaultBuyIn: moneyAmountSchema,
  blinds: z.string().trim().max(24).optional().or(z.literal('')),
  currency: z.literal('USD').default('USD'),
  maxPlayers: z.number().int().min(2).max(20).optional(),
  chips: z.array(ChipEntrySchema).min(1, 'At least one chip type is required'),
})

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    await requirePaymentSetup(user.id)
    const body = await request.json()
    const data = CreateRoomSchema.parse(body)

    let room

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        room = await prisma.room.create({
          data: {
            code: generateRoomCode(),
            hostId: user.id,
            settings: {
              name: data.name,
              defaultBuyIn: data.defaultBuyIn,
              blinds: data.blinds || undefined,
              currency: data.currency,
              maxPlayers: data.maxPlayers,
            },
            members: {
              create: {
                userId: user.id,
                role: 'HOST'
              }
            },
            chipTypes: {
              createMany: {
                data: data.chips.map(c => ({ color: c.color, denomination: c.denomination })),
              }
            }
          },
          include: {
            host: {
              select: roomUserSelect,
            },
            members: {
              include: {
                user: {
                  select: roomUserSelect,
                }
              }
            },
            chipTypes: true,
          }
        })
        break
      } catch (error: any) {
        if (error?.code !== 'P2002' || attempt === 4) {
          throw error
        }
      }
    }

    if (!room) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    return NextResponse.json(room)
  } catch (error: any) {
    if (error?.message === 'PAYMENT_SETUP_REQUIRED') {
      return NextResponse.json(
        { error: 'Link at least two payment types before creating a room' },
        { status: 403 }
      )
    }

    return handleApiError(error)
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
        host: {
          select: roomUserSelect,
        },
        members: {
          include: {
            user: {
              select: roomUserSelect,
            }
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

    return NextResponse.json({ rooms })
  } catch (error: any) {
    return handleApiError(error)
  }
}
