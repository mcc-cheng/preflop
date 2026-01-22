import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      passwordHash: await bcrypt.hash('password', 10),
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob',
      passwordHash: await bcrypt.hash('password', 10),
    },
  })

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      name: 'Charlie',
      passwordHash: await bcrypt.hash('password', 10),
    },
  })

  console.log('✅ Created users:', { alice: alice.email, bob: bob.email, charlie: charlie.email })

  // Create demo room
  const room = await prisma.room.create({
    data: {
      code: 'DEMO01',
      hostId: alice.id,
      settings: {
        name: 'Friday Night Poker',
        defaultBuyIn: 100,
        blinds: '1/2',
        currency: 'USD',
        maxPlayers: 9,
      },
      members: {
        create: [
          { userId: alice.id, role: 'HOST' },
          { userId: bob.id, role: 'PLAYER' },
          { userId: charlie.id, role: 'PLAYER' },
        ],
      },
    },
  })

  console.log('✅ Created room:', room.code)

  // Create sample events
  await prisma.event.createMany({
    data: [
      // Alice buys in $100
      { roomId: room.id, userId: alice.id, type: 'BUY_IN', amount: 10000 },
      // Bob buys in $100
      { roomId: room.id, userId: bob.id, type: 'BUY_IN', amount: 10000 },
      // Charlie buys in $100
      { roomId: room.id, userId: charlie.id, type: 'BUY_IN', amount: 10000 },
      // Alice rebuys $50
      { roomId: room.id, userId: alice.id, type: 'REBUY', amount: 5000 },
      // Bob cashes out $250 (big winner!)
      { roomId: room.id, userId: bob.id, type: 'CASH_OUT', amount: 25000 },
      // Charlie cashes out $50 (lost $50)
      { roomId: room.id, userId: charlie.id, type: 'CASH_OUT', amount: 5000 },
    ],
  })

  console.log('✅ Created sample events')
  console.log('\n📊 Summary:')
  console.log('- Alice: $150 in, $0 out = -$150 (owes)')
  console.log('- Bob: $100 in, $250 out = +$150 (owed)')
  console.log('- Charlie: $100 in, $50 out = -$50 (owes)')
  console.log('\n🔐 Login credentials:')
  console.log('- alice@example.com / password')
  console.log('- bob@example.com / password')
  console.log('- charlie@example.com / password')
  console.log('\n🔗 Room code: DEMO01')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
