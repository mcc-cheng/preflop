export interface PlayerStat {
  user: {
    id: string
    name: string
    username: string
  }
  totalBuyIn: number
  totalCashOut: number
  net: number
  pendingRequest: any | null
}

export interface RoomDashboardProps {
  room: any
  code: string
  settings: any
  currentUserId: string
  playerStats: PlayerStat[]
  totalBuyIns: number
  totalCashOuts: number
  tableBalance: number
  pendingCashOutRequests: any[]
  pendingBuyInRequests: any[]
  requestActionLoading: string | null
  copiedRoomCode: boolean
  onOpenEvent: (type: 'BUY_IN' | 'REBUY' | 'CASH_OUT') => void
  onEndRoom: () => void
  onCopyRoomCode: () => void
  onCashOutAction: (id: string, action: 'approve' | 'reject') => void
  onBuyInAction: (id: string, action: 'approve' | 'reject') => void
  onShowQR: () => void
  onShowSettlement: () => void
  onEditRoom?: (updates: Record<string, any>) => Promise<void>
}
