import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUserStats } from '@/lib/stats'
import { handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()
    const stats = await getUserStats(user.id)
    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
