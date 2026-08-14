import { ERROR_MESSAGES } from '@/lib/constants/booking';

// 電話番号のバリデーション
export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  const phoneRegex = /^[0-9\-()+ ]{10,}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_PHONE };
  }
  return { valid: true };
};

// メールアドレスのバリデーション
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_EMAIL };
  }
  return { valid: true };
};

// 参加日・開始時間・参加者数の検証は app/api/booking/route.ts が
// プランごとのルール（lib/booking-rules.ts / lib/plan-flags.ts）で行う。
// ここに汎用版を置くと上限4名などの古い値を誤って使う原因になるため置かない。

// 必須フィールドのバリデーション
export const validateRequired = (value: string | number): { valid: boolean; error?: string } => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  return { valid: true };
};
