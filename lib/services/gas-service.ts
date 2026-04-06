// GAS APIレスポンスの型定義
export interface GASResponse {
  success: boolean;
  message: string;
  bookingNumber?: string;
  timestamp?: string;
}

// 予約ペイロードの型定義
export interface BookingPayload {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  planName: string;
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
}

// GAS URLを取得
export const getGASUrl = (): string => {
  const url = process.env.GAS_BOOKING_URL;
  if (!url) throw new Error('GAS_BOOKING_URL が設定されていません');
  return url;
};

// 予約番号を生成
export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
};

// GASにデータを送信（サーバーサイドから呼び出し）
export const sendToGAS = async (payload: BookingPayload): Promise<GASResponse> => {
  const gasUrl = getGASUrl();

  // 10秒タイムアウト
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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

    console.log('[v0] GAS response status:', response.status);

    // レスポンスボディを確認
    const responseText = await response.text();
    console.log('[v0] GAS response body:', responseText);

    try {
      const gasResult = JSON.parse(responseText);
      if (gasResult.success === false) {
        console.error('[v0] GAS returned error:', gasResult.error);
        throw new Error(gasResult.error || 'GAS処理エラー');
      }
    } catch (parseErr) {
      // JSONでない場合（GASのリダイレクト先HTMLなど）はログのみ
      if (parseErr instanceof SyntaxError) {
        console.warn('[v0] GAS response is not JSON (may be redirect page):', responseText.slice(0, 200));
      } else {
        throw parseErr;
      }
    }

    return {
      success: true,
      message: '予約がシステムに送信されました',
      bookingNumber: payload.bookingNumber,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[v0] GAS送信タイムアウト（10秒）');
      throw new Error('GASへの送信がタイムアウトしました');
    }

    console.error('[v0] GAS送信エラー:', error);
    throw new Error(error instanceof Error ? error.message : 'GAS連携に失敗しました');
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
