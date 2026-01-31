import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsClient from '@/components/SettingsClient'

export default async function SettingsPage() {
  const user = await requireAuth()

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      paymentMethods: {
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      },
      stats: true
    }
  })

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/rooms" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to rooms
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        <SettingsClient profile={profile} />
      </div>
    </div>
  )
}
