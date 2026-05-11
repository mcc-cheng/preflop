import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/SettingsClient'
import { PageShell, BackLink } from '@/components/ui'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  let user: { id: string; email: string; name: string }
  try { user = await requireAuth() } catch { redirect('/login') }
  const params = await searchParams
  const initialTab = params?.tab ?? ''

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
    <PageShell>
      <BackLink href="/rooms" label="Back to rooms" />

      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

      <SettingsClient profile={profile} initialTab={initialTab} />
    </PageShell>
  )
}
