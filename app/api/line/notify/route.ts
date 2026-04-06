import { NextResponse } from 'next/server'
import { messagingApi } from '@line/bot-sdk'

const { MessagingApiClient } = messagingApi

interface NotifyRequest {
  lineUserId: string
  bookingNumber: string
  customerName: string
  planName: string
  selectedDate: string
  selectedTime?: string
  status: '確定' | 'キャンセル'
  message?: string // カスタムメッセージ（任意）
}

// GASからの呼び出しを認証するシンプルなトークン
const NOTIFY_SECRET = process.env.LINE_NOTIFY_SECRET

export async function POST(request: Request) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization')
    if (NOTIFY_SECRET && authHeader !== `Bearer ${NOTIFY_SECRET}`) {
      return NextResponse.json({ success: false, error: '認証エラー' }, { status: 401 })
    }

    const body: NotifyRequest = await request.json()

    // 必須フィールド検証
    if (!body.lineUserId || !body.bookingNumber || !body.customerName) {
      return NextResponse.json(
        { success: false, error: 'lineUserId, bookingNumber, customerName は必須です' },
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
    const text = body.status === '確定'
      ? buildConfirmationMessage(body)
      : buildCancellationMessage(body)

    await client.pushMessage({
      to: body.lineUserId,
      messages: [{ type: 'text', text }],
    })

    console.log(`[LINE Notify] Sent ${body.status} message to ${body.lineUserId} for booking ${body.bookingNumber}`)

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

function buildConfirmationMessage(data: NotifyRequest): string {
  const time = data.selectedTime || '後日ご連絡'
  return `🐢 ご予約が確定しました！

${data.customerName} 様

予約番号: ${data.bookingNumber}
プラン: ${data.planName}
日時: ${data.selectedDate} ${time}

${data.message || 'ご予約ありがとうございます。当日お会いできることを楽しみにしております！'}

海亀兄弟`
}

function buildCancellationMessage(data: NotifyRequest): string {
  return `${data.customerName} 様

予約番号 ${data.bookingNumber} のご予約はキャンセルとなりました。

${data.message || 'ご不明な点がございましたらお気軽にお問い合わせください。'}

海亀兄弟`
}
