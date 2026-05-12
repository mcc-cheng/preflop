import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/rooms')
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex min-h-[80vh] items-center">
          <div className="mx-auto text-center max-w-2xl">
            <p className="text-on-surface-variant text-sm font-mono tracking-widest uppercase mb-4">Poker night, simplified</p>
            <h1 className="text-5xl md:text-6xl font-bold text-on-surface mb-6 leading-tight">
              Simple poker<br />night settlement.
            </h1>
            <p className="text-lg text-on-surface-variant mb-10 max-w-lg mx-auto">
              Track buy-ins, rebuys, and cashouts in real time. Settle up fairly and quickly after every game.
            </p>

            <div className="flex justify-center gap-3">
              <Link
                href="/login?register=true"
                className="px-7 py-2.5 bg-chip-white text-black font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="px-7 py-2.5 border border-chip-white/20 text-on-surface font-semibold rounded-xl hover:bg-chip-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 pb-16">
          <div className="glass-card chip-border-white p-6">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-base font-bold text-on-surface mb-1">Live Tracking</h3>
            <p className="text-on-surface-variant text-sm">Real-time updates as players buy in, rebuy, and cash out.</p>
          </div>
          <div className="glass-card chip-border-white p-6">
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="text-base font-bold text-on-surface mb-1">Immutable Log</h3>
            <p className="text-on-surface-variant text-sm">Complete audit trail of every transaction.</p>
          </div>
          <div className="glass-card chip-border-white p-6">
            <div className="text-2xl mb-3">💸</div>
            <h3 className="text-base font-bold text-on-surface mb-1">Auto Settlement</h3>
            <p className="text-on-surface-variant text-sm">Minimize transfers with a smart settlement algorithm.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
