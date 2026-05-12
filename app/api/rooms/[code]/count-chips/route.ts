import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError, jsonError, roomCodeSchema } from '@/lib/api'
import { z } from 'zod'

const CountChipsSchema = z.object({
  imageData: z.string().min(1), // full base64 data URL: data:<mediaType>;base64,<data>
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await requireAuth()
    const { code: rawCode } = await params
    const code = roomCodeSchema.parse(rawCode)

    const body = await request.json()
    const { imageData } = CountChipsSchema.parse(body)

    const room = await prisma.room.findFirst({
      where: { code, endedAt: null },
      include: { chipTypes: { orderBy: { denomination: 'asc' } } },
    })

    if (!room) return jsonError('Room not found', 404)

    const isMember = await prisma.roomMember.findFirst({
      where: { roomId: room.id, userId: user.id },
    })
    if (!isMember) return jsonError('Not a member of this room', 403)

    if (room.chipTypes.length === 0) return jsonError('Room has no chip configuration', 400)

    // Split data URL into media type and raw base64
    const commaIdx = imageData.indexOf(',')
    const header = imageData.slice(0, commaIdx)
    const base64Data = imageData.slice(commaIdx + 1)
    const mediaType = header.replace('data:', '').replace(';base64', '')

    // Build prompt with chip config injected
    const chipValueList = room.chipTypes
      .map(c => `${c.color} = $${(c.denomination / 100).toFixed(2)}`)
      .join(', ')
    const jsonColorFields = room.chipTypes.map(c => `${c.color}: N`).join(', ')
    const prompt =
      `This is a photo of poker chips. The chips will be in flat stacks that are visible ` +
      `horizontally. Chip values: ${chipValueList}. Count each denomination. For stacks, ` +
      `estimate height from the side edges if visible. Return JSON: ` +
      `{${jsonColorFields}, total: $X}`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Data },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })

    if (!claudeRes.ok) {
      return jsonError('Vision API unavailable', 502)
    }

    const claudeData = await claudeRes.json()
    const text: string = claudeData.content?.[0]?.text ?? ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return jsonError('Could not parse chip count response', 422)

    const parsed = JSON.parse(jsonMatch[0])
    const totalStr = String(parsed.total ?? '')
    const total = parseFloat(totalStr.replace('$', ''))
    if (isNaN(total) || total <= 0) return jsonError('Could not parse total from response', 422)

    return NextResponse.json({ amountCents: Math.round(total * 100) })
  } catch (error: any) {
    return handleApiError(error)
  }
}
