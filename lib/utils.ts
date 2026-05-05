import { randomInt } from 'crypto'

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[randomInt(chars.length)]
  }
  return code
}

export function centsToUSD(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function usdToCents(usd: number): number {
  return Math.round(usd * 100)
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(date))
}
