import { createHash } from 'node:crypto';

// GAS APIレスポンスの型定義
export interface GASResponse {
  success: boolean;
  message: string;
  bookingNumber?: string;
  timestamp?: string;
  duplicate?: boolean;
}

const GAS_REQUEST_FAILED_MESSAGE = '予約システムへの送信に失敗しました';
const GAS_TIMEOUT_MS = 25_000;

const isJSONObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// 予約ペイロードの型定義
export interface BookingPayload {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  planName: string;
  locale?: string;
  selectedDate: string;
  selectedTime?: string;
  participants: Array<{ category: string }>;
  adultCount: number;
  childCount: number;
  under3Count: number;
  totalPrice: number;
  staffName?: string;
  specialRequests?: string;
  lineUserId?: string;
  lineDisplayName?: string;
  couponCode?: string;
  couponDiscount?: number;
  customerAnalytics?: {
    visitorId: string;
    visitorCreatedAt: string;
    visitId: string;
    visitStartedAt: string;
    bookingFunnelId: string;
    consentVersion: string;
    consentedAt: string;
    currentPage: string;
    deviceType: string;
    browser: string;
    os: string;
  } | null;
  attribution?: {
    source?: string;
    medium?: string;
    campaign?: string;
    referrer?: string;
    landingPage?: string;
  } | null;
}

// GAS URLを取得
export const getGASUrl = (): string => {
  const url = process.env.GAS_BOOKING_URL;
  if (!url) throw new Error('GAS_BOOKING_URL が設定されていません');
  return url;
};

// 予約番号を生成。同じ送信IDには同じ番号を返し、GAS側での重複防止に使う。
export const generateBookingNumber = (stableSeed?: string): string => {
  if (stableSeed) {
    const digest = createHash('sha256').update(stableSeed).digest('hex').slice(0, 16).toUpperCase();
    return `W${digest}`;
  }

  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
};

// GASにデータを送信（サーバーサイドから呼び出し）
export const sendToGAS = async (payload: BookingPayload): Promise<GASResponse> => {
  const gasUrl = getGASUrl();

  const startedAt = Date.now();

  // シートロック・カレンダー・Gmailまで含むGAS処理を待つ。従来の10秒では
  // 保存済みなのにクライアントだけ失敗扱いになる余地が大きかった。
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[v0] GAS returned an HTTP error:', {
        status: response.status,
        bookingNumber: payload.bookingNumber,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(GAS_REQUEST_FAILED_MESSAGE);
    }

    const responseText = (await response.text()).trim();
    if (!responseText) {
      console.error('[v0] GAS returned an empty response', {
        bookingNumber: payload.bookingNumber,
        redirected: response.redirected,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(GAS_REQUEST_FAILED_MESSAGE);
    }

    let gasResult: unknown;
    try {
      gasResult = JSON.parse(responseText);
    } catch {
      console.error('[v0] GAS returned invalid JSON', {
        bookingNumber: payload.bookingNumber,
        contentType: response.headers.get('content-type') || 'unknown',
        responseLength: responseText.length,
        redirected: response.redirected,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(GAS_REQUEST_FAILED_MESSAGE);
    }

    // GAS側がJSONで success: true を明示した場合だけ、保存成功と判断する。
    if (!isJSONObject(gasResult) || gasResult.success !== true) {
      console.error('[v0] GAS did not confirm a successful booking', {
        bookingNumber: payload.bookingNumber,
        durationMs: Date.now() - startedAt,
      });
      throw new Error(GAS_REQUEST_FAILED_MESSAGE);
    }

    return {
      success: true,
      message: '予約がシステムに送信されました',
      bookingNumber: payload.bookingNumber,
      timestamp: new Date().toISOString(),
      ...(gasResult.duplicate === true ? { duplicate: true } : {}),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[v0] GAS送信タイムアウト', {
        bookingNumber: payload.bookingNumber,
        timeoutMs: GAS_TIMEOUT_MS,
      });
      throw new Error(GAS_REQUEST_FAILED_MESSAGE);
    }

    if (error instanceof Error && error.message === GAS_REQUEST_FAILED_MESSAGE) {
      throw error;
    }

    console.error('[v0] GAS送信エラー:', error);
    throw new Error(GAS_REQUEST_FAILED_MESSAGE);
  }
};

// APIレスポンスを標準化
export const createAPIResponse = <T = any,>(success: boolean, data: T, message?: string) => {
  return {
    success,
    data,
    message: message || (success ? 'Success' : 'Error'),
    timestamp: new Date().toISOString(),
  };
};

// APIエラーレスポンスを作成
export const createAPIError = (error: unknown, defaultMessage: string = 'An error occurred') => {
  const message = error instanceof Error ? error.message : defaultMessage;
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
};
