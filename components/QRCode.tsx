'use client'

import { memo, useMemo } from 'react'
import QRCodeLib from 'react-qr-code'

interface QRCodeProps {
  value: string
  size?: number
  label?: string
}

function QRCode({ value, size = 128, label }: QRCodeProps) {
  const safeValue = String(value || '').trim()
  const safeSize = Math.min(Math.max(Math.round(size), 96), 720)
  const padding = Math.max(12, Math.round(safeSize * 0.06))
  const innerSize = Math.max(64, safeSize - padding * 2)
  const qrLabel = label || `QR code for ${safeValue || 'room code'}`

  const wrapperStyle = useMemo(
    () => ({
      width: safeSize,
      height: safeSize,
      padding,
    }),
    [padding, safeSize]
  )

  if (!safeValue) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-outline bg-surface text-center text-sm text-on-surface-variant"
        style={wrapperStyle}
        role="status"
      >
        QR code unavailable
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-lg bg-white shadow-2xl ring-1 ring-slate-200"
      style={wrapperStyle}
      aria-label={qrLabel}
      role="img"
    >
      <QRCodeLib
        value={safeValue}
        size={innerSize}
        fgColor="#0f172a"
        bgColor="#ffffff"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default memo(QRCode)
