import { NextResponse } from 'next/server'
import { generateBookingNumber, sendToGAS, createAPIResponse, createAPIError } from '@/lib/services/gas-service'
import { validateEmail, validatePhoneNumber, validateRequired } from '@/lib/utils/validation'
import { PLANS, getStaffFee } from '@/lib/data'
import { calculateCouponDiscount } from '@/lib/constants/coupons'
import { getEnPrice } from '@/lib/i18n/en-prices'
import { isIntlLocale, isPlanAllowedForLocale } from '@/lib/i18n/locales'
import { validateBookingRules } from '@/lib/booking-rules'
import { calculateRentalTotal, planOffersRentals } from '@/lib/rental-options'
import {
  LineVerificationError,
  verifyLineIdToken,
  type VerifiedLineProfile,
} from '@/lib/services/line-login-service'
import {
  COMBO_PLAN_IDS,
  STAFF_UNAVAILABLE_PLAN_IDS,
  TIME_OPTIONAL_PLAN_IDS,
  SENIOR_RESTRICTED_PLAN_IDS,
  getPrivateCounterpartName,
  FREE_UNDER3_PLAN_IDS,
  COMBO_NIGHT_TIMES,
  DAY_SUP_TIME_NOTE,
  isNightTourPlan,
  isComboPlan,
  planHasSup,
  planHasNight,
  getComboContentText,
  isParticipantAgeValid,
} from '@/lib/plan-flags'

interface BookingParticipant {
  name?: string
  age?: number | ''
  height?: number | ''
  weight?: number | ''
  footSize?: number | ''
  category: string
  wetsuitRental?: boolean
  prescriptionMaskRental?: boolean
}

interface BookingRequest {
  selectedPlan: string
  selectedDate: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  planName: string
  locale?: string
  selectedTime?: string
  nightTime?: string
  selectedStaff?: string
  participants: BookingParticipant[]
  totalPrice?: number
  staffName?: string
  specialRequests?: string
  lineIdToken?: string | null
  couponCode?: string
  couponDiscount?: number
  agreedToTerms?: boolean
  attribution?: {
    source?: string
    medium?: string
    campaign?: string
    referrer?: string
    landingPage?: string
  } | null
  customerAnalytics?: {
    visitorId?: string
    visitorCreatedAt?: string
    visitId?: string
    visitStartedAt?: string
    bookingFunnelId?: string
    consentVersion?: string
    consentedAt?: string
    currentPage?: string
    deviceType?: string
    browser?: string
    os?: string
  } | null
}

// プラン分類は lib/plan-flags.ts を単一ソースとして参照する（予約フォーム等と共通）
const SUNSET_SUP_TIME_NOTE = 'サンセット時刻（前日にLINEでご案内）'
const BOOKING_SERVICE_UNAVAILABLE_MESSAGE =
  '予約を送信できませんでした。時間をおいてもう一度お試しいただくか、LINEでお問い合わせください。'
const LINE_AUTHENTICATION_FAILED_MESSAGE =
  'LINE認証を確認できませんでした。LINEで再度ログインしてからお試しください。'
const LINE_AUTHENTICATION_UNAVAILABLE_MESSAGE =
  'LINE認証を一時的に確認できません。時間をおいてもう一度お試しください。'
const VALID_STAFF_IDS = new Set(['staff1', 'staff2', 'staff3', 'staff4', 'staff5'])
const STAFF_NAMES: Record<string, string> = {
  staff1: 'やまちゃん',
  staff2: 'ひかる',
  staff5: 'そうたろう',
  staff3: 'そういちろう',
  staff4: '凪',
}

// 簡易レートリミット（インスタンス内メモリ）。Vercelはインスタンスを再利用するため
// 完全ではないが、スパム送信によるGAS予約シート・LINE通知の氾濫を抑止する
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const rateLimitMap = new Map<string, number[]>()

const isRateLimited = (clientKey: string): boolean => {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const timestamps = (rateLimitMap.get(clientKey) || []).filter((t) => t > windowStart)
  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(clientKey, timestamps)
    return true
  }
  timestamps.push(now)
  rateLimitMap.set(clientKey, timestamps)
  // Mapの肥大化防止: 定員超過時に期限切れエントリを掃除
  if (rateLimitMap.size > 1000) {
    for (const [key, ts] of rateLimitMap) {
      if (!ts.some((t) => t > windowStart)) rateLimitMap.delete(key)
    }
  }
  return false
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

