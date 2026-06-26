import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

// Lazily construct the client so importing this module never throws when
// RESEND_API_KEY is unset (e.g. the teaser deploy with email disabled).
// Returns null when no key is configured; callers should treat sending as
// best-effort.
let _resend: Resend | null | undefined
function getResend(): Resend | null {
  if (_resend === undefined) {
    const key = process.env.RESEND_API_KEY
    _resend = key ? new Resend(key) : null
    if (!key) {
      console.warn('RESEND_API_KEY is not set — outbound email is disabled.')
    }
  }
  return _resend
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendWaitlistConfirmationEmail(email: string) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're on the Preflop waitlist 🎲`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;background:#0d0d12;color:#e0e0e0;padding:40px 20px;max-width:480px;margin:0 auto;">
          <h1 style="color:#fff;font-size:24px;margin-bottom:8px;">You're on the list.</h1>
          <p style="color:#a0a0b0;margin-bottom:28px;">Thanks for joining the Preflop waitlist — a novel way to settle poker night. We'll email you the moment we launch in August 2026.</p>
          <div style="background:#1a1a24;border:1px solid #2a2a38;border-radius:16px;padding:24px;margin-bottom:28px;">
            <p style="color:#4ade80;font-weight:700;margin:0 0 6px;">What's coming</p>
            <p style="color:#a0a0b0;margin:0;font-size:14px;">Live buy-in tracking, automatic settlement math, and a provably fair record of who owes whom — in the fewest transfers possible.</p>
          </div>
          <p style="color:#606070;font-size:13px;">If you didn't sign up for Preflop, you can ignore this email.</p>
        </body>
      </html>
    `,
  })
}

export async function sendVerificationEmail(email: string, name: string, code: string) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} is your Preflop verification code`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;background:#0d0d12;color:#e0e0e0;padding:40px 20px;max-width:480px;margin:0 auto;">
          <h1 style="color:#fff;font-size:24px;margin-bottom:8px;">Welcome to Preflop, ${name}!</h1>
          <p style="color:#a0a0b0;margin-bottom:28px;">Enter this code in the app to verify your email address. It expires in 24 hours.</p>
          <div style="background:#1a1a24;border:1px solid #2a2a38;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#4ade80;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#606070;font-size:13px;">If you didn't create a Preflop account, you can ignore this email.</p>
        </body>
      </html>
    `,
  })
}
