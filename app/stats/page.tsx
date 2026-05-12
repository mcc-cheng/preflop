import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getUserStats } from '@/lib/stats'
import { prisma } from '@/lib/prisma'
import { PageShell, BackLink, Card } from '@/components/ui'
import { StatsKpiGrid } from '@/components/stats/StatsKpiGrid'
import { StatsCumulativeChart } from '@/components/stats/StatsCumulativeChart'
import { StatsRoomHistory } from '@/components/stats/StatsRoomHistory'
import { StatsSharingToggle } from '@/components/stats/StatsSharingToggle'

export default async function StatsPage() {
  let user: { id: string; email: string; name: string }
  try {
    user = await requireAuth()
  } catch {
    redirect('/login')
  }

  const [stats, userRecord] = await Promise.all([
    getUserStats(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { shareStatsWithFriends: true },
    }),
  ])

  const shareStats = userRecord?.shareStatsWithFriends ?? false

  return (
    <PageShell>
      <BackLink href="/rooms" label="Back to rooms" />

      <h1 className="text-3xl font-bold text-on-surface mb-8">My Stats</h1>

      {/* KPI Grid */}
      <div className="mb-6">
        <StatsKpiGrid stats={stats} />
      </div>

      {/* Cumulative P&L Chart */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">Cumulative P&L</h2>
        <StatsCumulativeChart data={stats.cumulativePnl} />
      </Card>

      {/* Session History */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold text-on-surface mb-4">
          Session History ({stats.perRoomHistory.length})
        </h2>
        <StatsRoomHistory rooms={stats.perRoomHistory} />
      </Card>

      {/* Sharing Toggle */}
      <Card>
        <h2 className="text-lg font-bold text-on-surface mb-4">Privacy</h2>
        <StatsSharingToggle initialValue={shareStats} />
      </Card>
    </PageShell>
  )
}
