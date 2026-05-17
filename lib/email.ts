import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Preflop account',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;background:#0d0d12;color:#e0e0e0;padding:40px 20px;max-width:480px;margin:0 auto;">
          <h1 style="color:#fff;font-size:24px;margin-bottom:8px;">Welcome to Preflop, ${name}!</h1>
          <p style="color:#a0a0b0;margin-bottom:28px;">Click the button below to verify your email address. This link expires in 24 hours.</p>
          <a href="${url}"
            style="display:inline-block;background:#4ade80;color:#0d0d12;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
            Verify Email
          </a>
          <p style="margin-top:32px;color:#606070;font-size:13px;">If you didn't create a Preflop account, you can ignore this email.</p>
        </body>
      </html>
    `,
  })
}
