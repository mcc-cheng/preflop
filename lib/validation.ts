import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,19}$/

export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'support', 'help', 'staff',
  'preflop', 'system', 'moderator', 'mod', 'official', 'team',
  'api', 'www', 'app', 'me', 'you', 'null', 'undefined',
])

export function isValidUsername(input: string): boolean {
  return USERNAME_REGEX.test(input) && !RESERVED_USERNAMES.has(input)
}

// Returns E.164 string (e.g. "+12125551234") or null if invalid.
// defaultCountry defaults to 'US' when not provided.
export function normalizePhoneToE164(
  input: string,
  defaultCountry: string = 'US',
): string | null {
  try {
    const cleaned = input.trim()
    if (!cleaned) return null
    if (!isValidPhoneNumber(cleaned, defaultCountry as any)) return null
    const parsed = parsePhoneNumber(cleaned, defaultCountry as any)
    return parsed.format('E.164')
  } catch {
    return null
  }
}