// 任意項目用: 未入力（undefined/null/空文字）は許容し、入力があれば正の数を要求
const isEmptyOrPositiveNumber = (value: unknown): boolean =>
  value === undefined || value === null || value === '' || isPositiveNumber(value)

const TRACKING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CURRENT_TRACKING_CONSENT_VERSION = '2026-08-13'
const safeTrackingText = (value: unknown, maxLength: number): string =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength) : ''
const safeTrackingId = (value: unknown): string => {
  const id = safeTrackingText(value, 36)
  return TRACKING_ID_PATTERN.test(id) ? id : ''
}
const safeTrackingDate = (value: unknown): string => {
  const raw = safeTrackingText(value, 40)
  const date = new Date(raw)
  return raw && !Number.isNaN(date.getTime()) ? date.toISOString() : ''
}
const normalizeCustomerAnalytics = (input: BookingRequest['customerAnalytics']) => {
  if (!input || typeof input !== 'object') return null
  const visitorId = safeTrackingId(input.visitorId)
  const visitId = safeTrackingId(input.visitId)
  const consentVersion = safeTrackingText(input.consentVersion, 30)
  const consentedAt = safeTrackingDate(input.consentedAt)
  if (!visitorId || !visitId || consentVersion !== CURRENT_TRACKING_CONSENT_VERSION || !consentedAt) return null
  return {
    visitorId,
    visitorCreatedAt: safeTrackingDate(input.visitorCreatedAt),
    visitId,
    visitStartedAt: safeTrackingDate(input.visitStartedAt),
    bookingFunnelId: safeTrackingId(input.bookingFunnelId),
    consentVersion,
    consentedAt,
    currentPage: safeTrackingText(input.currentPage, 160),
    deviceType: safeTrackingText(input.deviceType, 30),
    browser: safeTrackingText(input.browser, 40),
    os: safeTrackingText(input.os, 40),
  }
}

const getTodayInJapan = (): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date())

const getStaffName = (staffId?: string): string => {
  if (!staffId) return ''
  return STAFF_NAMES[staffId] || ''
}

const validateParticipant = (
  participant: BookingParticipant,
  plan: typeof PLANS[number],
  index: number
): { valid: boolean; error?: string } => {
  const label = `参加者${index + 1}`
  const category = participant.category
  const age = participant.age

  if (!['adult', 'child', 'under3'].includes(category)) {
    return { valid: false, error: `${label}の区分が不正です` }
  }

  if (
    (participant.wetsuitRental !== undefined && typeof participant.wetsuitRental !== 'boolean') ||
    (participant.prescriptionMaskRental !== undefined &&
      typeof participant.prescriptionMaskRental !== 'boolean')
  ) {
    return { valid: false, error: `${label}のレンタル選択が不正です` }
  }

  if (
    !planOffersRentals(plan.id) &&
    (participant.wetsuitRental === true || participant.prescriptionMaskRental === true)
  ) {
    return { valid: false, error: 'ナイトツアーではレンタルオプションを選択できません' }
  }

  if (category !== 'adult' && participant.prescriptionMaskRental === true) {
    return { valid: false, error: `${label}の度付きマスクは選択できません。子供用のご用意はありません` }
  }

  if (!participant.name || !participant.name.trim()) {
    return { valid: false, error: `${label}の氏名が必須です` }
  }

  if (typeof age !== 'number' || !Number.isFinite(age)) {
    return { valid: false, error: `${label}の年齢が必須です` }
  }

  if (!isParticipantAgeValid(plan.id, category, age)) {
    return { valid: false, error: `${label}の年齢と参加者区分が一致していません` }
  }

  if (SENIOR_RESTRICTED_PLAN_IDS.has(plan.id) && age >= 60) {
    return {
      valid: false,
      error: `60歳以上の方がいるグループは${getPrivateCounterpartName(plan.id)}をご予約ください`,
    }
  }

  // 身長・体重は全プランで任意（フォームの案内文と一致させる）。入力された場合のみ正の数を要求
  if (!isEmptyOrPositiveNumber(participant.height) || !isEmptyOrPositiveNumber(participant.weight)) {
    return { valid: false, error: `${label}の身長・体重の値が正しくありません` }
  }

  if (!isNightTourPlan(plan.id)) {
    // シュノーケル系はフィン準備のため足のサイズのみ必須
    if (!isPositiveNumber(participant.footSize)) {
      return { valid: false, error: `${label}の足のサイズが必須です` }
    }
  } else if (!isEmptyOrPositiveNumber(participant.footSize)) {
    return { valid: false, error: `${label}の足のサイズの値が正しくありません` }
  }

  return { valid: true }
}

