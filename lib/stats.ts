import { prisma } from './prisma'
import { getPlayerNets } from './settlement'

/**
 * Update player statistics when a room ends.
 * Calculates total winnings, games played, and hours played for each player.
 */
export async function updatePlayerStatsForRoom(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: true,
      events: {
        include: {
          user: true
        }
      }
    }
  })

  if (!room || !room.endedAt) {
    return
  }

  // Calculate hours played (from room creation to end)
  const hoursPlayed = (room.endedAt.getTime() - room.createdAt.getTime()) / (1000 * 60 * 60)

  // Get player nets
  const playerNets = await getPlayerNets(roomId)

  // Update stats for each player
  for (const member of room.members) {
    const net = playerNets.find(n => n.userId === member.userId)
    const netWinnings = net ? net.netCents : 0

    // Get or create stats
    let stats = await prisma.userStats.findUnique({
      where: { userId: member.userId }
    })

    if (!stats) {
      stats = await prisma.userStats.create({
        data: { userId: member.userId }
      })
    }

    // Calculate player's buy-ins and cash-outs
    const playerEvents = room.events.filter(e => e.userId === member.userId)
    const buyIns = playerEvents
      .filter(e => e.type === 'BUY_IN' || e.type === 'REBUY')
      .reduce((sum, e) => sum + e.amount, 0)
    const cashOuts = playerEvents
      .filter(e => e.type === 'CASH_OUT')
      .reduce((sum, e) => sum + e.amount, 0)

    // Update stats
    await prisma.userStats.update({
      where: { userId: member.userId },
      data: {
        gamesPlayed: { increment: 1 },
        hoursPlayed: { increment: hoursPlayed },
        totalWinnings: { increment: netWinnings },
        totalBuyIns: { increment: buyIns },
        totalCashOuts: { increment: cashOuts }
      }
    })
  }
}
