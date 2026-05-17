import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendVerificationEmail(email: string, name: string, code: string) {
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
