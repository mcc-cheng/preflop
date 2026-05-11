import { PrismaClient } from '@prisma/client'
import { USERNAME_REGEX, RESERVED_USERNAMES, isValidUsername } from '../lib/validation'

const prisma = new PrismaClient()

function randomAlphanumeric(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

async function generateUniqueUsername(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `user_${randomAlphanumeric(8)}`
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })
    if (!existing) return candidate
  }
  throw new Error('Failed to generate unique username after 10 attempts')
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, usernameSetByUser: true },
  })

  console.log(`Found ${users.length} user(s) to process.`)

  for (const user of users) {
    if (user.usernameSetByUser) {
      console.log(`  SKIP  ${user.email} — usernameSetByUser already true`)
      continue
    }

    if (user.username) {
      // User already has a username (set by prior registration flow).
      // Mark as confirmed if it passes validation; otherwise generate new one.
      if (isValidUsername(user.username)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { usernameSetByUser: true },
        })
        console.log(`  KEEP  ${user.email} — confirmed existing username: ${user.username}`)
      } else {
        const generated = await generateUniqueUsername()
        await prisma.user.update({
          where: { id: user.id },
          data: { username: generated, usernameSetByUser: false },
        })
        console.log(`  GEN   ${user.email} — replaced invalid username with: ${generated}`)
      }
      continue
    }

    // No username at all — derive from email local-part or generate.
    const localPart = user.email.split('@')[0].toLowerCase()
    const localPartIsValid =
      USERNAME_REGEX.test(localPart) &&
      !RESERVED_USERNAMES.has(localPart)

    let assigned: string
    let setByUser: boolean

    if (localPartIsValid) {
      const conflict = await prisma.user.findUnique({ where: { username: localPart }, select: { id: true } })
      if (!conflict) {
        assigned = localPart
        setByUser = true
      } else {
        assigned = await generateUniqueUsername()
        setByUser = false
      }
    } else {
      assigned = await generateUniqueUsername()
      setByUser = false
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { username: assigned, usernameSetByUser: setByUser },
    })

    console.log(`  ASSIGN ${user.email} → ${assigned} (setByUser=${setByUser})`)
  }

  console.log('Backfill complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
