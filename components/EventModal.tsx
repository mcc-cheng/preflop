'use client'

import { useRef, useState } from 'react'

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
    BUY_IN: 'flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg',
    REBUY: 'flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white rounded-lg',
    CASH_OUT: 'flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg',
  }[eventType]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>

        {isCashOut && (
          <p className="text-sm text-amber-400 mb-4">
            Your request will be sent to the host for approval.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Part 3: $ prefix on amount input ── */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none select-none">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0.01"
                required
                autoFocus
              />
            </div>

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
                      className="flex-shrink-0 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-lg font-medium transition"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Chip stack photo <span className="text-red-400">*</span>
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
                className="w-full py-2.5 border-2 border-dashed border-slate-500 hover:border-slate-400 rounded-lg text-slate-400 hover:text-slate-300 text-sm transition"
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
                    className="mt-2 w-full py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white text-sm rounded-lg font-medium transition"
                  >
                    {counting ? 'Counting…' : '✦ Count My Chips'}
                  </button>
                  {countError && (
                    <p className="text-xs text-amber-400 mt-1">{countError}</p>
                  )}
                </>
              )}
              {!imageFile && (
                <p className="text-xs text-slate-500 mt-1">Required — hosts can see this photo</p>
              )}
            </div>
          )}

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (requiresImage && !imageFile)}
              className={submitClassName}
            >
              {loading ? 'Submitting...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
