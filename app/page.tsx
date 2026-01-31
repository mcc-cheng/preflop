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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            🃏 Preflop
          </h1>
          <p className="text-xl text-slate-300 mb-12">
            Simple, transparent payouts for your home poker games.
            <br />
            Track buy-ins, rebuys, and cashouts in real-time.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Sign In
            </Link>
            <Link
              href="/login?register=true"
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">📊 Live Tracking</h3>
              <p className="text-slate-400">Real-time updates as players buy-in, rebuy, and cash out.</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">🔒 Immutable Log</h3>
              <p className="text-slate-400">Complete audit trail of all transactions.</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-white mb-2">💸 Auto Settlement</h3>
              <p className="text-slate-400">Minimize transfers with smart settlement algorithm.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
