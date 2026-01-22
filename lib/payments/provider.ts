/**
 * PaymentsProvider interface for handling money custody and transfers.
 * 
 * MVP: Using MockPaymentsProvider that logs actions.
 * FUTURE: Implement PlaidStripeProvider with:
 *   - Plaid Link for bank account linking
 *   - Stripe Connect for ACH transfers
 *   - Proper custody/escrow during game sessions
 *   - Compliance: KYC/AML checks
 *   - Legal: Gambling/sweepstakes regulations consideration
 */
export interface PaymentsProvider {
  /**
   * Authorize and hold funds from user's account for the game session.
   * @returns holdId - reference to the hold transaction
   */
  authorizeAndHold(userId: string, amountCents: number, roomId: string): Promise<string>

  /**
   * Release a hold (e.g., if player leaves before game ends)
   */
  releaseHold(holdId: string): Promise<void>

  /**
   * Transfer money from one user to another (settlement)
   * @returns transferId - reference to the transfer transaction
   */
  transfer(fromUserId: string, toUserId: string, amountCents: number, roomId: string): Promise<string>
}

/**
 * Mock implementation for MVP.
 * Logs actions but doesn't actually move money.
 */
export class MockPaymentsProvider implements PaymentsProvider {
  private holds = new Map<string, { userId: string; amountCents: number; roomId: string }>()
  private transfers: Array<{ id: string; from: string; to: string; amount: number }> = []

  async authorizeAndHold(userId: string, amountCents: number, roomId: string): Promise<string> {
    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[MockPayments] HOLD: ${holdId}`, {
      userId,
      amountCents: amountCents / 100,
      roomId
    })

    this.holds.set(holdId, { userId, amountCents, roomId })
    return holdId
  }

  async releaseHold(holdId: string): Promise<void> {
    const hold = this.holds.get(holdId)
    
    if (hold) {
      console.log(`[MockPayments] RELEASE HOLD: ${holdId}`, hold)
      this.holds.delete(holdId)
    }
  }

  async transfer(fromUserId: string, toUserId: string, amountCents: number, roomId: string): Promise<string> {
    const transferId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[MockPayments] TRANSFER: ${transferId}`, {
      from: fromUserId,
      to: toUserId,
      amountCents: amountCents / 100,
      roomId
    })

    this.transfers.push({
      id: transferId,
      from: fromUserId,
      to: toUserId,
      amount: amountCents
    })

    return transferId
  }
}

// Singleton instance
export const paymentsProvider: PaymentsProvider = new MockPaymentsProvider()
