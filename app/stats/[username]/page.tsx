import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserStats } from '@/lib/stats'
import { PageShell, BackLink, Card } from '@/components/ui'
import { StatsKpiGrid } from '@/components/stats/StatsKpiGrid'
import { StatsCumulativeChart } from '@/components/stats/StatsCumulativeChart'
import { StatsRoomHistory } from '@/components/stats/StatsRoomHistory'

export default async function FriendStatsPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  let currentUser: { id: string; email: string; name: string }
  try {
    currentUser = await requireAuth()
  } catch {
    redirect('/login')
  }

  const { username } = await params

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, shareStatsWithFriends: true },
  })

  if (!target) {
    return (
      <PageShell>
        <BackLink href="/friends" label="Back to friends" />
        <div className="text-center py-16">
          <p className="text-on-surface text-xl font-semibold mb-2">User not found</p>
          <p className="text-on-surface-variant">@{username} doesn't exist.</p>
        </div>
      </PageShell>
    )
  }

  const friendship = await prisma.friendship.findFirst({
    where: { userId: currentUser.id, friendId: target.id },
  })

  if (!friendship) {
    return (
      <PageShell>
        <BackLink href="/friends" label="Back to friends" />
        <div className="text-center py-16">
          <p className="text-on-surface text-xl font-semibold mb-2">Not your friend yet</p>
          <p className="text-on-surface-variant">Add @{username} as a friend to view their stats.</p>
        </div>
      </PageShell>
    )
  }

  if (!target.shareStatsWithFriends) {
    return (
      <PageShell>
        <BackLink href="/friends" label="Back to friends" />
        <div className="text-center py-16">
          <p className="text-on-surface text-xl font-semibold mb-2">Stats sharing is off</p>
          <p className="text-on-surface-variant">@{username} has not shared their stats.</p>
        </div>
      </PageShell>
    )
  }

  const stats = await getUserStats(target.id)

  return (
    <PageShell>
      <BackLink href="/friends" label="Back to friends" />

      <h1 className="text-3xl font-bold text-on-surface mb-8">@{target.username}'s Stats</h1>

      <div className="mb-6">
        <StatsKpiGrid stats={stats} />
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">Cumulative P&L</h2>
        <StatsCumulativeChart data={stats.cumulativePnl} />
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-on-surface mb-4">
          Session History ({stats.perRoomHistory.length})
        </h2>
        <StatsRoomHistory rooms={stats.perRoomHistory} />
      </Card>
    </PageShell>
  )
}
