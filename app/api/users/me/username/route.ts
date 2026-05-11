import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, jsonError } from '@/lib/api'
import { isValidUsername, RESERVED_USERNAMES } from '@/lib/validation'
import { z } from 'zod'

const SetUsernameSchema = z.object({
  username: z.string(),
})

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { username } = SetUsernameSchema.parse(await req.json())

    if (!isValidUsername(username)) {
      if (RESERVED_USERNAMES.has(username)) {
        return jsonError('That username is reserved', 400)
      }
      return jsonError(
        'Username must be 3–20 characters, start with a letter, and contain only lowercase letters, numbers, and underscores',
        400,
      )
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    if (existing && existing.id !== user.id) {
      return jsonError('That username is already taken', 400)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { username, usernameSetByUser: true },
      select: { id: true, username: true, name: true, profilePicture: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// Real-time availability check used by the username pick form.
export async function GET(req: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username') ?? ''

    if (!isValidUsername(username)) {
      return NextResponse.json({ available: false, reason: 'invalid' })
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    return handleApiError(error)
  }
}
