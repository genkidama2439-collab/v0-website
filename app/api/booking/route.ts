import { NextResponse } from 'next/server'
import { generateBookingNumber, sendToGAS, createAPIResponse, createAPIError } from '@/lib/services/gas-service'
import { validateRequired } from '@/lib/utils/validation'
import { PLANS, STAFF_FEE } from '@/lib/data'
import { calculateCouponDiscount } from '@/lib/constants/coupons'

interface BookingRequest {
  selectedPlan: string
  selectedDate: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  planName: string
  selectedTime?: string
  selectedStaff?: string
  participants: Array<{ category: string }>
  totalPrice?: number
  staffName?: string
  specialRequests?: string
  lineUserId?: string | null
  lineDisplayName?: string | null
  couponCode?: string
  couponDiscount?: number
}

// 必須フィールドの検証
const validateBookingRequest = (data: BookingRequest): { valid: boolean; error?: string } => {
  const { selectedDate, customerName, participants, selectedPlan } = data

  if (!validateRequired(selectedPlan).valid) return { valid: false, error: 'プランが必須です' }
  if (!validateRequired(selectedDate).valid) return { valid: false, error: '予約日が必須です' }
  if (!validateRequired(customerName).valid) return { valid: false, error: '氏名が必須です' }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: '参加者情報が必要です' }
  }

  return { valid: true }
}

// 参加者数をカテゴリ別に集計
const countParticipantsByCategory = (participants: Array<{ category: string }>) => ({
  adultCount: participants.filter((p) => p.category === 'adult').length,
  childCount: participants.filter((p) => p.category === 'child').length,
  under3Count: participants.filter((p) => p.category === 'under3').length,
})

// サーバー側で料金を再計算（クライアントから送られた値は信頼しない）
const calculateServerSidePrice = (
  plan: typeof PLANS[number],
  participants: Array<{ category: string }>,
  selectedStaff: string | undefined,
  couponDiscount: number
): number => {
  const { adultCount, childCount, under3Count } = countParticipantsByCategory(participants)
  const adultPrice = plan.price
  const childPrice = plan.childPrice ?? plan.price
  const under3Price = plan.id === 'S3' ? 0 : childPrice

  const baseTotal = adultCount * adultPrice + childCount * childPrice + under3Count * under3Price
  const vipSurcharge = plan.vipSurcharge ?? 0
  const staffFee = selectedStaff ? STAFF_FEE : 0

  return Math.max(0, baseTotal + vipSurcharge + staffFee - couponDiscount)
}

// GAS用ペイロードを構築
const buildGASPayload = (
  bookingData: BookingRequest,
  bookingNumber: string,
  validatedCoupon: { discount: number; code: string },
  serverTotalPrice: number
) => {
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
    totalPrice: serverTotalPrice,
    staffName: bookingData.staffName || '',
    specialRequests: bookingData.specialRequests || '',
    lineUserId: bookingData.lineUserId || '',
    lineDisplayName: bookingData.lineDisplayName || '',
    couponCode: validatedCoupon.code,
    couponDiscount: validatedCoupon.discount,
  }
}

export async function POST(request: Request) {
  try {
    let bookingData: BookingRequest
    try {
      bookingData = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        createAPIError(parseError, 'リクエストの形式が正しくありません'),
        { status: 400 }
      )
    }

    const validation = validateBookingRequest(bookingData)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const plan = PLANS.find((p) => p.id === bookingData.selectedPlan)
    if (!plan) {
      return NextResponse.json(
        { success: false, error: '無効なプランです', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const bookingNumber = generateBookingNumber()

    // クーポンをサーバー側で再計算（コードから直接金額を算出）
    const validatedCoupon = calculateCouponDiscount(bookingData.couponCode, bookingData.participants)

    // 合計金額もサーバー側で再計算（クライアント値は参考情報として無視）
    const serverTotalPrice = calculateServerSidePrice(
      plan,
      bookingData.participants,
      bookingData.selectedStaff,
      validatedCoupon.discount
    )

    const gasPayload = buildGASPayload(bookingData, bookingNumber, validatedCoupon, serverTotalPrice)

    try {
      const result = await sendToGAS(gasPayload)
      return NextResponse.json(
        createAPIResponse(
          true,
          {
            bookingNumber,
            totalPrice: serverTotalPrice,
            couponDiscount: validatedCoupon.discount,
            couponCode: validatedCoupon.code,
            result,
          },
          '予約が正常に作成されました'
        )
      )
    } catch (gasError) {
      return NextResponse.json(
        createAPIError(gasError, 'GAS連携に失敗しました'),
        { status: 502 }
      )
    }
  } catch (error) {
    return NextResponse.json(createAPIError(error, '予約処理中にエラーが発生しました'), {
      status: 500,
    })
  }
}
