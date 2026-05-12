import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/api'
import { z } from 'zod'

const PatchSchema = z.object({
  shareStatsWithFriends: z.boolean(),
})

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth()
    const body = PatchSchema.parse(await req.json())

    await prisma.user.update({
      where: { id: user.id },
      data: { shareStatsWithFriends: body.shareStatsWithFriends },
    })

    return NextResponse.json({ shareStatsWithFriends: body.shareStatsWithFriends })
  } catch (error) {
    return handleApiError(error)
  }
}
