import { prisma } from '@/lib/prisma'

export const REQUIRED_PAYMENT_TYPE_COUNT = 2

export async function getPaymentSetupStatus(userId: string) {
  const paymentTypes = await prisma.paymentMethod.findMany({
    where: { userId },
    distinct: ['type'],
    select: { type: true },
  })

  const linkedTypeCount = paymentTypes.length

  return {
    linkedTypeCount,
    requiredTypeCount: REQUIRED_PAYMENT_TYPE_COUNT,
    canPlay: linkedTypeCount >= REQUIRED_PAYMENT_TYPE_COUNT,
  }
}

export async function requirePaymentSetup(userId: string) {
  const status = await getPaymentSetupStatus(userId)

  if (!status.canPlay) {
    throw new Error('PAYMENT_SETUP_REQUIRED')
  }

  return status
}

