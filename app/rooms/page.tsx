import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function RoomsPage() {
  const user = await requireAuth()

  const rooms = await prisma.room.findMany({
    where: {
      members: {
        some: {
          userId: user.id
        }
      }
    },
    include: {
      host: true,
      _count: {
        select: {
          members: true,
          events: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Rooms</h1>
            <p className="text-slate-400 mt-1">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/rooms/new"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Create Room
            </Link>
            <Link
              href="/rooms/join"
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            >
              Join Room
            </Link>
            <LogoutButton />
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg mb-4">No rooms yet</p>
            <p className="text-slate-500">Create a new room or join an existing one</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const settings = room.settings as any
              return (
                <Link
                  key={room.id}
                  href={`/rooms/${room.code}`}
                  className="bg-slate-800 hover:bg-slate-750 rounded-lg p-6 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{settings.name}</h3>
                    {room.endedAt ? (
                      <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded">
                        ENDED
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-400">
                    <div>Code: <span className="font-mono text-white">{room.code}</span></div>
                    <div>Host: {room.host.name}</div>
                    <div>Players: {room._count.members}</div>
                    <div>Events: {room._count.events}</div>
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
