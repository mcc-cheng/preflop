import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  username: z.string().min(3).max(20),
  phone: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, username, phone } = RegisterSchema.parse(body)

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        username,
        phone,
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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
