import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { roomUserSelect } from '@/lib/api'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

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
  const user = await requireAuth()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 mb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {showingHistory ? 'Past Games' : 'My Rooms'}
            </h1>
            <p className="text-slate-400 mt-1">Welcome, {user.name}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/friends"
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            >
              👥 Friends
            </Link>
            <Link
              href="/settings"
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            >
              ⚙️ Settings
            </Link>
            <Link
              href="/rooms/new"
              className="px-6 py-2 text-white rounded-lg font-semibold transition bg-blue-600 hover:bg-blue-700"
            >
              Create Room
            </Link>
            <Link
              href="/rooms/join"
              className="px-6 py-2 rounded-lg font-semibold transition bg-slate-700 hover:bg-slate-600 text-white"
            >
              Join Room
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="mb-6 flex rounded-lg bg-slate-800 p-1">
          <Link
            href="/rooms"
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition ${
              !showingHistory ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Rooms
          </Link>
          <Link
            href="/rooms?history=true"
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition ${
              showingHistory ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Past Games
          </Link>
        </div>

        {visibleRooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg mb-4">
              {showingHistory ? 'No past games yet' : 'No active rooms'}
            </p>
            <p className="text-slate-500">
              {showingHistory
                ? 'Settled games appear here once more than one player has bought in.'
                : 'Create a new room or join an existing one.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRooms.map((room) => {
              const settings = room.settings as any
              const href = room.endedAt ? `/rooms/${room.id}` : `/rooms/${room.code}`
              return (
                <Link
                  key={room.id}
                  href={href}
                  className="bg-slate-800 hover:bg-slate-750 rounded-lg p-6 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{settings.name}</h3>
                    {room.endedAt ? (
                      <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded">
                        SETTLED
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-slate-400">
                    {!room.endedAt && (
                      <div>Code: <span className="font-mono text-white">{room.code}</span></div>
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
    </div>
  )
}
