import { NextResponse } from 'next/server'
import { generateBookingNumber, sendToGAS, createAPIResponse, createAPIError } from '@/lib/services/gas-service'
import { validateRequired } from '@/lib/utils/validation'

interface BookingRequest {
  selectedDate: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  planName: string
  selectedTime?: string
  participants: Array<{ category: string }>
  totalPrice: number
  staffName?: string
  specialRequests?: string
  lineUserId?: string | null
  lineDisplayName?: string | null
  couponCode?: string
  couponDiscount?: number
}

// サーバー側クーポン検証（クライアント側と同じリストを管理）
const COUPON_LIST: Record<string, number> = {
  "UMIGAME500": 500,
  "カメハメハ": 1000,
}

const validateCoupon = (couponCode: string | undefined, couponDiscount: number | undefined, participants: Array<{ category: string }>): { validDiscount: number; validCode: string } => {
  if (!couponCode || !couponDiscount) {
    return { validDiscount: 0, validCode: '' }
  }

  const discountPerPerson = COUPON_LIST[couponCode]
  if (!discountPerPerson) {
    // 無効なクーポンコード → 割引を0にする
    return { validDiscount: 0, validCode: '' }
  }

  const totalPeople = participants.filter((p) => p.category === 'adult').length
    + participants.filter((p) => p.category === 'child').length
  const expectedDiscount = totalPeople * discountPerPerson

  // クライアントから送られた割引額が正しいか検証
  if (couponDiscount !== expectedDiscount) {
    return { validDiscount: expectedDiscount, validCode: couponCode }
  }

  return { validDiscount: couponDiscount, validCode: couponCode }
}

// 必須フィールドの検証
const validateBookingRequest = (data: BookingRequest): { valid: boolean; error?: string } => {
  const { selectedDate, customerName, participants } = data

  // 基本フィールド
  const dateValidation = validateRequired(selectedDate)
  if (!dateValidation.valid) return { valid: false, error: '予約日が必須です' }

  const nameValidation = validateRequired(customerName)
  if (!nameValidation.valid) return { valid: false, error: '氏名が必須です' }

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
const buildGASPayload = (bookingData: BookingRequest, bookingNumber: string, validatedCoupon: { validDiscount: number; validCode: string }) => {
  const { adultCount, childCount, under3Count } = countParticipantsByCategory(bookingData.participants)

  return {
    bookingNumber,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail || '',
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
    lineUserId: bookingData.lineUserId || '',
    lineDisplayName: bookingData.lineDisplayName || '',
    couponCode: validatedCoupon.validCode,
    couponDiscount: validatedCoupon.validDiscount,
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

    // クーポンをサーバー側で再検証
    const validatedCoupon = validateCoupon(bookingData.couponCode, bookingData.couponDiscount, bookingData.participants)

    // GASペイロード構築
    const gasPayload = buildGASPayload(bookingData, bookingNumber, validatedCoupon)

    // GASに送信
    try {
      const result = await sendToGAS(gasPayload)
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