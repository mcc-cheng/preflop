import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api'
import { sendWaitlistConfirmationEmail } from '@/lib/email'

const WaitlistSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  affiliation: z.string().trim().max(120).optional().or(z.literal('')),
  xHandle: z.string().trim().max(40).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  source: z.string().trim().max(40).optional(),
})

// Strip a leading "@" so X handles store consistently.
function normalizeHandle(handle?: string): string | null {
  if (!handle) return null
  const v = handle.replace(/^@+/, '').trim()
  return v.length ? v : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = WaitlistSchema.parse(body)

    const fields = {
      name: data.name,
      affiliation: data.affiliation?.trim() || null,
      xHandle: normalizeHandle(data.xHandle),
      note: data.note?.trim() || null,
      source: data.source ?? 'landing',
    }

    // Idempotent: a repeat signup updates the stored details rather than erroring.
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: data.email },
      select: { id: true },
    })

    await prisma.waitlistSignup.upsert({
      where: { email: data.email },
      create: { email: data.email, ...fields },
      update: fields,
    })

    // Only send a confirmation on first signup, and never fail the request if
    // email delivery is unconfigured or errors out.
    if (!existing) {
      try {
        await sendWaitlistConfirmationEmail(data.email)
      } catch (err) {
        console.error('Waitlist confirmation email failed:', err)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
