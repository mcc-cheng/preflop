'use client'

import { useRef } from 'react'

interface ImageUploadZoneProps {
  imageFile: File | null
  imagePreview: string
  counting: boolean
  countError: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCountChips: () => void
  required?: boolean
}

export function ImageUploadZone({
  imageFile,
  imagePreview,
  counting,
  countError,
  onFileChange,
  onCountChips,
  required,
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="hidden"
      />

      <div className="relative w-full h-48 border-2 border-dashed border-chip-white/15 rounded-2xl overflow-hidden">
        {imagePreview ? (
          <>
            <img
              src={imagePreview}
              alt="Chip stack"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
            <button
              type="button"
              onClick={onCountChips}
              disabled={counting}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 border border-chip-green/35 chip-text-green text-sm px-5 py-2 active:scale-95 whitespace-nowrap disabled:pointer-events-none transition-all duration-200"
            >
              {counting ? 'Counting...' : '✦ Count My Chips'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-full gap-2"
          >
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-on-surface-variant">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-on-surface-variant text-sm">
              {required ? 'Photo required' : 'Tap to take a photo'}
            </span>
          </button>
        )}
      </div>

      {countError && (
        <p className="chip-text-red text-sm mt-2 text-center">{countError}</p>
      )}

      {!imageFile && required && (
        <p className="text-on-surface-variant text-xs mt-1.5">Required — host will review this photo</p>
      )}
    </div>
  )
}
