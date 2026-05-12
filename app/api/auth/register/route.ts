import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { handleApiError, nameSchema, usernameSchema, jsonError } from '@/lib/api'
import { normalizePhoneToE164, isValidUsername, RESERVED_USERNAMES } from '@/lib/validation'

const DUPLICATE_ERROR = 'An account with these details already exists. Try logging in or use different information.'

const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  name: nameSchema,
  username: usernameSchema,
  phone: z.string().trim().min(1, 'Phone number is required'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, username, phone: rawPhone } = RegisterSchema.parse(body)

    // Validate username against reserved list (schema handles format)
    if (RESERVED_USERNAMES.has(username) || !isValidUsername(username)) {
      return jsonError(DUPLICATE_ERROR, 400)
    }

    // Normalize phone to E.164
    const phone = normalizePhoneToE164(rawPhone)
    if (!phone) {
      return jsonError('Please enter a valid phone number (e.g. +1 555 123 4567)', 400)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        username,
        usernameSetByUser: true,
        phone,
        stats: {
          create: {},
        },
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: DUPLICATE_ERROR }, { status: 400 })
    }
    return handleApiError(error)
  }
}
