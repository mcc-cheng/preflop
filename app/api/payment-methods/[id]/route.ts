import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id }
    })

    if (!paymentMethod || paymentMethod.userId !== user.id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    await prisma.paymentMethod.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id }
    })

    if (!paymentMethod || paymentMethod.userId !== user.id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // If setting as default, unset others
    if (body.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      })
    }

    const updated = await prisma.paymentMethod.update({
      where: { id: params.id },
      data: body
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
