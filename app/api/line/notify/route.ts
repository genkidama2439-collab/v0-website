import { NextResponse } from 'next/server'
import { messagingApi } from '@line/bot-sdk'

const { MessagingApiClient } = messagingApi

interface NotifyRequest {
  type?: 'booking_status' | 'location_guide'
  lineUserId: string
  bookingNumber?: string
  customerName?: string
  planName?: string
  selectedDate?: string
  selectedTime?: string
  status?: '確定' | 'キャンセル'
  customMessage?: string
}

const NOTIFY_SECRET = process.env.LINE_NOTIFY_SECRET

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (NOTIFY_SECRET && authHeader !== `Bearer ${NOTIFY_SECRET}`) {
      return NextResponse.json({ success: false, error: '認証エラー' }, { status: 401 })
    }

    const body: NotifyRequest = await request.json()

    if (!body.lineUserId) {
      return NextResponse.json(
        { success: false, error: 'lineUserId は必須です' },
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

    // メッセージ構築
    const type = body.type || 'booking_status'
    let message = ''

    if (type === 'location_guide') {
      // GASが作ったカスタムメッセージをそのまま送る
      if (!body.customMessage) {
        return NextResponse.json(
          { success: false, error: 'customMessage は必須です（location_guide）' },
          { status: 400 }
        )
      }
      message = body.customMessage

    } else if (type === 'booking_status') {
      if (body.status === '確定') {
        const time = body.selectedTime || '後日ご連絡'
        message = `🐢 ご予約が確定しました！\n\n${body.customerName} 様\n\n予約番号：${body.bookingNumber}\nプラン：${body.planName}\n日時：${body.selectedDate} ${time}\n\nご予約ありがとうございます。当日お会いできることを楽しみにしております！\n\n海亀兄弟`
      } else if (body.status === 'キャンセル') {
        message = `ご予約のキャンセルを承りました。\n\n${body.customerName} 様\n予約番号：${body.bookingNumber}\n\nまたのご利用をお待ちしております。\n\n海亀兄弟`
      } else {
        return NextResponse.json(
          { success: false, error: 'status は「確定」または「キャンセル」を指定してください' },
          { status: 400 }
        )
      }
    }

    await client.pushMessage({
      to: body.lineUserId,
      messages: [{ type: 'text', text: message }],
    })

    console.log(`[LINE Notify] Sent ${type} message to ${body.lineUserId}`)

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
