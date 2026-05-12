import { prisma } from './prisma'
import { getPlayerNets } from './settlement'
import { EventType } from '@prisma/client'

export type UserStatsResult = {
  sessionsPlayed: number
  lifetimePnlCents: number
  totalBuyInsCents: number
  totalCashOutsCents: number
  winRate: number
  biggestWinCents: number
  biggestLossCents: number
  perRoomHistory: Array<{
    roomId: string
    roomCode: string
    endedAt: Date | null
    buyInsCents: number
    cashOutsCents: number
    netCents: number
  }>
  cumulativePnl: Array<{
    date: Date
    cumulativeCents: number
  }>
}

const ZERO_RESULT: UserStatsResult = {
  sessionsPlayed: 0,
  lifetimePnlCents: 0,
  totalBuyInsCents: 0,
  totalCashOutsCents: 0,
  winRate: 0,
  biggestWinCents: 0,
  biggestLossCents: 0,
  perRoomHistory: [],
  cumulativePnl: [],
}

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

export async function getUserStats(userId: string): Promise<UserStatsResult> {
  const [userStats, events] = await Promise.all([
    prisma.userStats.findUnique({ where: { userId } }),
    prisma.event.findMany({
      where: {
        userId,
        type: { in: [EventType.BUY_IN, EventType.REBUY, EventType.CASH_OUT] },
      },
      select: {
        type: true,
        amount: true,
        room: { select: { id: true, code: true, endedAt: true } },
      },
    }),
  ])

  if (!userStats) return ZERO_RESULT

  const roomMap = new Map<string, {
    roomId: string
    roomCode: string
    endedAt: Date | null
    buyInsCents: number
    cashOutsCents: number
  }>()

  for (const event of events) {
    const { id: roomId, code: roomCode, endedAt } = event.room
    if (!roomMap.has(roomId)) {
      roomMap.set(roomId, { roomId, roomCode, endedAt, buyInsCents: 0, cashOutsCents: 0 })
    }
    const room = roomMap.get(roomId)!
    if (event.type === EventType.BUY_IN || event.type === EventType.REBUY) {
      room.buyInsCents += event.amount
    } else if (event.type === EventType.CASH_OUT) {
      room.cashOutsCents += event.amount
    }
  }

  const perRoomHistory = Array.from(roomMap.values())
    .map(r => ({ ...r, netCents: r.cashOutsCents - r.buyInsCents }))
    .sort((a, b) => {
      if (!a.endedAt && !b.endedAt) return 0
      if (!a.endedAt) return 1
      if (!b.endedAt) return -1
      return b.endedAt.getTime() - a.endedAt.getTime()
    })

  const endedRooms = perRoomHistory.filter(r => r.endedAt !== null)
  const sessionsPlayed = userStats.gamesPlayed
  let winRate = 0
  if (sessionsPlayed > 0) {
    const wins = endedRooms.filter(r => r.netCents > 0).length
    winRate = wins / sessionsPlayed
  }

  let biggestWinCents = 0
  let biggestLossCents = 0
  for (const room of endedRooms) {
    if (room.netCents > biggestWinCents) biggestWinCents = room.netCents
    if (room.netCents < biggestLossCents) biggestLossCents = room.netCents
  }

  let running = 0
  const cumulativePnl = [...endedRooms]
    .sort((a, b) => (a.endedAt as Date).getTime() - (b.endedAt as Date).getTime())
    .map(r => {
      running += r.netCents
      return { date: r.endedAt as Date, cumulativeCents: running }
    })

  return {
    sessionsPlayed,
    lifetimePnlCents: userStats.totalWinnings,
    totalBuyInsCents: userStats.totalBuyIns,
    totalCashOutsCents: userStats.totalCashOuts,
    winRate,
    biggestWinCents,
    biggestLossCents,
    perRoomHistory,
    cumulativePnl,
  }
}
