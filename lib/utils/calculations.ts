import { BOOKING_CONFIG } from '@/lib/constants/booking';

// 料金計算関数
export const calculatePrice = (planId: string, participants: number, planPrices: Record<string, number>): number => {
  const basePrice = planPrices[planId] || 0;
  return basePrice * participants;
};

// 営業時間内の時刻かチェック
export const isBusinessHours = (hours: number, startHour: number, endHour: number): boolean => {
  return hours >= startHour && hours < endHour;
};

// 予約可能な最小日数を計算（現在から何日後か）
export const getMinBookingDate = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + BOOKING_CONFIG.MIN_BOOKING_HOURS / 24);
  return date;
};

// 予約可能な最大日数を計算
export const getMaxBookingDate = (): Date => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setDate(date.getDate() + BOOKING_CONFIG.ADVANCE_BOOKING_DAYS);
  return date;
};

// 日付が予約可能な範囲内かチェック
export const isDateInBookingRange = (date: Date): boolean => {
  const now = new Date();
  const minDate = getMinBookingDate();
  const maxDate = getMaxBookingDate();
  return date >= minDate && date <= maxDate;
};

// 時間スロット配列を生成
export const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number = 60): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
      slots.push(`${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }
  return slots;
};

// 曜日を取得
export const getDayOfWeek = (date: Date): string => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

// 日付をフォーマット
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};
