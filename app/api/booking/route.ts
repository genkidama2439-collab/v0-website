import { NextResponse } from 'next/server'
import { generateBookingNumber, sendToGAS, createAPIResponse, createAPIError } from '@/lib/services/gas-service'
import { validateEmail, validateRequired } from '@/lib/utils/validation'

interface BookingRequest {
  selectedDate: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  planName: string
  selectedTime?: string
  participants: Array<{ category: string }>
  totalPrice: number
  staffName?: string
  specialRequests?: string
}

// 必須フィールドの検証
const validateBookingRequest = (data: BookingRequest): { valid: boolean; error?: string } => {
  const { selectedDate, customerName, customerEmail, participants } = data

  // 基本フィールド
  const dateValidation = validateRequired(selectedDate)
  if (!dateValidation.valid) return { valid: false, error: '予約日が必須です' }

  const nameValidation = validateRequired(customerName)
  if (!nameValidation.valid) return { valid: false, error: '氏名が必須です' }

  const emailValidation = validateEmail(customerEmail)
  if (!emailValidation.valid) return { valid: false, error: emailValidation.error }

  // 参加者
  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: '参加者情報が必要です' }
  }

  return { valid: true }
}

// 参加者数をカテゴリ別に集計
const countParticipantsByCategory = (participants: Array<{ category: string }>) => {
  return {
    adultCount: participants.filter((p) => p.category === 'adult').length,
    childCount: participants.filter((p) => p.category === 'child').length,
    under3Count: participants.filter((p) => p.category === 'under3').length,
  }
}

// GAS用ペイロードを構築
const buildGASPayload = (bookingData: BookingRequest, bookingNumber: string) => {
  const { adultCount, childCount, under3Count } = countParticipantsByCategory(bookingData.participants)

  return {
    bookingNumber,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail,
    customerPhone: bookingData.customerPhone || '',
    planName: bookingData.planName,
    selectedDate: bookingData.selectedDate,
    selectedTime: bookingData.selectedTime || 'サンセット時刻（後日連絡）',
    participants: bookingData.participants,
    adultCount,
    childCount,
    under3Count,
    totalPrice: bookingData.totalPrice,
    staffName: bookingData.staffName || '',
    specialRequests: bookingData.specialRequests || '',
  }
}

export async function POST(request: Request) {
  try {
    // JSONパース
    let bookingData: BookingRequest
    try {
      bookingData = await request.json()
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError)
      return NextResponse.json(
        createAPIError(parseError, 'リクエストの形式が正しくありません'),
        { status: 400 }
      )
    }

    // リクエスト検証
    const validation = validateBookingRequest(bookingData)
    if (!validation.valid) {
      console.error('[v0] Validation error:', validation.error)
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      )
    }

    // 予約番号生成
    const bookingNumber = generateBookingNumber()

    // GASペイロード構築
    const gasPayload = buildGASPayload(bookingData, bookingNumber)

    // GASに送信
    try {
      const result = await sendToGAS(gasPayload)
      console.log('[v0] Booking created successfully:', { bookingNumber })

      return NextResponse.json(
        createAPIResponse(true, { bookingNumber, result }, '予約が正常に作成されました')
      )
    } catch (gasError) {
      console.error('[v0] GAS error:', gasError)
      return NextResponse.json(
        createAPIError(gasError, 'GAS連携に失敗しました'),
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('[v0] Booking API error:', error)
    return NextResponse.json(createAPIError(error, '予約処理中にエラーが発生しました'), {
      status: 500,
    })
  }
}