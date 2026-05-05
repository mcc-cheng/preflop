import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { handleApiError, nameSchema, phoneSchema, usernameSchema } from '@/lib/api'

const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  name: nameSchema,
  username: usernameSchema,
  phone: phoneSchema,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, username, phone } = RegisterSchema.parse(body)

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        username,
        phone: phone || null,
        stats: {
          create: {}
        }
      }
    })

    return NextResponse.json({ 
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'field'
      return NextResponse.json({ error: `${target} already exists` }, { status: 400 })
    }

    return handleApiError(error)
  }
}
