'use client'

import { useRef, useState } from 'react'
import { ModalShell, CurrencyInput, InlineError, SecondaryButton } from '@/components/ui'

interface ChipType {
  color: string
  denomination: number // cents
}

interface Props {
  roomCode: string
  eventType: 'BUY_IN' | 'REBUY' | 'CASH_OUT'
  defaultAmount: number
  isHost?: boolean
  chipTypes?: ChipType[]
  onClose: () => void
  onSuccess: () => void
}

// ── Part 1: HEIC detection + canvas conversion ────────────────────────────────

function isHeic(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

async function convertToJpeg(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) { resolve(null); return }
          const name = file.name.replace(/\.(heic|heif)$/i, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// ─────────────────────────────────────────────────────────────────────────────

export default function EventModal({
  roomCode, eventType, defaultAmount, isHost, chipTypes, onClose, onSuccess,
}: Props) {
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [counting, setCounting] = useState(false)
  const [countError, setCountError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCashOut = eventType === 'CASH_OUT'
  const requiresImage = isCashOut && !isHost

  const sortedChips = isCashOut && chipTypes?.length
    ? [...chipTypes].sort((a, b) => a.denomination - b.denomination)
    : []

  // ── Part 1: handle image selection with HEIC conversion ──────────────────

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0] ?? null
    if (!raw) { setImageFile(null); setImagePreview(''); return }

    let file = raw
    if (isHeic(raw)) {
      const converted = await convertToJpeg(raw)
      if (!converted) {
        setError('Could not process this image. Please take a photo instead of uploading from your library.')
        setImageFile(null)
        setImagePreview('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      file = converted
    }

    setError('')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Count My Chips via vision API ─────────────────────────────────────────

  const handleCountChips = async () => {
    if (!imagePreview) return
    setCounting(true)
    setCountError('')
    try {
      const res = await fetch(`/api/rooms/${roomCode}/count-chips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: imagePreview }),
      })
      const data = await res.json()
      if (!res.ok || typeof data.amountCents !== 'number') throw new Error()
      setAmount((data.amountCents / 100).toFixed(2))
    } catch {
      setCountError('Could not count chips automatically. Please enter the amount manually.')
    } finally {
      setCounting(false)
    }
  }

  // ── Form submission ───────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (requiresImage && !imageFile) {
      setError('Please attach a photo of your chip stack before submitting.')
      return
    }
    setLoading(true)
    setError('')

    let res: Response
    if (isCashOut) {
      const fd = new FormData()
      fd.append('type', eventType)
      fd.append('amount', amount)
      if (imageFile) fd.append('image', imageFile)
      res = await fetch(`/api/rooms/${roomCode}/events`, { method: 'POST', body: fd })
    } else {
      res = await fetch(`/api/rooms/${roomCode}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: eventType, amount: parseFloat(amount) }),
      })
    }

    if (res.ok || res.status === 202) {
      onSuccess()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create event')
      setLoading(false)
    }
  }

  const title = eventType === 'BUY_IN' ? 'Buy In' : eventType === 'REBUY' ? 'Rebuy' : 'Request Cash Out'
  const submitLabel = isCashOut ? 'Request Cash Out' : 'Submit'
  const submitClassName = {
    BUY_IN:   'flex-1 py-2 bg-primary text-on-primary font-medium rounded-xl active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all',
    REBUY:    'flex-1 py-2 bg-chip-purple-dim border border-chip-purple/35 chip-text-purple font-medium rounded-xl hover:bg-chip-purple/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all',
    CASH_OUT: 'flex-1 py-2 bg-chip-green-dim border border-chip-green/35 chip-text-green font-medium rounded-xl hover:bg-chip-green/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all',
  }[eventType]

  return (
    <ModalShell onClose={onClose}>
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>

        {isCashOut && (
          <p className="text-sm text-warning mb-4">
            Your request will be sent to the host for approval.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Amount (USD)
            </label>
            <CurrencyInput
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0.01"
              required
              autoFocus
            />

            {/* ── Part 2: quick-add denomination buttons (cash-out only) ── */}
            {sortedChips.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-2 pb-0.5">
                {sortedChips.map((chip) => {
                  const dollars = chip.denomination / 100
                  const label = Number.isInteger(dollars) ? `+$${dollars}` : `+$${dollars.toFixed(2)}`
                  return (
                    <button
                      key={chip.color}
                      type="button"
                      onClick={() => {
                        const current = Math.max(0, parseFloat(amount) || 0)
                        setAmount((current + dollars).toFixed(2))
                      }}
                      className="flex-shrink-0 px-3 py-1 rounded-full border border-outline text-on-surface-variant hover:border-chip-green/35 hover:text-chip-green-text hover:bg-chip-green-dim text-xs font-medium active:scale-95 transition-all duration-150"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Part 1: image upload with HEIC detection ── */}
          {requiresImage && (
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">
                Chip stack photo <span className="chip-text-red">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border border-dashed border-outline hover:border-chip-white/25 rounded-xl text-on-surface-variant hover:text-on-surface text-sm transition-colors duration-150"
              >
                {imageFile ? imageFile.name : 'Tap to take / choose a photo'}
              </button>
              {imagePreview && (
                <>
                  <img
                    src={imagePreview}
                    alt="Chip stack preview"
                    className="mt-2 w-full max-h-48 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleCountChips}
                    disabled={counting}
                    className="mt-2 w-full py-2 bg-chip-purple-dim border border-chip-purple/35 chip-text-purple hover:bg-chip-purple/20 disabled:opacity-50 text-sm rounded-xl font-medium transition-all duration-150"
                  >
                    {counting ? 'Counting…' : '✦ Count My Chips'}
                  </button>
                  {countError && (
                    <p className="text-xs text-warning mt-1">{countError}</p>
                  )}
                </>
              )}
              {!imageFile && (
                <p className="text-xs text-on-surface-variant mt-1">Required — hosts can see this photo</p>
              )}
            </div>
          )}

          <InlineError message={error} />

          <div className="flex gap-3">
            <SecondaryButton type="button" onClick={onClose} className="flex-1 py-2">
              Cancel
            </SecondaryButton>
            <button
              type="submit"
              disabled={loading || (requiresImage && !imageFile)}
              className={submitClassName}
            >
              {loading ? 'Submitting...' : submitLabel}
            </button>
          </div>
        </form>
    </ModalShell>
  )
}
