import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code || typeof code !== 'string') {
      return jsonError('Email and code are required', 400)
    }

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), emailVerificationToken: code.trim() },
      select: { id: true, emailVerified: true, emailVerificationExpiry: true },
    })

    if (!user) {
      return jsonError('Incorrect code. Please try again.', 400)
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return jsonError('This code has expired. Please register again.', 400)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return jsonError('Something went wrong', 500)
  }
}
