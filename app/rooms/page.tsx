import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { roomUserSelect } from '@/lib/api'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import { PageShell, StatusBadge } from '@/components/ui'

function hasMultipleBuyers(events: { type: string; userId: string }[]) {
  const buyerIds = new Set(
    events
      .filter(event => event.type === 'BUY_IN' || event.type === 'REBUY')
      .map(event => event.userId)
  )

  return buyerIds.size > 1
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams?: Promise<{ history?: string }>
}) {
  const user = await getCurrentUser() as { id: string; email: string; name: string } | undefined
  if (!user) redirect('/login')
  const params = await searchParams
  const showingHistory = params?.history === 'true'

  const rooms = await prisma.room.findMany({
    where: {
      endedAt: showingHistory ? { not: null } : null,
      members: {
        some: {
          userId: user.id
        }
      },
      ...(showingHistory ? { settlements: { some: {} } } : {})
    },
    include: {
      host: {
        select: roomUserSelect,
      },
      events: {
        select: {
          type: true,
          userId: true,
        },
      },
      _count: {
        select: {
          members: true,
          events: true,
          settlements: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const visibleRooms = showingHistory
    ? rooms.filter(room => hasMultipleBuyers(room.events))
    : rooms

  return (
    <PageShell>
      <div>
        <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">
              {showingHistory ? 'Past Games' : 'My Rooms'}
            </h1>
            <p className="text-on-surface-variant mt-1">Welcome, {user.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rooms/new"
              className="px-5 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-150"
            >
              Create Room
            </Link>
            <Link
              href="/rooms/join"
              className="px-5 py-2 bg-surface-raised border border-outline text-on-surface rounded-xl font-semibold text-sm hover:bg-outline transition-all duration-150"
            >
              Join Room
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mb-6 flex rounded-xl bg-surface-raised p-1">
          <Link
            href="/rooms"
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-all duration-150 ${
              !showingHistory ? 'bg-surface text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Active Rooms
          </Link>
          <Link
            href="/rooms?history=true"
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-all duration-150 ${
              showingHistory ? 'bg-surface text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Past Games
          </Link>
        </div>

        {visibleRooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-lg mb-2">
              {showingHistory ? 'No past games yet' : 'No active rooms'}
            </p>
            <p className="text-on-surface-variant/60 text-sm">
              {showingHistory
                ? 'Settled games appear here once more than one player has bought in.'
                : 'Create a new room or join an existing one.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRooms.map((room) => {
              const settings = room.settings as any
              const href = room.endedAt ? `/rooms/${room.id}` : `/rooms/${room.code}`
              return (
                <Link
                  key={room.id}
                  href={href}
                  className="bg-surface border border-outline hover:border-chip-white/20 rounded-2xl p-5 transition-all duration-150 hover:bg-surface-raised group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base font-bold text-on-surface group-hover:chip-text-white">{settings.name}</h3>
                    {room.endedAt
                      ? <StatusBadge label="SETTLED" color="slate" />
                      : <StatusBadge label="ACTIVE" color="green" />
                    }
                  </div>

                  <div className="space-y-1.5 text-sm text-on-surface-variant">
                    {!room.endedAt && (
                      <div>Code: <span className="font-mono text-on-surface">{room.code}</span></div>
                    )}
                    <div>Host: {room.host.name}</div>
                    <div>Players: {room._count.members}</div>
                    <div>Events: {room._count.events}</div>
                    {showingHistory && <div>Settlements: {room._count.settlements}</div>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}
