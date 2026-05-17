import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jsonError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return jsonError('Invalid token', 400)
    }

    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
      select: { id: true, emailVerified: true, emailVerificationExpiry: true },
    })

    if (!user) {
      return jsonError('Invalid or expired verification link', 400)
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      return jsonError('Verification link has expired. Please register again or request a new link.', 400)
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
