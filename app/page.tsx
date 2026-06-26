import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WaitlistModal } from '@/components/WaitlistModal'

/* A single realistic white poker chip — the brand mark. CSS only. */
const SPOT = '#f3f3ef'
const METAL = '#b7bcc4'
const METAL_DARK = '#7e848c'

function Chip({ size }: { size: number }) {
  return (
    <div className="absolute inset-0 rounded-full" style={{
      background: 'radial-gradient(circle at 50% 30%, #ffffff 0%, #e9e9e1 55%, #b4b4a8 100%)',
      boxShadow: `inset 0 ${size * 0.02}px ${size * 0.04}px rgba(255,255,255,0.6), inset 0 -${size * 0.05}px ${size * 0.09}px rgba(0,0,0,0.35), 0 ${size * 0.06}px ${size * 0.16}px -${size * 0.02}px rgba(0,0,0,0.6)`,
    }} aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="absolute left-1/2 top-1/2" style={{
          width: size * 0.2, height: size * 0.17, borderRadius: size * 0.035, background: '#ffffff',
          transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-${size * 0.42}px)`,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(0,0,0,0.04)',
        }} />
      ))}
      <div className="absolute rounded-full" style={{
        inset: size * 0.12,
        background: `repeating-conic-gradient(${METAL} 0deg 4deg, ${METAL_DARK} 4deg 5deg, ${SPOT} 5deg 7deg, ${METAL_DARK} 7deg 8deg)`,
        boxShadow: 'inset 0 0 3px rgba(0,0,0,0.3)',
      }} />
      <div className="absolute rounded-full flex items-center justify-center" style={{
        inset: size * 0.2,
        background: 'radial-gradient(circle at 50% 36%, #f8f8f3 0%, #e6e6dd 70%, #c2c2b6 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -2px 5px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.12)',
      }}>
        <span style={{ color: '#3f6f50', fontSize: size * 0.24, fontWeight: 800, lineHeight: 1 }}>P</span>
      </div>
    </div>
  )
}

const SUIT_GLYPHS = { spade: '♠', heart: '♥', club: '♣', diamond: '♦' } as const
type Suit = keyof typeof SUIT_GLYPHS

// Faint oversized card suits behind the content (the two corners without cards).
const BG_SUITS: { g: string; l: number; t: number; size: number; rot: number; color: string }[] = [
  { g: '♥', l: 86, t: 22, size: 200, rot: 14, color: 'rgba(214,72,72,0.11)' },
  { g: '♦', l: 15, t: 78, size: 175, rot: -8, color: 'rgba(214,72,72,0.10)' },
]

// A face-up playing card — muted so it sits quietly behind the text.
function Card({ rank, suit, size = 88, rotate = 0, tx = 0, ty = 0, opacity = 1, className = '' }: {
  rank: string; suit: Suit; size?: number; rotate?: number; tx?: number; ty?: number; opacity?: number; className?: string
}) {
  const red = suit === 'heart' || suit === 'diamond'
  const ink = red ? '#94474c' : '#3b3c42'
  const glyph = SUIT_GLYPHS[suit]
  const Corner = ({ flip = false }: { flip?: boolean }) => (
    <div className={`absolute flex flex-col items-center leading-none ${flip ? 'bottom-[7%] right-[9%] rotate-180' : 'top-[7%] left-[9%]'}`} style={{ color: ink }}>
      <span style={{ fontSize: size * 0.24, fontWeight: 800 }}>{rank}</span>
      <span style={{ fontSize: size * 0.2, marginTop: -size * 0.02 }}>{glyph}</span>
    </div>
  )
  return (
    <div className={`absolute ${className}`} style={{ width: size, height: size * 1.4, opacity, transform: `translate(${tx}%, ${ty}%) rotate(${rotate}deg)` }} aria-hidden="true">
      <div className="relative h-full w-full" style={{
        borderRadius: size * 0.09,
        background: 'linear-gradient(150deg, #c6c5bc 0%, #a6a59c 100%)',
        boxShadow: '0 16px 30px -10px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.4)',
      }}>
        {/* white inner border, like a real card face */}
        <div className="absolute" style={{ inset: size * 0.045, borderRadius: size * 0.06, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)' }} />
        <Corner />
        <div className="absolute inset-0 flex items-center justify-center" style={{ color: ink, opacity: 0.85 }}>
          <span style={{ fontSize: size * 0.52 }}>{glyph}</span>
        </div>
        <Corner flip />
        {/* glossy sheen */}
        <div className="absolute inset-0" style={{ borderRadius: size * 0.09, background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.08) 100%)' }} />
      </div>
    </div>
  )
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Existing users / the team can still reach the live app.
  if (session) {
    redirect('/rooms')
  }

  return (
    <main className="relative flex h-[100svh] items-center justify-center overflow-hidden px-6" style={{ background: '#070a08' }}>
      {/* Felt glow — green like a poker table */}
      <div className="pointer-events-none absolute inset-0" style={{
        background:
          'radial-gradient(ellipse 52% 46% at 50% 38%, rgba(40,110,68,0.22) 0%, rgba(40,110,68,0.06) 40%, transparent 66%), radial-gradient(ellipse 80% 70% at 50% 120%, rgba(30,80,50,0.18) 0%, transparent 60%)',
      }} aria-hidden="true" />

      {/* Faint card suits */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {BG_SUITS.map((s, i) => (
          <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2 select-none" style={{
            left: `${s.l}%`, top: `${s.t}%`, fontSize: s.size, lineHeight: 1, color: s.color,
            transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
          }}>{s.g}</span>
        ))}
      </div>

      {/* Edge vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 70% at 50% 45%, transparent 50%, rgba(0,0,0,0.5) 100%)',
      }} aria-hidden="true" />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {/* AK / QQ anchored to the corners of the text block, behind it */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block" aria-hidden="true">
          {/* AK — top-left corner, fanned & overlapping */}
          <Card rank="A" suit="spade" className="left-0 top-0" tx={-50} ty={-50} rotate={-22} />
          <Card rank="K" suit="spade" className="left-0 top-0" tx={-24} ty={-58} rotate={-8} />
          {/* QQ — bottom-right corner, fanned & overlapping */}
          <Card rank="Q" suit="heart" className="bottom-0 right-0" tx={24} ty={58} rotate={8} />
          <Card rank="Q" suit="diamond" className="bottom-0 right-0" tx={50} ty={50} rotate={22} />
        </div>

        {/* Chip mark */}
        <div className="teaser-rise relative mb-8" style={{ width: 62, height: 62, animationDelay: '0ms' }}>
          <Chip size={62} />
        </div>

        {/* Coming soon pill */}
        <div className="teaser-rise glass-card chip-border-white mb-7 inline-flex items-center gap-2.5 px-4 py-1.5" style={{ animationDelay: '70ms', borderRadius: '999px' }}>
          <span className="relative flex h-2 w-2">
            <span className="teaser-pulse absolute inline-flex h-full w-full rounded-full" style={{ background: '#57c98a' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#57c98a' }} />
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">Coming soon</span>
          <span className="h-3 w-px bg-white/15" aria-hidden="true" />
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#57c98a' }}>August 2026</span>
        </div>

        {/* Wordmark */}
        <h1 className="teaser-rise font-mono text-6xl font-bold tracking-tight sm:text-7xl" style={{ animationDelay: '140ms' }}>
          <span className="teaser-shimmer">Preflop</span>
        </h1>

        {/* Tagline */}
        <p className="teaser-rise mt-6 text-balance text-3xl font-bold leading-tight text-white sm:text-4xl" style={{ animationDelay: '210ms' }}>
          No arguments needed
        </p>

        {/* Subtext — monospace to match the wordmark, two muted poker hues */}
        <p className="teaser-rise mt-3 text-balance font-mono text-base font-semibold tracking-tight sm:text-lg" style={{ animationDelay: '250ms' }}>
          <span style={{ color: '#c2a36a' }}>Revolutionizing</span>{' '}
          <span style={{ color: '#5fb189' }}>poker ledger</span>
        </p>

        {/* CTA */}
        <div className="teaser-rise mt-9" style={{ animationDelay: '350ms' }}>
          <WaitlistModal />
        </div>
      </div>
    </main>
  )
}
