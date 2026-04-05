// 営業時間
export const BUSINESS_HOURS = {
  START: 9,
  END: 18,
} as const;

// 予約設定
export const BOOKING_CONFIG = {
  SLOT_DURATION_MINUTES: 60,
  MAX_PARTICIPANTS: 4,
  MIN_PARTICIPANTS: 1,
  ADVANCE_BOOKING_DAYS: 30,
  MIN_BOOKING_HOURS: 24,
} as const;

// 予約ステータス
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  INVALID_DATE: '無効な日付です',
  INVALID_TIME: '無効な時刻です',
  INVALID_PARTICIPANTS: '参加者数が無効です',
  INVALID_PHONE: '電話番号が無効です',
  INVALID_EMAIL: '連絡先情報が無効です',
  BOOKING_FAILED: '予約に失敗しました',
  GAS_ERROR: 'システムエラーが発生しました',
  REQUIRED_FIELD: '必須項目です',
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: '予約が作成されました',
  BOOKING_SENT: '予約が送信されました',
} as const;
