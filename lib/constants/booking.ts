// 予約の人数上限・営業時間・ステータスの定義はここには置かない。
// 人数上限はプランごとに異なるため lib/booking-rules.ts の getPlanMaxParticipants()、
// 開始時間の候補は lib/plan-flags.ts と lib/data.ts の timeTags が唯一の定義元。
// （以前ここにあった MAX_PARTICIPANTS: 4 は現行ルールと矛盾する未使用の定数だった）

// 共通のエラーメッセージ（lib/utils/validation.ts が使用）。
// 予約APIの個別メッセージは app/api/booking/route.ts 側で組み立てる。
export const ERROR_MESSAGES = {
  INVALID_PHONE: '電話番号が無効です',
  INVALID_EMAIL: '連絡先情報が無効です',
  REQUIRED_FIELD: '必須項目です',
} as const;