// 必須フィールドと予約内容の検証
const validateBookingRequest = (data: BookingRequest): { valid: boolean; error?: string } => {
  const { selectedDate, selectedTime, selectedStaff, customerName, customerEmail, customerPhone, participants, selectedPlan } = data

  if (!validateRequired(selectedPlan).valid) return { valid: false, error: 'プランが必須です' }
  const plan = PLANS.find((p) => p.id === selectedPlan)
  if (!plan) return { valid: false, error: '無効なプランです' }
  if (plan.status === 'coming_soon') {
    return { valid: false, error: 'このプランは近日公開のため、まだ予約できません' }
  }
  // 外国語サイト（en/ko/zh-tw）からは貸切プランのみ受け付ける。
  // フォームには貸切しか出ないが、古いURLや直接リクエストで通常プランが
  // 通らないよう、サーバー側でも同じ INTL_PLAN_IDS で弾く。
  if (isIntlLocale(data.locale) && !isPlanAllowedForLocale(data.locale, plan.id)) {
    return { valid: false, error: 'このプランは海外からのお客様にはご案内できません（貸切プランのみ受付）' }
  }

  if (!validateRequired(selectedDate).valid) return { valid: false, error: '予約日が必須です' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    return { valid: false, error: '予約日の形式が正しくありません' }
  }
  if (selectedDate < getTodayInJapan()) {
    return { valid: false, error: '過去の日付は予約できません' }
  }

  if (!TIME_OPTIONAL_PLAN_IDS.has(plan.id)) {
    if (!validateRequired(selectedTime || '').valid) {
      return { valid: false, error: '開始時間が必須です' }
    }

    const availableTimes = plan.timeTags.filter((time) => /^\d{2}:\d{2}$/.test(time))
    if (availableTimes.length > 0 && !availableTimes.includes(selectedTime || '')) {
      return { valid: false, error: '選択された開始時間がプランの時間帯と一致しません' }
    }
  }

  if (planHasNight(plan.id)) {
    if (!validateRequired(data.nightTime || '').valid) {
      return { valid: false, error: 'ヤシガニ探検（ナイトツアー）の開始時間が必須です' }
    }
    if (!COMBO_NIGHT_TIMES.includes(data.nightTime || '')) {
      return { valid: false, error: '選択されたヤシガニ探検時間がプランの時間帯と一致しません' }
    }
  }

  if (!validateRequired(customerName).valid) return { valid: false, error: '氏名が必須です' }
  const phoneValidation = validatePhoneNumber(customerPhone || '')
  if (!phoneValidation.valid) return { valid: false, error: phoneValidation.error || '電話番号が無効です' }
  if (!validateRequired(customerEmail || '').valid) return { valid: false, error: 'メールアドレスが必須です' }
  if (!validateEmail(customerEmail || '').valid) {
    return { valid: false, error: 'メールアドレスが無効です' }
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    return { valid: false, error: '参加者情報が必要です' }
  }

  const bookingRuleIssue = validateBookingRules({
    planId: plan.id,
    participants,
    agreedToTerms: data.agreedToTerms,
  })
  if (bookingRuleIssue?.code === 'ADULT_REQUIRED') {
    return { valid: false, error: '参加者には大人を1名以上含めてください' }
  }
  if (bookingRuleIssue?.code === 'MAX_PARTICIPANTS') {
    return { valid: false, error: `Web予約は最大${bookingRuleIssue.maxParticipants}名までです。11名以上はLINEでご相談ください` }
  }
  if (bookingRuleIssue?.code === 'TERMS_REQUIRED') {
    return { valid: false, error: '利用規約とキャンセルポリシーへの同意が必要です' }
  }

  for (const [index, participant] of participants.entries()) {
    const participantValidation = validateParticipant(participant, plan, index)
    if (!participantValidation.valid) return participantValidation
  }

  if (selectedStaff) {
    if (!VALID_STAFF_IDS.has(selectedStaff)) {
      return { valid: false, error: '無効なスタッフ指名です' }
    }
    if (STAFF_UNAVAILABLE_PLAN_IDS.has(plan.id)) {
      return { valid: false, error: 'このプランではスタッフ指名を利用できません' }
    }
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
  participants: BookingParticipant[],
  selectedStaff: string | undefined,
  couponDiscount: number,
  isIntl: boolean
): number => {
  const { adultCount, childCount, under3Count } = countParticipantsByCategory(participants)
  // 国際版サイト経由（locale が en/ko/zh-tw）はフォームと同じ getEnPrice で請求する。
  // 現在の EN_PRICE_DATA は空＝日本語サイトと同額。外国語サイト専用の料金を
  // 設ける場合もここを通るので、表示と請求が食い違わない。
  const { price: adultPrice, childPrice } = isIntl
    ? getEnPrice(plan)
    : { price: plan.price, childPrice: plan.childPrice ?? plan.price }
  const under3Price = FREE_UNDER3_PLAN_IDS.has(plan.id) ? 0 : childPrice

  const baseTotal = adultCount * adultPrice + childCount * childPrice + under3Count * under3Price
  const vipSurcharge = plan.vipSurcharge ?? 0
  const staffFee = selectedStaff && !STAFF_UNAVAILABLE_PLAN_IDS.has(plan.id) ? getStaffFee(selectedStaff) : 0
  const rentalTotal = calculateRentalTotal(plan.id, participants)

  return Math.max(0, baseTotal + vipSurcharge + staffFee + rentalTotal - couponDiscount)
}

const buildSpecialRequests = (bookingData: BookingRequest, plan: typeof PLANS[number]): string => {
  const rawRequests = bookingData.specialRequests?.trim() || ''

  if (!isComboPlan(plan.id)) return rawRequests

  // 海亀(必須)＋ SUP(あれば)＋ ナイト(あれば) を並べる。トリプル(C5/C6)は3つとも入る。
  const lines = [
    '[COMBO booking]',
    `プラン：${plan.name}`,
    getComboContentText(plan.id),
    `海亀希望時間：${bookingData.selectedTime || ''}`,
  ]
  if (planHasSup(plan.id)) lines.push(`ドローンSUP希望時間：${DAY_SUP_TIME_NOTE}`)
  if (planHasNight(plan.id)) lines.push(`ヤシガニ探検希望時間：${bookingData.nightTime || ''}`)
  const comboBlock = lines.join('\n')

  const cleanedRequests = rawRequests
    .replace(/\[COMBO booking\][\s\S]*?(?:\n───\n|$)/, '')
    .trim()

  return cleanedRequests ? `${comboBlock}\n───\n${cleanedRequests}` : comboBlock
}

// 流入元の値はURL経由で誰でも操作できるため、GAS側の備考マーカー判定（[COMBO booking]・
// 「ドローンSUP」等のプラン振り分け）と衝突しないよう ASCII の安全な文字だけ通す
const sanitizeAttributionValue = (value: unknown, maxLen: number): string =>
  typeof value === 'string' ? value.replace(/[^\w\-./ ]/g, '').trim().slice(0, maxLen) : ''

// 備考欄の末尾に付ける [流入元] ブロックを組み立てる。
// 管理者宛メールとGoogleカレンダーの説明文に載る（お客様向けLINE通知には載らない）。
const buildAttributionNote = (bookingData: BookingRequest): string => {
  // フィールド自体が無い（古いキャッシュのフォーム等）場合は何も付けない
  if (!('attribution' in bookingData)) return ''

  const a = bookingData.attribution
  const source = sanitizeAttributionValue(a?.source, 80)
  const medium = sanitizeAttributionValue(a?.medium, 80)
  const campaign = sanitizeAttributionValue(a?.campaign, 80)
  const referrer = sanitizeAttributionValue(a?.referrer, 120)
  const landing = sanitizeAttributionValue(a?.landingPage, 120)
  const landingNote = landing ? `（着地: ${landing}）` : ''

  if (source) {
    return `[流入元] ${[source, medium, campaign].filter(Boolean).join(' / ')}${landingNote}`
  }
  if (referrer) {
    return `[流入元] 参照元: ${referrer}${landingNote}`
  }
  return '[流入元] 不明（直接アクセス・ブックマーク等）'
}

// GAS用ペイロードを構築
const buildGASPayload = (
  bookingData: BookingRequest,
  plan: typeof PLANS[number],
  bookingNumber: string,
  validatedCoupon: { discount: number; code: string },
  serverTotalPrice: number,
  lineProfile: VerifiedLineProfile
) => {
  const { adultCount, childCount, under3Count } = countParticipantsByCategory(bookingData.participants)

  return {
    bookingNumber,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail || '',
    customerPhone: bookingData.customerPhone || '',
    planName: plan.name,
    locale: bookingData.locale || 'ja',
    selectedDate: bookingData.selectedDate,
    selectedTime: TIME_OPTIONAL_PLAN_IDS.has(plan.id)
      ? SUNSET_SUP_TIME_NOTE
      : bookingData.selectedTime || '',
    participants: bookingData.participants,
    adultCount,
    childCount,
    under3Count,
    totalPrice: serverTotalPrice,
    staffName: getStaffName(bookingData.selectedStaff),
    specialRequests: [buildSpecialRequests(bookingData, plan), buildAttributionNote(bookingData)]
      .filter(Boolean)
      .join('\n───\n'),
    lineUserId: lineProfile.userId,
    lineDisplayName: lineProfile.displayName,
    couponCode: validatedCoupon.code,
    couponDiscount: validatedCoupon.discount,
    customerAnalytics: normalizeCustomerAnalytics(bookingData.customerAnalytics),
    attribution: bookingData.attribution || null,
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'リクエストが多すぎます。しばらく時間をおいてからお試しください。', timestamp: new Date().toISOString() },
        { status: 429 }
      )
    }

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

    let lineProfile: VerifiedLineProfile
    try {
      lineProfile = await verifyLineIdToken(bookingData.lineIdToken)
    } catch (lineError) {
      const errorCode =
        lineError instanceof LineVerificationError ? lineError.code : 'UPSTREAM_ERROR'
      console.error('[v0] Booking LINE verification failed:', errorCode)

      return NextResponse.json(
        {
          success: false,
          error:
            errorCode === 'INVALID_TOKEN'
              ? LINE_AUTHENTICATION_FAILED_MESSAGE
              : LINE_AUTHENTICATION_UNAVAILABLE_MESSAGE,
          timestamp: new Date().toISOString(),
        },
        { status: errorCode === 'INVALID_TOKEN' ? 401 : 503 }
      )
    }

    const bookingNumber = generateBookingNumber()

    // クーポンをサーバー側で再計算（コードから直接金額を算出）
    // 昼夜セットなど対象外プランは plan.id を渡すことで割引0に強制する
    const validatedCoupon = calculateCouponDiscount(bookingData.couponCode, bookingData.participants, plan.id)

    // 合計金額もサーバー側で再計算（クライアント値は参考情報として無視）
    const serverTotalPrice = calculateServerSidePrice(
      plan,
      bookingData.participants,
      bookingData.selectedStaff,
      validatedCoupon.discount,
      isIntlLocale(bookingData.locale)
    )

    const gasPayload = buildGASPayload(
      bookingData,
      plan,
      bookingNumber,
      validatedCoupon,
      serverTotalPrice,
      lineProfile
    )

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
      console.error(
        '[v0] Booking could not be saved to GAS:',
        gasError instanceof Error ? gasError.message : 'Unknown GAS error'
      )
      return NextResponse.json(
        {
          success: false,
          error: BOOKING_SERVICE_UNAVAILABLE_MESSAGE,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      )
    }
  } catch (error) {
    return NextResponse.json(createAPIError(error, '予約処理中にエラーが発生しました'), {
      status: 500,
    })
  }
}
