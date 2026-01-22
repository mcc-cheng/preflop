import { prisma } from './prisma'

export interface PlayerNet {
  userId: string
  netCents: number // positive = owed, negative = owes
}

export interface SettlementEdge {
  fromUserId: string
  toUserId: string
  amountCents: number
}

/**
 * Get net position for each player in a room.
 * Net = totalCashOut - totalBuyIn
 * Positive = player is owed money
 * Negative = player owes money
 */
export async function getPlayerNets(roomId: string): Promise<PlayerNet[]> {
  const events = await prisma.event.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' }
  })

  const netsByUser = new Map<string, number>()

  for (const event of events) {
    const current = netsByUser.get(event.userId) || 0
    
    if (event.type === 'BUY_IN' || event.type === 'REBUY') {
      // Money in: decreases net (player owes more)
      netsByUser.set(event.userId, current - event.amount)
    } else if (event.type === 'CASH_OUT') {
      // Money out: increases net (player is owed more)
      netsByUser.set(event.userId, current + event.amount)
    }
  }

  return Array.from(netsByUser.entries()).map(([userId, netCents]) => ({
    userId,
    netCents
  }))
}

/**
 * Compute settlement edges using greedy matching algorithm.
 * Minimizes number of transfers by matching largest debtor with largest creditor.
 * 
 * MVP: Simple greedy algorithm. Future: could optimize further with graph algorithms.
 */
export function computeSettlement(nets: PlayerNet[]): SettlementEdge[] {
  // Separate debtors (owe money, negative net) and creditors (owed money, positive net)
  const debtors = nets
    .filter(n => n.netCents < 0)
    .map(n => ({ userId: n.userId, amount: -n.netCents }))
    .sort((a, b) => b.amount - a.amount)

  const creditors = nets
    .filter(n => n.netCents > 0)
    .map(n => ({ userId: n.userId, amount: n.netCents }))
    .sort((a, b) => b.amount - a.amount)

  const edges: SettlementEdge[] = []

  let i = 0, j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]

    const transferAmount = Math.min(debtor.amount, creditor.amount)

    edges.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents: transferAmount
    })

    debtor.amount -= transferAmount
    creditor.amount -= transferAmount

    if (debtor.amount === 0) i++
    if (creditor.amount === 0) j++
  }

  return edges
}

/**
 * Save settlement to database for a room.
 */
export async function saveSettlement(roomId: string): Promise<SettlementEdge[]> {
  const nets = await getPlayerNets(roomId)
  const edges = computeSettlement(nets)

  await prisma.settlement.create({
    data: {
      roomId,
      edges: edges as any
    }
  })

  return edges
}
