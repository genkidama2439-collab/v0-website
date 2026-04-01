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
  date: string;
  time: string;
  participants: number;
  planId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  specialRequests: string;
}

// GAS URLを取得
export const getGASUrl = (): string => {
  return (
    process.env.GAS_BOOKING_URL ||
    'https://script.google.com/macros/s/AKfycbz0ltHt_0WcQVw-KUD4iG5yvH32RGYgXkO6ajVjafiPtdRAK1rloQj7rmiXmk3o_Pte/exec'
  );
};

// 予約番号を生成
export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
};

// GASにデータを送信
export const sendToGAS = async (payload: BookingPayload): Promise<GASResponse> => {
  const gasUrl = getGASUrl();

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // no-corsモードではレスポンスが読めないため、常に成功と仮定
    return {
      success: true,
      message: '予約がシステムに送信されました',
      bookingNumber: payload.bookingNumber,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[v0] GAS送信エラー:', error);
    throw new Error('GAS連携に失敗しました');
  }
};

// APIレスポンスを標準化
export const createAPIResponse<T = any>(success: boolean, data: T, message?: string) {
  return {
    success,
    data,
    message: message || (success ? 'Success' : 'Error'),
    timestamp: new Date().toISOString(),
  };
}

// APIエラーレスポンスを作成
export const createAPIError(error: unknown, defaultMessage: string = 'An error occurred') {
  const message = error instanceof Error ? error.message : defaultMessage;
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
}
