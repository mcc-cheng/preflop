'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'

interface QRScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

const ROOM_CODE_RE = /^[A-Z0-9]{6}$/

function extractRoomCode(raw: string): string | null {
  const trimmed = raw.trim()

  // Plain 6-char code
  if (ROOM_CODE_RE.test(trimmed.toUpperCase())) return trimmed.toUpperCase()

  // URL containing /rooms/<code> or /rooms/join?code=<code>
  try {
    const url = new URL(trimmed)
    const pathMatch = url.pathname.match(/\/rooms\/([A-Za-z0-9]{6})(?:\/|$)/)
    if (pathMatch) return pathMatch[1].toUpperCase()
    const param = url.searchParams.get('code')
    if (param && ROOM_CODE_RE.test(param.toUpperCase())) return param.toUpperCase()
  } catch {
    // not a URL
  }

  return null
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const pausedRef = useRef(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [invalidError, setInvalidError] = useState(false)
  const [ready, setReady] = useState(false)

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const scan = useCallback(() => {
    if (pausedRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scan)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (result) {
      const code = extractRoomCode(result.data)
      if (code) {
        stopCamera()
        onScan(code)
        return
      }
      // QR code detected but not a room code — pause and show error
      pausedRef.current = true
      setInvalidError(true)
      return
    }

    rafRef.current = requestAnimationFrame(scan)
  }, [onScan, stopCamera])

  useEffect(() => {
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current!
        video.srcObject = stream
        video.play().then(() => {
          setReady(true)
          rafRef.current = requestAnimationFrame(scan)
        })
      })
      .catch(err => {
        if (!cancelled) {
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera access denied. Please allow camera permissions and try again.'
              : 'Could not access camera.'
          )
        }
      })

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [scan, stopCamera])

  const resumeScanning = () => {
    setInvalidError(false)
    pausedRef.current = false
    rafRef.current = requestAnimationFrame(scan)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm rounded-xl bg-surface border border-outline overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline">
          <h2 className="text-on-surface font-semibold">Scan Room QR Code</h2>
          <button
            onClick={handleClose}
            className="text-on-surface-variant hover:text-on-surface text-2xl leading-none transition-colors duration-150"
            aria-label="Close scanner"
          >
            &times;
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: '1' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {!ready && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-on-surface-variant text-sm">Starting camera…</div>
            </div>
          )}

          {ready && !invalidError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-chip-green-text rounded-xl opacity-70" />
            </div>
          )}

          {invalidError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4 p-6">
              <div className="w-14 h-14 rounded-full bg-chip-red-dim flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 chip-text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-on-surface font-semibold text-lg">Invalid Room QR Code</p>
                <p className="text-on-surface-variant text-sm mt-1">This QR code is not for a Preflop room.</p>
              </div>
              <button
                onClick={resumeScanning}
                className="px-5 py-2 bg-surface-raised border border-outline text-on-surface text-sm font-medium rounded-xl hover:bg-outline transition-colors duration-150"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {cameraError ? (
          <div className="p-4 chip-text-red text-sm text-center">{cameraError}</div>
        ) : (
          <div className="p-4 text-on-surface-variant text-sm text-center">
            {invalidError ? ' ' : 'Point your camera at the room QR code'}
          </div>
        )}
      </div>
    </div>
  )
}
