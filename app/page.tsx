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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            🃏 Preflop
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Login
          </Link>
        </div>

        <div className="flex min-h-[70vh] items-center">
          <div className="mx-auto text-center max-w-3xl">
            <h1 className="text-6xl font-bold text-white mb-6">
              Simple poker night settlement.
            </h1>
            <p className="text-xl text-slate-300 mb-12">
              Track buy-ins, rebuys, and cashouts in real time, so you can settle up fairly and quickly after every game.
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/login?register=true"
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">📊 Live Tracking</h3>
            <p className="text-slate-400">Real-time updates as players buy in, rebuy, and cash out.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">🔒 Immutable Log</h3>
            <p className="text-slate-400">Complete audit trail of every transaction.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">💸 Auto Settlement</h3>
            <p className="text-slate-400">Minimize transfers with a smart settlement algorithm.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
