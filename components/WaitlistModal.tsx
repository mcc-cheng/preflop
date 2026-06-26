'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Status = 'idle' | 'loading' | 'success' | 'error'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const fieldClass =
  'w-full rounded-xl border border-chip-white/12 bg-chip-white/[0.03] px-4 py-3.5 text-base text-on-surface placeholder:text-on-surface-variant/55 focus:border-chip-green/45 focus:outline-none focus:ring-2 focus:ring-chip-green/15 transition-colors disabled:opacity-60'

export function WaitlistModal({ triggerClassName, triggerChildren }: {
  triggerClassName?: string
  triggerChildren?: React.ReactNode
} = {}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', affiliation: '', xHandle: '', note: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const firstFieldRef = useRef<HTMLInputElement>(null)

  // Lock body scroll, focus first field, and close on Escape while open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function close() {
    setOpen(false)
    // Reset back to the form after the closing transition, so a reopened modal
    // is fresh (unless they succeeded — keep that brief on next open reset).
    setTimeout(() => {
      if (status === 'success') {
        setStatus('idle')
        setForm({ name: '', email: '', affiliation: '', xHandle: '', note: '' })
      }
    }, 200)
  }

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      if (status === 'error') setStatus('idle')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setStatus('error')
      setMessage('Please enter your name.')
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'landing' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Something went wrong. Try again.')
      }
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName ?? 'rounded-full bg-chip-white px-8 py-3.5 text-base font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40'}
      >
        {triggerChildren ?? 'Join the waitlist'}
      </button>

      {/* Modal — portaled to <body> so no transformed ancestor can trap its
          fixed positioning (which was shrinking it into the trigger's box). */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Join the Preflop waitlist"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm animate-dropdown-in"
            style={{ animationDuration: '120ms' }}
          />

          {/* Panel */}
          <div
            className="animate-dropdown-in glass-card chip-border-white relative w-full max-w-xl p-8 text-left shadow-2xl sm:p-10"
            style={{ background: 'rgba(17,17,24,0.92)' }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-chip-white/5 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {status === 'success' ? (
              <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
                <div className="chip-glow-green mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-chip-green/40 bg-chip-green/10">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="chip-text-green" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-on-surface">You&apos;re on the list.</h2>
                <p className="mt-2 max-w-xs text-sm text-on-surface-variant">
                  Thanks for joining — we&apos;ll email you the moment Preflop launches in August 2026.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 rounded-xl border border-chip-white/15 px-6 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-chip-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Join the waitlist</h2>
                <p className="mt-2 mb-6 text-base text-on-surface-variant">
                  Be first in line when Preflop launches. Takes 20 seconds.
                </p>

                <div className="space-y-3.5">
                  <input ref={firstFieldRef} type="text" autoComplete="name" placeholder="Name" value={form.name} onChange={update('name')} disabled={status === 'loading'} aria-label="Name" className={fieldClass} />
                  <input type="email" inputMode="email" autoComplete="email" placeholder="Email" value={form.email} onChange={update('email')} disabled={status === 'loading'} aria-label="Email" className={fieldClass} />
                  <input type="text" placeholder="Affiliation — company, school, or home game" value={form.affiliation} onChange={update('affiliation')} disabled={status === 'loading'} aria-label="Affiliation" className={fieldClass} />
                  <input type="text" placeholder="X handle (optional)" value={form.xHandle} onChange={update('xHandle')} disabled={status === 'loading'} aria-label="X handle" className={fieldClass} />
                  <textarea placeholder="Anything else? (optional)" value={form.note} onChange={update('note')} disabled={status === 'loading'} aria-label="Anything else" rows={3} className={`${fieldClass} resize-none`} />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="mt-6 w-full rounded-xl bg-chip-white px-5 py-3.5 text-base font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chip-white/40 disabled:opacity-60"
                >
                  {status === 'loading' ? 'Joining…' : 'Join the waitlist'}
                </button>

                <p className={`mt-2.5 min-h-[1rem] text-center text-sm transition-colors ${status === 'error' ? 'chip-text-red' : 'text-transparent'}`} aria-live="polite">
                  {status === 'error' ? message : ' '}
                </p>
              </form>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
