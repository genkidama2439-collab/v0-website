import { NextResponse } from 'next/server'
import { messagingApi } from '@line/bot-sdk'

const { MessagingApiClient } = messagingApi

interface NotifyRequest {
  lineUserId: string
  customMessage: string
}

const NOTIFY_SECRET = process.env.LINE_NOTIFY_SECRET

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (NOTIFY_SECRET && authHeader !== `Bearer ${NOTIFY_SECRET}`) {
      return NextResponse.json({ success: false, error: '認証エラー' }, { status: 401 })
    }

    const body: NotifyRequest = await request.json()

    if (!body.lineUserId || !body.customMessage) {
      return NextResponse.json(
        { success: false, error: 'lineUserId と customMessage は必須です' },
        { status: 400 }
      )
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!channelAccessToken) {
      console.error('[LINE Notify] LINE_CHANNEL_ACCESS_TOKEN が未設定')
      return NextResponse.json(
        { success: false, error: 'LINE設定エラー' },
        { status: 500 }
      )
    }

    const client = new MessagingApiClient({ channelAccessToken })

    await client.pushMessage({
      to: body.lineUserId,
      messages: [{ type: 'text', text: body.customMessage }],
    })

    return NextResponse.json({ success: true, message: '通知を送信しました' })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[LINE Notify] Error:', msg, error)
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    )
  }
}
