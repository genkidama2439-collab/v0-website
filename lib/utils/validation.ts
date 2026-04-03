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

// 参加者数のバリデーション
export const validateParticipants = (
  count: number,
  min: number = 1,
  max: number = 4
): { valid: boolean; error?: string } => {
  if (!Number.isInteger(count) || count < min || count > max) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_PARTICIPANTS };
  }
  return { valid: true };
};

// 日付のバリデーション
export const validateDate = (date: Date | string): { valid: boolean; error?: string } => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_DATE };
  }
  return { valid: true };
};

// 時刻のバリデーション（24時間形式）
export const validateTime = (hours: number, minutes: number = 0): { valid: boolean; error?: string } => {
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_TIME };
  }
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_TIME };
  }
  return { valid: true };
};

// 必須フィールドのバリデーション
export const validateRequired = (value: string | number): { valid: boolean; error?: string } => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  return { valid: true };
};
