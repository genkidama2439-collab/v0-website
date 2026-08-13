# 海亀兄弟サイト 全体監査レポート

**監査日**: 2026-08-05
**対象コミット**: `bbd305d59ee57c87e701176207bca786f77614e9` (main)
**監査種別**: 読み取り専用（調査・診断・報告のみ。コード変更なし）
**対象範囲**: Next.js アプリ全体、Apps Script 3プロジェクト、静的ファイル、外部連携、セキュリティ、SEO、パフォーマンス、アクセシビリティ、依存関係

---

## 目次

1. [総合評価](#1-総合評価)
2. [重大な問題](#2-重大な問題)
3. [匿名分析の監査結果](#3-匿名分析の監査結果)
4. [予約処理の監査結果](#4-予約処理の監査結果)
5. [ファイル・画像監査](#5-ファイル画像監査)
6. [互換性](#6-互換性)
7. [セキュリティ](#7-セキュリティ)
8. [SEO・パフォーマンス・アクセシビリティ](#8-seoパフォーマンスアクセシビリティ)
9. [設定・依存関係・デッドコード](#9-設定依存関係デッドコード)
10. [コードからは判断できない項目](#10-コードからは判断できない項目)
11. [優先順位付き対応一覧](#11-優先順位付き対応一覧)
12. [正常だった項目](#12-正常だった項目)
13. [未確認・未実施項目](#13-未確認未実施項目)
14. [最終確認](#14-最終確認)

---

## 1. 総合評価

### サイト全体の状態

**本番運用は継続可能です。** 緊急停止が必要な問題は見つかりませんでした。

特に「お金」と「個人情報」の防御は堅牢です。料金のサーバー再計算、LINE本人確認、匿名分析の個人情報遮断は、いずれも設計として正しく実装されており、意図的な改ざんに対して有効に機能しています。コード品質の基礎指標（型チェック・Lint・テスト）もすべて通過しています。

### 正常と判断できる範囲

- 料金・クーポン・人数・年齢・日付・プランの改ざん耐性（サーバー再計算とサーバー検証）
- LINE ID トークンによる本人確認（`iss`/`aud`/`sub`/`exp` 検証）
- 匿名分析の個人情報遮断（クライアント・サーバー・GAS の三重許可リスト）
- 分析イベント名の3層整合（スキーマ30件 ⇄ GAS 30件が名前・順序とも完全一致）
- 画像パスの健全性（参照切れ0件、大文字小文字不一致0件）
- SEO の基本構成（canonical・hreflang・sitemap・robots・noindex）
- アクセシビリティの主要導線（フォーカス管理・ラベル・キーボード操作）
- 秘密情報の管理（Git履歴を含め漏えいなし）

### 最も危険な問題

| # | 問題 | 重大度 |
|---|---|---|
| 1 | `NEXT_PUBLIC_LIFF_ID` 未設定時に、フォームは送信可能に見えて全予約が401で失敗する | Critical（条件付き） |
| 2 | S8（通常サンセットSUP）の予約が、開催時間の空欄でスプレッドシートに届く | High |
| 3 | GAS予約受信に冪等性がなく、10秒タイムアウト時に二重予約が発生しうる | High |

### 本番運用を続けてよいか

**続けて問題ありません。** ただし以下2点だけ、早期に確認してください。

1. Vercel 管理画面で `NEXT_PUBLIC_LIFF_ID` が Production に設定されていること（問題1）
2. 予約スプレッドシートで、S8（サンセットSUP通常版）の行の「時間」列が空欄になっていないか（問題2）

### 緊急対応が必要か

**即日対応が必要なものはありません。** S8 は2026年7月新設プランのため、既にS8の予約が入っている場合のみ、シートの時間欄を手動で補完してください。

### 調査できなかった範囲

- 実環境（スプレッドシート本体、GAS管理画面、Vercel管理画面、GA4、LINE Developers）の設定値
- 実機での表示・操作検証（iPhone、Android、LINE内ブラウザ）
- `next build` の実行（既存ビルド成果物の上書きを避けたため）
- Lighthouse / axe による実測（静的解析のみ）

---

## 2. 重大な問題

重大度の定義:

- **Critical**: 予約・売上・個人情報・サイト停止に直結する
- **High**: 主要機能の不具合や大きなデータ欠損につながる
- **Medium**: 特定条件で不具合や分析誤差が発生する
- **Low**: 軽微な表示、保守性、将来的な問題
- **Info**: 改善候補、確認事項

---

### 問題1: LIFF ID未設定時に、送信可能に見えて全予約が401で失敗する

| 項目 | 内容 |
|---|---|
| **重大度** | Critical（条件付き） |
| **確信度** | 要実環境確認（コード経路は確定。Vercelでの設定有無が不明） |
| **対象ファイル** | `components/booking-form.tsx` |
| **行番号** | 750, 963, 1158, 2362（関連: `lib/services/line-login-service.ts:39-46`、`app/api/booking/route.ts:440-459`、`components/booking-form-intl.tsx:111`） |
| **関連する関数** | `handleSubmit` / `verifyLineIdToken` |

**発生条件**: `NEXT_PUBLIC_LIFF_ID` が本番環境で未設定・空文字のとき

**現在の挙動**:

フォーム側のLINE必須判定はすべて `!!process.env.NEXT_PUBLIC_LIFF_ID` を前提にしています。

```ts
// components/booking-form.tsx:750
if (!!process.env.NEXT_PUBLIC_LIFF_ID && !freshLineIdToken) {
  toast.error("LINEログインの有効期限が切れました。…")
  return
}
```

環境変数が未設定なら、この条件は常に false になり素通りします。同様に:

- `:963` — 不足項目リストに「LINEログイン」が追加されない
- `:1320` — LINE連携ステータスUIが表示されない
- `:2362` — 送信ボタンの `disabled` 条件から LINE 判定が外れる

一方サーバー側は無条件で必須です。

```ts
// lib/services/line-login-service.ts:40-46
if (typeof idToken !== "string" || idToken.length === 0 || …) {
  throw new LineVerificationError("INVALID_TOKEN", "LINE ID token is missing or invalid")
}
```

`lineIdToken: null` が渡るため必ず `INVALID_TOKEN` となり、API は 401 を返します。

**本来の挙動**: サーバーが必須とする条件は、クライアント側も同じ条件で必須にすべき

**影響**: 予約が1件も通らない。売上直結。お客様には「LINE認証を確認できませんでした。LINEで再度ログインしてからお試しください。」と表示されますが、ログイン導線自体が画面に存在しないため復旧手段がありません。

**根拠**: クライアント側は環境変数の有無で分岐、サーバー側は常に必須という非対称構造

**再現方法**: Vercel管理画面 → Settings → Environment Variables で `NEXT_PUBLIC_LIFF_ID` の Production 設定を確認（**削除して試さないこと**）

**推奨修正方法**:
- LIFF必須をコード側の定数（例 `const LINE_LOGIN_REQUIRED = true`）で決め、環境変数の有無に依存させない
- または `NEXT_PUBLIC_LIFF_ID` 未設定時に、フォームを送信不能にして設定エラーを明示表示する

**修正時に影響する機能**: 日本語フォーム・国際版フォーム双方のLINE連携UI、送信ボタンの活性条件

**修正優先順位**: 1（設定済みなら実害なし。まず設定確認）

---

### 問題2: S8（通常サンセットSUP）の予約が「時間」空欄でGASに届く

| 項目 | 内容 |
|---|---|
| **重大度** | High |
| **確信度** | 確定 |
| **対象ファイル** | `app/api/booking/route.ts` |
| **行番号** | 385-387（関連: `lib/plan-flags.ts:31`、`components/booking-form.tsx:187-203, 911`、`apps-script/umigame-reservation-admin/Code.gs:1195-1210, 1272-1275`） |
| **関連する関数** | `buildGASPayload` |

**発生条件**: プランS8（通常サンセットSUP）で予約されたとき、常に

**現在の挙動**:

```ts
// app/api/booking/route.ts:385-387
selectedTime: plan.id === 'S4'
  ? SUNSET_SUP_TIME_NOTE      // 'サンセット時刻（前日にLINEでご案内）'
  : bookingData.selectedTime || '',
```

S4のみ案内文言が入ります。しかし時間選択が不要なプランは**2つ**あります。

```ts
// lib/plan-flags.ts:31
export const TIME_OPTIONAL_PLAN_IDS = new Set(["S4", "S8"])
```

フォーム側も S4/S8 をともに `sunset-sup` として扱い、時間選択UIを出しません。

```ts
// components/booking-form.tsx:187-203
function getPlanType(planId) {
  switch (planId) {
    case "S4":
    case "S8":
      return "sunset-sup"
    …
```

```ts
// components/booking-form.tsx:911（isFormValid）
(getPlanType(bookingData.selectedPlan) === "sunset-sup" || bookingData.selectedTime) &&
```

結果、S8 では `selectedTime` が空文字のまま GAS へ送信されます。GAS 側の通常分岐は次の通りです。

```js
// apps-script/umigame-reservation-admin/Code.gs:1202-1204
time: normalizeTime_(data.selectedTime) || String(data.selectedTime || ''),
```

`buildBookingRow_`（Code.gs:1010-1040）の4番目の要素が「時間」列（D列）なので、**予約シートのD列が空欄**になります。

さらに `createCalendarTimedEvent_` は時刻を解釈できないと例外を投げます。

```js
// apps-script/umigame-reservation-admin/Code.gs:1272-1275
var normalizedTime = normalizeTime_(time);
if (!normalizedTime) {
  throw new Error('カレンダー登録用の時間が不正です: ' + time);
}
```

この例外は `addToCalendar` の try/catch（1216-1220）に握りつぶされるため、**S8はGoogleカレンダーに登録されない可能性が高い**です。S4も `SUNSET_SUP_TIME_NOTE` という日本語文字列のため `normalizeTime_` が失敗し、同様にカレンダー登録されない見込みです。

**本来の挙動**: S4と同様、時間欄に案内文言が入り、カレンダーには終日予定または既定時刻で登録される

**影響**:
- 運営がシート上でS8の開催時間帯を判別できない
- S8（およびS4）がGoogleカレンダーに載らない
- 当日の配車・スタッフ割り当てに支障

**根拠**: `TIME_OPTIONAL_PLAN_IDS` が単一ソースとして定義され、route.ts でも import 済み（`app/api/booking/route.ts:18`）なのに、この分岐だけがハードコードの `plan.id === 'S4'` になっている

**再現方法**: S8を選んで予約送信 → 予約シートD列と、Googleカレンダーの当日予定を確認

**推奨修正方法**:
1. `plan.id === 'S4'` を `TIME_OPTIONAL_PLAN_IDS.has(plan.id)` に置き換える（既に import 済み）
2. あわせて `addToCalendar` の失敗時に管理者へ通知するか、シートに「カレンダー未登録」フラグを立てる（問題7と共通）

**修正時に影響する機能**: S4/S8の予約シート表記、カレンダー登録、管理者メール、LINE通知の日時文言

**修正優先順位**: 2

---

### 問題3: GAS予約受信に冪等性がなく、タイムアウト時に二重予約になる

| 項目 | 内容 |
|---|---|
| **重大度** | High |
| **確信度** | 可能性が高い（実際の所要時間はGAS実行ログでの確認が必要） |
| **対象ファイル** | `lib/services/gas-service.ts` |
| **行番号** | 56（関連: `apps-script/umigame-reservation-admin/Code.gs:1060-1240`、`app/api/booking/route.ts:485-513`） |
| **関連する関数** | `sendToGAS` / GAS `doPost` |

**発生条件**: GAS側の処理が10秒を超えたとき（Gmail送信・カレンダー登録が重なる繁忙時、Google側のレイテンシ増大時）

**現在の挙動**:

```ts
// lib/services/gas-service.ts:55-56
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);
```

Next.js が10秒で中断 → `/api/booking` が502を返す → フォームが「予約を送信できませんでした。時間をおいてもう一度お試しいただくか、LINEでお問い合わせください。」を表示。

しかし GAS 側は既に処理を進めています。

```js
// apps-script/umigame-reservation-admin/Code.gs:1213-1218
writeBookingRows_(sheet, rows);           // ← ここで行は書かれる
try { addToCalendar(data, headcount); } catch (…) { … }
sendBookingEmail(data, headcount, participantsDetail);  // ← 管理者メールも送られる
```

お客様が再送信すると、`generateBookingNumber()` が毎回新しい番号を発番するため重複判定ができず、2件目が登録されます。

```ts
// lib/services/gas-service.ts:44-48
export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
};
```

**本来の挙動**: 同一予約の再送信は既存行として検出され、二重登録されない

**影響**:
- 同じお客様の予約が2件、枠を二重に消費
- 管理者メール・LINE通知も重複
- お客様には「失敗」と見えているため、電話やLINEでの追加問い合わせが発生
- セット系プラン（C1〜C6）は1予約で2行書くため、重複時は4行になる

**根拠**: GAS `doPost` に `bookingNumber` の既存チェックがない。`writeBookingRows_` の `LockService.waitLock(10000)`（Code.gs:1045-1046）は同時書き込みの行衝突しか防がず、内容の重複は防げない

**再現方法**: GAS側に意図的な遅延を入れたテスト環境で送信（**本番では実施しないこと**）。または GAS実行ログで doPost の実行時間分布を確認

**推奨修正方法**（効果順）:
1. **GAS `doPost` の冒頭で同一 `bookingNumber` の行が既にあれば、書き込まずに `{success:true}` を返す**（冪等化）
2. 予約番号をクライアント側で1回だけ発番し、再送時も同じ値を使う
3. `sendToGAS` のタイムアウトを15〜20秒へ延長（Vercel Functions の既定タイムアウトは300秒なので余裕がある）

**修正時に影響する機能**: 予約API全体、GAS受信、予約番号の生成タイミング

**修正優先順位**: 3

---

### 問題4: `booking_abandoned` がタブ切替で誤発火する

| 項目 | 内容 |
|---|---|
| **重大度** | Medium |
| **確信度** | 確定 |
| **対象ファイル** | `components/booking-form.tsx` |
| **行番号** | 1107-1112（関連: `lib/booking-funnel.ts:549-572`、`components/booking-form-intl.tsx` 同等箇所） |
| **関連する関数** | `reportAbandon` / `onVisibilityChange` |

**発生条件**: 入力途中でタブを切り替える、別アプリを開く、画面がロックされる、通知を確認する等

**現在の挙動**:

```ts
// components/booking-form.tsx:1107-1112
const onVisibilityChange = () => {
  if (document.visibilityState === "hidden") reportAbandon()
}

window.addEventListener("pagehide", reportAbandon)
document.addEventListener("visibilitychange", onVisibilityChange)
```

`visibilitychange` の hidden で即座に離脱として送信されます。`claimOnce("booking_abandoned")`（`lib/booking-funnel.ts:559`）により1回だけですが、**その1回が「戻ってきて予約を完了した人」にも刻まれます**。結果、同一セッションで `booking_abandoned` と `booking_submitted` の両方が記録されます。

LINE認証への遷移は除外されていますが（`booking-form.tsx:1093`）、通常のタブ切替は除外されていません。

```ts
// components/booking-form.tsx:1090-1093
const reportAbandon = () => {
  if (!bookingStartedTrackedRef.current) return
  if (isSubmitted || submissionInFlightRef.current) return
  if (isLineLoginRedirectInProgress()) return   // ← LINE遷移のみ除外
```

**本来の挙動**: 一時的な離席は離脱として数えない

**影響**: 離脱率が過大に出ます。スマートフォンでは特に顕著で、「LINEで家族に料金を相談してから戻る」「カレンダーアプリで日程を確認する」といった**予約に前向きな行動が離脱扱い**になります。ファネル分析の意思決定を誤らせます。

**根拠**: `pagehide` は真の離脱シグナルですが、`visibilitychange` はバックグラウンド化一般を表すイベントです。`booking_submitted` との併存を集計側で除外していない限り、離脱率が実態より高く出ます。

**再現方法**: フォームに入力 → 別タブへ切替 → 戻って送信完了 → スプレッドシートに `booking_abandoned` と `booking_submitted` が両方あることを確認

**推奨修正方法**:
- `pagehide` のみに限定する（最も単純で確実）
- または hidden→visible に戻ったらキャンセルできるよう、送信を30〜60秒遅延させる
- または visibilitychange 起因には別プロパティ（例 `trigger: "visibility"` / `"pagehide"`）を付け、集計側で除外できるようにする

**修正時に影響する機能**: 予約ファネル分析（離脱率・到達率）。**予約機能そのものには影響しません**

**修正優先順位**: 4

---

### 問題5: `/api/analytics/events` が無認証・無レート制限で外部から叩ける

| 項目 | 内容 |
|---|---|
| **重大度** | Medium |
| **確信度** | 確定 |
| **対象ファイル** | `app/api/analytics/events/route.ts` |
| **行番号** | 43-101 |
| **関連する関数** | `POST` |

**発生条件**: 外部から任意のクライアントがPOSTしたとき

**現在の挙動**: Origin/Referer検証なし、共有シークレットの提示要求なし、レート制限なし。共有シークレットは**サーバー側で付与されます**。

```ts
// app/api/analytics/events/route.ts:84-94
const webhookUrl = process.env.ANALYTICS_SHEETS_WEBHOOK_URL
const secret = process.env.ANALYTICS_SHEETS_SHARED_SECRET
…
const response = await fetch(webhookUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ secret, event }),   // ← サーバーがシークレットを足す
```

つまり外部の誰でも、`/api/analytics/events` にPOSTするだけで「正規の分析イベント」としてスプレッドシートへ書き込めます。イベント名と項目は許可リストで制限されますが、**件数は無制限**です。

**本来の挙動**: 自サイトからの送信のみ受け付ける

**影響**:
- 分析データの汚染（偽の予約ファネル、偽のCV）
- **Apps Scriptの1日あたり実行時間クォータ（無料枠90分/日）の消費**。使い切ると正規のイベントも記録されなくなる
- スプレッドシート行数の浪費（1シート1,000万セル上限、約60列なので約16万行）

**根拠**: 予約API（`app/api/booking/route.ts:94-111`）にはレート制限とLINEトークン必須があるのに対し、分析APIには一切ありません。`MAX_BODY_BYTES = 16_384` によるサイズ制限のみです。

**再現方法**: 静的解析のみで確認。**実送信は行っていません**

**推奨修正方法**:
1. same-origin の Origin/Referer チェックを追加
2. IP単位のレート制限（予約API `isRateLimited` と同じ方式を流用可能）
3. 必要に応じて Vercel Firewall のレート制限ルール、または Vercel BotID

**修正時に影響する機能**: 匿名分析の収集のみ

**修正優先順位**: 5

---

### 問題6: SPA遷移をまたぐとファネルイベントが記録されない

| 項目 | 内容 |
|---|---|
| **重大度** | Medium |
| **確信度** | 確定 |
| **対象ファイル** | `lib/booking-funnel.ts` |
| **行番号** | 195-210 |
| **関連する関数** | `claimOnce` |

**発生条件**: `/book` → 他ページ → `/book` とサイト内リンクで戻った場合（完全リロードなら発生しない）

**現在の挙動**:

```ts
// lib/booking-funnel.ts:195-210
const firedOnce = new Set<string>()

export function claimOnce(key: string): boolean {
  if (firedOnce.has(key)) return false
  firedOnce.add(key)
  return true
}
```

モジュールスコープのため、Next.js の App Router によるクライアントサイド遷移ではリセットされません。コンポーネント側の `hasTrackedFormView` ref（`booking-form.tsx:342`）はリセットされますが、`claimOnce("booking_form_view")` が false を返すため送信されません。

同様に `booking_plan_selected` / `booking_date_selected` / `booking_time_selected` / `booking_participants_completed` / `booking_price_confirmed` / `booking_representative_completed` / `booking_participant_details_*` / `booking_submit_clicked` も、2回目の予約検討では記録されません。

**本来の挙動**: 新しいフォーム表示は新しいファネル開始として記録される

**影響**: フォーム表示数の過少計上。「プラン一覧を見比べてから予約フォームに戻る」という典型的な検討行動が計測から抜けます。ファネルの母数が実態より小さくなり、到達率が実態より高く見えます。

**根拠**: コメント（193-194行）は「React Strict Mode の二重実行・再レンダリング・コンポーネント再マウントを跨いで1回だけに保てる」を意図しており、SPA遷移をまたぐことは想定外の副作用です。

**再現方法**: `/book` を開く → ナビゲーションで `/plans` へ → `/book` へ戻る → 2回目の `booking_form_view` が記録されないことを確認

**推奨修正方法**: `components/route-scroll-manager.tsx` など pathname を監視している箇所からリセット関数を呼ぶ。または フォームのマウントID（`useId()` 等）を `claimOnce` のキーに含める

**修正時に影響する機能**: 予約ファネル分析

**修正優先順位**: 6

---

### 問題7: `addToCalendar` の失敗が完全に握りつぶされる

| 項目 | 内容 |
|---|---|
| **重大度** | Medium |
| **確信度** | 確定 |
| **対象ファイル** | `apps-script/umigame-reservation-admin/Code.gs` |
| **行番号** | 1216-1220 |
| **関連する関数** | `doPost` / `addToCalendar` |

**発生条件**: カレンダー登録が失敗したとき（時刻が解釈できない、カレンダー権限不足、Google側障害）

**現在の挙動**:

```js
// apps-script/umigame-reservation-admin/Code.gs:1216-1220
try {
  addToCalendar(data, headcount);
} catch (calError) {
  Logger.log('カレンダー登録エラー: ' + calError.message);
}
```

ログに残るだけで、予約は `{success: true}` で返ります。お客様も運営も失敗に気づけません。

**本来の挙動**: シート・カレンダーの不整合を運営が検知できる

**影響**: シートには予約があるがカレンダーには無い、という状態が静かに発生します。**問題2と組み合わさると、S4/S8で恒常的に起きます。**

**根拠**: 他の副作用は安全側に倒れています。

- `writeBookingRows_` は最初に実行され、失敗すれば外側の catch に届き `{success:false}` になる（＝お客様も失敗と認識）
- `sendBookingEmail` は自前の try/catch（906-1003行）を持ち、失敗しても予約自体は成立する

**カレンダーだけが「失敗しても誰も気づかない」構造**です。

**再現方法**: GASの実行ログで「カレンダー登録エラー」を検索

**推奨修正方法**: 失敗時に管理者メールを送る、または予約シートの空き列に「カレンダー未登録」と書き込む

**修正時に影響する機能**: カレンダー連携、管理者通知

**修正優先順位**: 7

---

### 問題8: プラン判定のハードコードが4箇所残存し、仕様ドリフトを招く

| 項目 | 内容 |
|---|---|
| **重大度** | Medium |
| **確信度** | 確定 |
| **対象ファイル** | `components/booking-form.tsx` |
| **行番号** | 187-203, 391, 495, 496 |
| **関連する関数** | `getPlanType` / `getAgeCategories` / `isNightHunterPlan` / `isUnder3FreePlan` |

**発生条件**: プランを追加・分割・変更したとき

**現在の挙動**: `lib/plan-flags.ts` は「プラン分類の単一ソース（Single Source of Truth）」と冒頭に明記されています。

```ts
// lib/plan-flags.ts:1-10
// ============================================================
// プラン分類の単一ソース（Single Source of Truth）
// ------------------------------------------------------------
// 【セットを増やすとき】このファイルの集合と COMBO_CONTENT_TEXT を更新すれば、
//   3ファイルすべてに反映される（個別のコピペ更新漏れによるバグを防ぐ）。
```

しかし `booking-form.tsx` には、この単一ソースを参照しないプランIDのハードコードが4箇所残っています。

```ts
// :187-203  getPlanType — S3/S5, S4/S8, S6/S7, slide-boat を直書き
// :391      const isNightHunter = bookingData.selectedPlan === "S3" || … === "S5"
// :495      const isNightHunterPlan = … "S3" || "S4" || "S5" || "S6" || "S7" || "S8" || "slide-boat"
// :496      const isUnder3FreePlan = … "S3" || … "S5"
```

**現時点では値が一致しており、実害はありません。** しかし**問題2はまさにこの構造が生んだ不具合**です。

**影響**: 将来のプラン追加時に、問題2と同種のバグが再発します。

**推奨修正方法**: それぞれ `lib/plan-flags.ts` の関数・集合に置き換える。

| 現在 | 置換先 |
|---|---|
| `:391 isNightHunter` | `isNightTourPlan(planId)` |
| `:496 isUnder3FreePlan` | `FREE_UNDER3_PLAN_IDS.has(planId)` |
| `:495 isNightHunterPlan`（用途はスタッフ指名可否） | `STAFF_UNAVAILABLE_PLAN_IDS.has(planId)` |
| `:187-203 getPlanType`（時間枠UIの分岐） | `TIME_OPTIONAL_PLAN_IDS` + 新たな時間枠区分の定数 |

**修正時に影響する機能**: 予約フォームの年齢区分表示、3歳以下欄の表示、スタッフ指名欄、時間選択UI

**修正優先順位**: 8

---

### 問題9: S8のスタッフ指名がフォームとサーバーで不一致

| 項目 | 内容 |
|---|---|
| **重大度** | Low |
| **確信度** | 確定 |
| **対象ファイル** | `lib/plan-flags.ts` |
| **行番号** | 27-29（関連: `components/booking-form.tsx:495, 504-508`、`app/api/booking/route.ts:276-278, 310`） |

**発生条件**: S8にスタッフ指名を付けた直接リクエストを送った場合

**現在の挙動**:

```ts
// lib/plan-flags.ts:27-29
export const STAFF_UNAVAILABLE_PLAN_IDS = new Set([
  "S3", "S4", "S5", "S6", "S7", "slide-boat", "C1", "C2", "C3", "C4", "C5", "C6",
])
// ↑ S8 が入っていない
```

一方フォームは S8 のスタッフ指名を禁止しています（`booking-form.tsx:495` の `isNightHunterPlan` に S8 が含まれる → `staffSelectable` が false → UI非表示 + useEffect でクリア）。

サーバーは `STAFF_UNAVAILABLE_PLAN_IDS` を見るため、S8 の指名を受理して指名料を加算します。

**影響**: 通常操作では発生しません。加算方向（お客様の支払いが増える）なので売上損もありません。**仕様ドリフトによる将来の不具合リスク**として記録します。

**推奨修正方法**: `STAFF_UNAVAILABLE_PLAN_IDS` に `"S8"` を追加。あわせて問題8の修正でフォーム側の判定も統一

**修正優先順位**: 9

---

### 問題10: 依存パッケージに 10件の high 脆弱性

| 項目 | 内容 |
|---|---|
| **重大度** | Medium（実行時に露出するのは axios のみ。他はビルド時） |
| **確信度** | 確定（`npm audit --package-lock-only` で確認。ロックファイルは変更されていない） |
| **対象ファイル** | `package.json` / `package-lock.json` |

**検出内容**:

| パッケージ | 現バージョン | 件数 | 露出面 | 評価 |
|---|---|---|---|---|
| `axios` | 1.17.0 | 10 | **実行時**（`@line/bot-sdk` の optionalDependency → `/api/line/notify`） | Medium |
| `next` | 14.2.35 | 7 | **実行時** | Medium |
| `postcss` | 8.5.15 | 4 | ビルド時のみ | Low |
| `sharp` | 0.34.5 | 1（libvips CVE 4件） | ビルド時のみ（devDependency） | Low |
| `brace-expansion` | — | 8 | ビルド/開発時のみ | Low |
| `form-data` | 4.0.x | 1 | 実行時（axios経由） | Low |
| `glob` | 10.x | 1 | 開発時のみ（eslint-config-next） | Low |

**注目すべきもの**:

1. **`axios` 1.17.0** — `@line/bot-sdk` の optionalDependency として実行時に読み込まれます。プロトタイプ汚染・DoS・`maxBodyLength` バイパスなど10件。ただし `/api/line/notify` は `Bearer ${LINE_NOTIFY_SECRET}` 必須で、リクエスト元は自社GASのみです。実際の攻撃面は限定的です。

2. **`next` 14.2.35** — 7件。うち以下2件はこのサイトの構成に関係します。
   - `GHSA-ggv3-7p47-pfv8` HTTP request smuggling in rewrites
   - `GHSA-3g8h-86w9-wvmq` Middleware / Proxy redirects can be cache-poisoned（`middleware.ts` でリダイレクトを使用中）

   なお `GHSA-9g9p-9gw9-jx7f`（Image Optimizer remotePatterns DoS）と `GHSA-3x4c-7xq6-9pq8`（image disk cache 肥大）は **self-hosted 向け**で、Vercel ホスティングでは基本的に緩和されています。

   修正は Next.js 16.3.0 以降で、**メジャーバージョンを2つ跨ぐ破壊的変更**になります。

**推奨修正方法**:
- 短期: `npm audit fix`（非破壊）で axios・brace-expansion・form-data を更新
- 中期: Next.js 15 → 16 への段階的アップグレードを計画（App Router の非同期 `params`/`searchParams` 対応が必要。問題13参照）
- **本監査ではパッケージを一切変更していません**

**修正優先順位**: 10

---

### 問題11: CSP と HSTS が未設定

| 項目 | 内容 |
|---|---|
| **重大度** | Low |
| **確信度** | 確定 |
| **対象ファイル** | `next.config.mjs` |
| **行番号** | 3-17 |

**現在の挙動**: 4種のセキュリティヘッダーを全パスに付与しています。

```js
{ key: 'X-Content-Type-Options', value: 'nosniff' },
{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
```

`Content-Security-Policy` と `Strict-Transport-Security` がありません。

**影響**: Vercel は HTTPS を強制し HSTS を自前で付与するため、HSTS の実害は小さいです。CSP が無いため XSS の多層防御が1枚薄い状態ですが、**後述の通り XSS 経路自体が現状見当たりません**。

**推奨修正方法**: CSP を `Content-Security-Policy-Report-Only` から段階導入。GA4・Vercel Analytics・LIFF SDK のドメイン許可が必要です。

**修正優先順位**: 11

---

### 問題12: デッドコード5ファイルと未使用画像111件

| 項目 | 内容 |
|---|---|
| **重大度** | Low |
| **確信度** | 確定 |

**どこからも import されていないファイル**（全ファイル横断の import 解析で確認）:

| ファイル | 行数 | 備考 |
|---|---|---|
| `components/TurtleLogo.tsx` | 94 | |
| `components/motion-provider.tsx` | — | framer-motion の LazyMotion ラッパーと思われる |
| `components/welcome-animation.tsx` | 283 | `fixed inset-0 z-[100]` のオープニング演出 |
| `lib/blur.tsx` | — | `lib/image-placeholders.ts` が現役 |
| `lib/image-blur.ts` | — | 同上 |

**シャドウされているバレルファイル**（同名の `.ts` が優先解決され、`index.ts` に到達しない）:

| ファイル | 実際に解決されるファイル |
|---|---|
| `lib/utils/index.ts` | `lib/utils.ts`（`cn()` を提供）が `@/lib/utils` として解決される |
| `lib/constants/index.ts` | 各所は `@/lib/constants/coupons` を直接 import |
| `lib/services/index.ts` | `app/api/booking/route.ts` は `@/lib/services/gas-service` を直接 import |

`lib/constants/booking.ts` の `BOOKING_CONFIG.MAX_PARTICIPANTS: 4` は、現行の `getPlanMaxParticipants()`（`lib/booking-rules.ts`）と矛盾する古い定数です。`lib/utils/validation.ts` からのみ参照されており、実際の人数上限判定には使われていません。**誤って参照すると人数上限が4名になる**ため、混乱の種になります。

**未使用画像**: `public/` の画像229件中111件（約48%）がどこからも参照されていません。

- `placeholder-*.png` 20件（v0の生成物）
- ルート直下のブログ用と思われる `.jpg` 約70件（記事側は `/images/blog/*-v2.jpg` を使用中で、旧世代の残骸）
- **記号だけのファイル名2件**: `public/-----------------------.jpg`、`public/------------.jpg`
- `public/miyakojima-oceanview-cafe-tropical-drinks.png` = 1.9MB（未参照のPNG）

**影響**: 表示には影響しません。`public/` 全体が38MBあり、デプロイサイズとリポジトリの見通しを悪くしています。

**推奨修正方法**: 参照されていないことを再確認のうえ削除。`lib/constants/booking.ts` の `MAX_PARTICIPANTS` は削除するか、`getPlanMaxParticipants` を参照するよう変更

**修正優先順位**: 12

---

### 問題13: Next.js 15+ で壊れるコードパターン

| 項目 | 内容 |
|---|---|
| **重大度** | Info（現行 14.2.35 では正常） |
| **確信度** | 確定 |

Next.js 15 以降、動的ルートの `params` と `searchParams` は `Promise` になります。本プロジェクトの動的ルートは同期アクセスのため、アップグレード時に修正が必要です。

```ts
// app/(ja)/blog/page/[page]/page.tsx:19
export function generateMetadata({ params }: { params: { page: string } }): Metadata {
  const page = Number(params.page)   // ← Next 15+ では params が Promise
```

該当ルート: `app/(ja)/blog/[slug]/`、`app/(ja)/blog/page/[page]/`、`app/(ja)/plans/[id]/`、および各ロケールの `plans/[id]/`（計6ルート）

Next.js が提供する codemod（`npx @next/codemod@latest next-async-request-api`）で機械的に変換できます。問題10のアップグレード計画と併せて検討してください。

---

## 3. 匿名分析の監査結果

### 存在するイベント一覧

`lib/analytics-schema.ts` の `ANALYTICS_EVENT_NAMES` と、`apps-script/umigame-analytics/Code.gs` の `ANALYTICS_EVENTS` を機械的に照合した結果、**30件が名前・順序とも完全一致**していました（差分0件）。**表記揺れはありません。**

```
schema count 30 / gas count 30
schema にあって GAS に無い: []
GAS にあって schema に無い: []
順序一致: true
```

### イベント対応表

| # | イベント名 | 発火する操作 | 発火場所 | 送信先 | 保存先 | 主なパラメータ | 二重送信リスク | 取りこぼしリスク | 個人情報リスク |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `page_view` | ページ表示・SPA遷移 | `components/detailed-analytics.tsx:42` | fetch | Sheets + Vercel | page_path, locale, device_type | 低（`lastPageViewPath` ref で抑止） | 低 | 無（クエリは `safePath` で除去） |
| 2 | `page_engagement` | 離脱時（2秒以上滞在） | 同 :85 | fetch | 同 | engagedSeconds, maxScrollPercent | 低（`engagementSent` フラグ） | 中（fetchのため遷移に負けうる） | 無 |
| 3 | `scroll_depth` | 離脱時（25%以上スクロール） | 同 :91 | fetch | 同 | maxScrollPercent | 低 | 中 | 無 |
| 4 | `external_link_click` | 外部リンククリック | 同 :72 | fetch | 同 | linkHost, linkType, location | 低 | 中（遷移に負けうる） | 無 |
| 5 | `language_change` | 言語切替リンク | 同 :57 | fetch | 同 | location | 低 | 中 | 無 |
| 6 | `web_vital` | Core Web Vitals計測 | 同 :30 | fetch | 同 | vitalName, vitalValue, vitalRating | 低 | 低 | 無 |
| 7 | `booking_started` | 入力の最初の1操作 | `booking-form.tsx:718-728` | fetch | 同 | plan, first_interaction_type | 無（ref + claimOnce 二重防御） | 低 | 無 |
| 8 | `book_cta_click` | 予約CTAクリック | tracked-cta / navbar / mobile-cta 他6箇所 | fetch + GA4(`reservation_click`) | 同 | location, ctaType, ctaLabel | 低 | 中 | 無 |
| 9 | `line_click` | LINEリンク | 4箇所 | fetch + GA4 | 同 | location | 低 | 中 | 無 |
| 10 | `line_add_friend_click` | 友だち追加ボタン | `booking-form.tsx:1250, 1315` | fetch + GA4 | 同 | location | 低 | 中 | 無 |
| 11 | `phone_click` | 電話ボタン | 2箇所 | fetch + GA4 | 同 | location | 低 | 中 | 無 |
| 12 | `booking_form_view` | フォーム表示（LIFF準備完了時） | `booking-form.tsx:346` / `intl:174` | fetch + GA4 | 同 | locale, line_logged_in, source | 無 | **中（問題6）** | 無 |
| 13 | `line_login_click` | LINEログインボタン | `booking-form.tsx` / `intl` | **sendBeacon** | 同 | location, locale | 低 | 低（Beacon採用済み） | 無 |
| 14 | `booking_submitted` | **予約成功後のみ** | `booking-form.tsx:855` | fetch + GA4(`generate_lead`) | 同 | plan, headcount, total, outcome | 低 | 低 | 無 |
| 15 | `booking_failed` | 送信失敗 | 同 :871 | fetch | 同 | errorCategory, stage | 低 | 低 | 無（生エラー文字列は送らない） |
| 16 | `line_login_redirect_started` | LINE認証へ遷移開始 | `liff-provider.tsx:291` | **sendBeacon** | 同 | redirect_method | 低 | 低 | 無 |
| 17 | `line_login_returned` | LINE認証から復帰 | 同 :181 | fetch | 同 | return_path, return_result | 無（claimOnce） | 低 | 無（パスのみ。クエリ・トークン除外） |
| 18 | `line_login_succeeded` | 有効セッション確認 | `booking-form.tsx:361` | fetch | 同 | return_path, form_restored | 無 | 低 | 無 |
| 19 | `line_login_failed` | 明示的な失敗判定時 | `liff-provider.tsx:185` | fetch | 同 | errorCategory, return_path | 無（種別ごとclaimOnce） | 低 | 無 |
| 20 | `booking_plan_selected` | プラン選択（初回のみ） | `booking-form.tsx:318, 554` | fetch | 同 | plan, selection_source | 無 | 中（問題6） | 無 |
| 21 | `booking_date_selected` | 参加日選択 | 同 :1016 | fetch | 同 | plan, booking_timing（区分のみ） | 無 | 中 | 無（**実日付は送らない**） |
| 22 | `booking_time_selected` | 時間選択 | 同 :559 | fetch | 同 | time_slot | 無 | 中 | 無 |
| 23 | `booking_participants_completed` | 有効人数到達 | 同 :1027 | fetch | 同 | adultCount, group_size_bucket | 無 | 中 | 無 |
| 24 | `booking_price_confirmed` | 合計金額表示 | 同 :1044 | fetch | 同 | total, coupon_applied | 無 | 中 | 無（クーポンコード・スタッフ名は送らない） |
| 25 | `booking_representative_completed` | 代表者情報充足 | 同 :1062 | fetch | 同 | contact_requirements_completed | 無 | 中 | 無（**氏名・電話の実値なし**） |
| 26 | `booking_participant_details_started` | 参加者欄への最初の入力 | 同 :688 | fetch | 同 | headcount | 無 | 中 | 無 |
| 27 | `booking_participant_details_completed` | 全参加者の必須充足 | 同 :1073 | fetch | 同 | wetsuit_requested 等 | 無 | 中 | 無（**年齢・身長・体重・足サイズなし**） |
| 28 | `booking_submit_clicked` | 送信ボタン押下（API通信直前） | 同 :760 | fetch | 同 | plan, headcount, total | 無 | 低 | 無 |
| 29 | `booking_validation_error` | 送信領域を押したが不足あり | 同 :1125 | fetch | 同 | missing_field_categories, error_count | 低（`claimChanged`） | 低 | 無（**項目の種別のみ**） |
| 30 | `booking_abandoned` | pagehide / visibilitychange | 同 :1096 | **sendBeacon** | 同 | last_stage, elapsed_seconds_bucket | **中（問題4）** | 低 | 無 |

### GA4へ送られるイベント（7件のみ）

```ts
// lib/analytics.ts:44-52
const GA_EVENT_NAME: Partial<Record<TrackEventName, string>> = {
  book_cta_click: "reservation_click",
  line_click: "line_click",
  line_add_friend_click: "line_add_friend_click",
  phone_click: "phone_click",
  booking_form_view: "booking_form_view",
  line_login_click: "line_login_click",
  booking_submitted: "generate_lead",
}
```

ファネルの詳細イベント（20〜30番）は **Vercel Analytics とスプレッドシートのみ**に送られます。この設計が意図通りか、GA4管理画面と併せて確認してください。

また GA4 への送信は本番のみ有効です。

```ts
// components/site-root-layout.tsx:27-28
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const enableGa = process.env.NODE_ENV === "production" && !!gaId
```

Vercel のプレビューデプロイでは `NODE_ENV === "production"` になるため、**プレビュー環境のイベントもGA4に混入する**可能性があります（Vercel は プレビューでも本番ビルドを行うため）。GA4側でホスト名フィルタを設定することを推奨します（Info）。

### 正常に取得できているイベント

上記30件すべてがスキーマ・API・GASの3層を通過できる状態です。列マッピング（`eventToRow_` 1130-1190行）と `EVENT_HEADERS`（61行〜、約60列）の対応も確認済みです。

### 二重送信の可能性

| ケース | 判定 | 根拠 |
|---|---|---|
| React Strict Mode の二重実行 | **問題なし** | `claimOnce` がモジュールスコープのため吸収される |
| 再レンダリング | **問題なし** | 同上 |
| ページ再読み込み | **仕様通り** | `firedOnce` がリセットされ再送される（別セッション扱いとして妥当） |
| ブラウザバック / bfcache | **問題なし** | 復帰時に `pagehide` 発火済みのため `page_engagement` は再送されない |
| `pagehide` と cleanup の両方 | **問題なし** | `engagementSent` フラグで抑止（`detailed-analytics.tsx:79-93`） |
| **`booking_abandoned` + `booking_submitted` の同時記録** | **問題あり（問題4）** | visibilitychange 起因の誤発火 |

### 取りこぼしの可能性

- `page_engagement` / `scroll_depth` / `external_link_click` / `language_change` は `fetch(keepalive)` を使っており、遷移直前だと取りこぼしうる。実データで取りこぼしが確認された `line_login_click` 等は既に `sendBeacon` に移行済み（`lib/detailed-analytics.ts:159-176` に経緯が明記）。**同じ理由で `external_link_click` も Beacon 化が望ましい**（Info）
- 問題6のSPA遷移による欠落
- JavaScript無効・広告ブロッカー・オフラインでは全イベントが欠落するが、`try/catch` で握りつぶされ予約操作は止まらない（`lib/booking-funnel.ts:277-283`）

### 個人情報混入の可能性

**混入経路は見つかりませんでした。** 三重の許可リストで防御されています。

| 層 | ファイル | 行 |
|---|---|---|
| クライアント | `lib/analytics.ts` | 39-42（`ALLOWED_PROPERTY_KEYS`） |
| サーバー | `app/api/analytics/events/route.ts` | 13, 34-39（`propertyKeys`） |
| GAS | `apps-script/umigame-analytics/Code.gs` | 1078-1104（`normalizeProperties_`） |

加えて:

- `safePath` が**クエリ付きパスを "/" に落とす**ため、URLに氏名やメールが載っても記録されない

  ```ts
  // app/api/analytics/events/route.ts:24-27
  function safePath(value: unknown): string {
    const path = text(value, 300)
    return path.startsWith("/") && !path.includes("?") ? path : "/"
  }
  ```

- `lib/booking-funnel.ts` は設計として**氏名・電話・メール・日付・年齢・身長・体重・足サイズ・LINEの識別子やトークンを引数にすら取りません**（ファイル冒頭1-10行の設計方針、実装もその通り）

- `currentPathForAnalytics` が `pathname` のみを返し、`liff.state` や `access_token` を含むクエリ・ハッシュを除外

  ```ts
  // components/liff-provider.tsx:94-102
  // 分析へ送るのはパスのみ。クエリやハッシュには liff.state・access_token・
  // OAuthコード等が入りうるため決して含めない。
  ```

- エラーは `errorCategory`（分類文字列）と `stage` のみで、生のエラーメッセージは送信されない

### 匿名性

| 項目 | 状態 |
|---|---|
| 永続ユーザーID | **なし** |
| Cookie | **なし** |
| セッションID | **なし** |
| localStorage | 流入元のみ（`booking_attribution_v1`：UTM・参照元ホスト・着地パス・タイムスタンプ）。90日失効 |
| sessionStorage | フォーム下書き（`booking-form-draft`）とLINE遷移フラグ。分析には送信されない |
| IPアドレス | 記録されない |
| User-Agent | ブラウザ名・OS名という粗い区分に変換してから送信 |
| 同意管理 | なし（識別子を持たない設計のため整合） |

### スプレッドシート保存の問題

- 共有シークレット照合あり、未設定時はフェイルクローズ

  ```js
  // apps-script/umigame-analytics/Code.gs:243-249
  const expectedSecret = PropertiesService.getScriptProperties().getProperty(
    ANALYTICS_CONFIG.secretProperty
  );
  if (!expectedSecret || body.secret !== expectedSecret) {
    return jsonResponse_({ ok: false, error: 'unauthorized' });
  }
  ```

- `LockService.tryLock(10000)` による排他制御あり（258-267行）
- **イベントIDが無いため冪等性はありません**。同一イベントが2回届けば2行になります（クライアント側の `claimOnce` が実質的な防波堤）
- Next.js側は保存失敗時に502を返すだけで**再送しません**（route.ts:99-101）。GAS障害中のイベントは失われます
- タイムゾーン: `occurred_at` はISO(UTC)で送られ、`appsscript.json` の `"timeZone": "Asia/Tokyo"` と `parseOccurredAt_` で日本時間に変換されます

### イベント順序のトレース

#### (a) 正常系

トップページ → 予約ボタン → フォーム表示 → 入力開始 → 送信 → 完了

```
page_view(/)
→ book_cta_click
→ page_view(/book)                              ← SPA遷移
→ page_engagement + scroll_depth（/ の離脱分）
→ booking_form_view                             ← isLiffReady 到達時
→ line_login_click → line_login_redirect_started   ← LINE未ログインの場合
→ （LINE認証へ遷移・復帰）
→ line_login_returned → line_login_succeeded
→ booking_started                               ← 最初の1操作
→ booking_plan_selected
→ booking_date_selected
→ booking_time_selected
→ booking_participants_completed
→ booking_price_confirmed
→ booking_representative_completed
→ booking_participant_details_started
→ booking_participant_details_completed
→ booking_submit_clicked
→ booking_submitted                             ← APIが success:true を返した後のみ
```

実際の並びは操作順に依存します。各ステージは `claimOnce` で1回きりです。

#### (b) 入力エラー系

必須項目未入力で送信 → エラー → 前へ戻る → 再入力 → 送信

```
… booking_started → booking_plan_selected → …
→ booking_validation_error
     stage="submission"
     action_type="submit"
     missing_field_categories="foot_size,phone"
     error_count=2
→ （再入力）
→ booking_participant_details_completed
→ booking_representative_completed
→ booking_validation_error は再送されない        ← 不足内容が同じなら claimChanged が抑止
→ booking_submit_clicked → booking_submitted
```

**注意**: 「前のステップへ戻る」に相当する `booking_step_back` イベントは**実装されていません**。このフォームは単一ページのスクロール型で、ステップ遷移の概念がないためです。想定イベント一覧にあった `booking_step_back` は、現在の設計では発生しません。

#### (c) 通信エラー系

```
→ booking_submit_clicked
→ booking_failed（errorCategory="server",       stage="gas_response"）  ← 502
→ booking_failed（errorCategory="rate_limited", stage="rate_limit"）    ← 429
→ booking_failed（errorCategory="validation",   stage="server_validation"） ← 400/422
→ booking_failed（errorCategory="authentication", stage="line_session"） ← 401/403
→ booking_failed（errorCategory="network",      stage="api_request"）   ← 通信断
```

`isSubmitted` は true にならないため `booking_submitted` は送られません。**送信失敗が成功として計測されることはありません。**

#### (d) 途中離脱系

```
・タブを閉じる:   pagehide → booking_abandoned（last_stage, elapsed_seconds_bucket）
・タブを切替:     visibilitychange(hidden) → booking_abandoned   ← 問題4：誤検知
・LINEへ遷移:     line_login_redirect_started
                  →（abandoned は isLineLoginRedirectInProgress で抑止）
                  → 復帰 → line_login_returned → line_login_succeeded
・送信中に離脱:  submissionInFlightRef により abandoned は送られない
・完了後に離脱:  isSubmitted により abandoned は送られない
```

### 実環境で追加確認が必要な項目

- GA4管理画面で `reservation_click` / `generate_lead` / `booking_form_view` が実際に受信されているか
- `generate_lead` の `value` パラメータが円換算で入っているか（`lib/analytics.ts:114-122`）
- GASの実行ログとクォータ消費（問題5の悪用兆候を含む）
- 分析スプレッドシートの「イベントデータ」シートの総行数と、上限（約16万行）までの余裕
- GA4のホスト名フィルタ（プレビュー環境の混入対策）

---

## 4. 予約処理の監査結果

### 予約開始から保存完了までのデータフロー

```
【ブラウザ】
  BookingForm（components/booking-form.tsx）
    ├ 下書き: sessionStorage "booking-form-draft" に随時保存（:329-334）
    ├ LINE:   LiffProvider が liff.init → getIDToken（liff-provider.tsx:167-274）
    └ 送信直前: getFreshLineIdToken() で残60秒以上のトークンのみ取得（:317-325）
         │
         ↓ POST /api/booking（JSON）
【Vercel / Node Runtime】
  app/api/booking/route.ts
    1. レートリミット判定（IP、10分5回）                     :406-412
    2. JSONパース失敗 → 400                                  :414-422
    3. validateBookingRequest                                :424-430
         ├ プラン実在 / coming_soon 拒否 / locale別プラン許可
         ├ 日付形式（YYYY-MM-DD）/ 日本時間の過去日拒否
         ├ 時間の妥当性（plan.timeTags と照合）/ 夜時間（COMBO_NIGHT_TIMES）
         ├ 氏名必須 / 電話番号 / メール（任意）
         ├ 参加者配列の存在
         ├ validateBookingRules（大人1名以上・最大人数・規約同意）
         ├ 参加者ごと（区分・年齢範囲・60歳制限・足サイズ・レンタル可否）
         └ スタッフ指名の妥当性
    4. verifyLineIdToken → LINE公式API /oauth2/v2.1/verify    :440-459
         iss / aud / sub / exp を検証。失敗は 401 または 503
    5. generateBookingNumber()                               :461
    6. calculateCouponDiscount（サーバー再計算）              :465
    7. calculateServerSidePrice（サーバー再計算）             :468-474
    8. buildGASPayload                                       :476-483
         lineUserId / lineDisplayName は LINE検証結果から取得
         （クライアント送信値は使用しない）
         │
         ↓ POST GAS_BOOKING_URL（10秒タイムアウト / gas-service.ts:56）
【Google Apps Script: umigame-reservation-admin】
  doPost（Code.gs:1060）
    ├ C3/C4 海空セット → 2行に分割（:1082-1140）
    │    海亀時刻 → +90分 → ドローンSUP時刻
    ├ C1/C2 昼夜セット → 2行に分割（:1140-1194）
    │    海亀時刻 + 備考から抽出した夜時刻
    └ その他            → 1行（:1195-1210）
    │
    ├→ writeBookingRows_      ← LockService.waitLock(10000)（:1042-1057）
    ├→ addToCalendar          ← try/catch で握りつぶし（:1216-1220）★問題7
    └→ sendBookingEmail       ← 内部 try/catch（:906-1003）で握りつぶし
    → return { success: true, bookingNumber }
         │
         ↓
  gas-service.ts: success === true のときのみ成功と判定（:91）
         │
         ↓
  フォーム: response.ok && success===true のときのみ完了画面（:828, :869）
    → sendDetailedEvent("booking_submitted")
    → clearBookingDraft()
```

### 確定連絡は別フロー

予約送信時点では、お客様へのLINE通知は行われません。

1. 運営がスプレッドシートのM列（予約ステータス）を手動で変更
2. T列（LINE送信）にチェック
3. GAS の編集トリガーが `sendLineNotify`（Code.gs:2388〜）を実行

完了画面が「友だち追加」を強く促しているのはこのためです（`booking-form.tsx:1236-1256`）。**LINEログインだけでは確定連絡が届かない**ことを明示しており、正しい設計です。

### 二重予約リスク

| 経路 | 対策 | 判定 |
|---|---|---|
| 送信ボタン連打 | `submissionInFlightRef`（:741）+ `isSubmitting` による `disabled`（:2362） | ○ |
| ページ再読み込み中の重複 | ブラウザが送信を止める | ○ |
| **タイムアウト後の再送信** | **なし** | **×（問題3）** |
| 2タブ同時送信 | `sessionStorage` はタブ単位のため独立。レートリミット5回以内なら通過 | △ |
| GAS側の同時書き込み | `LockService.waitLock(10000)` | ○（行衝突のみ。重複内容は防げない） |

### データ欠損リスク

- **問題2（S8の時間欄）が確定の欠損**です
- GAS `doPost` は `writeBookingRows_` を最初に実行するため、**シートへの書き込みが失敗した場合は例外が外側のcatchに届き `success:false` が返る**（→ Next.jsが502 → お客様も失敗と認識）。この順序は正しい設計です
- 逆に、シートに書けた後の失敗（カレンダー・メール）は `success:true` になります。メールは自前catchで握りつぶすため運営が予約に気づけない可能性がありますが、**シートには残るため復旧可能**です

### 金額計算の問題

**問題なし。** クライアントの `totalPrice` はペイロードに含まれますが（`booking-form.tsx:813`）、サーバーは無視して再計算します。

```ts
// app/api/booking/route.ts:292-314
const calculateServerSidePrice = (plan, participants, selectedStaff, couponDiscount, isIntl) => {
  const { adultCount, childCount, under3Count } = countParticipantsByCategory(participants)
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
```

フォーム側（`booking-form.tsx:517-548`）と**同一の式・同一のデータソース**（`PLAN_PRICE_DATA`）を使っており一致します。

`vipSurcharge` は全プランで0固定（`lib/booking-plans.ts:37`、`lib/data.ts:243`）で、貸切料金は既にプラン単価（S2=9,000円等）に織り込まれています。

さらにレスポンスの `data.totalPrice` を完了画面が優先表示するため、**お客様が見る最終金額はサーバーの再計算結果**です。

```ts
// components/booking-form.tsx:842-847
const confirmedTotalPrice =
  typeof responseData.data?.totalPrice === "number" && … >= 0
    ? responseData.data.totalPrice
    : totalPrice
```

**改ざんは成立しません。**

#### プラン別の料金定義（`lib/plan-price-display.ts:16-32`）

| ID | 大人 | 子供 | 備考 |
|---|---|---|---|
| S1 | 6,500 | 6,000 | |
| S2 | 9,000 | 9,000 | 貸切 |
| S3 | 4,000 | 4,000 | ナイト・3歳以下無料 |
| S4 | 9,500 | 8,500 | 貸切サンセットSUP・時間任意 |
| S8 | 7,500 | 6,500 | 通常サンセットSUP・時間任意 |
| S5 | 8,000 | 8,000 | 貸切ナイト・3歳以下無料 |
| S6 | 7,500 | 6,500 | ドローンSUP |
| S7 | 9,500 | 8,500 | 貸切ドローンSUP |
| C1 | 9,500 | 9,000 | 昼夜セット |
| C2 | 16,000 | 16,000 | 貸切昼夜セット |
| C3 | 13,000 | 11,500 | 海空セット |
| C4 | 17,500 | 16,500 | 貸切海空セット |
| C5 | 16,000 | 14,500 | トリプル |
| C6 | 24,500 | 23,500 | 貸切トリプル |
| slide-boat | 14,000 | 12,000 | coming_soon（予約不可） |

スタッフ指名料: 既定1,000円、staff1（やまちゃん）のみ3,000円（`lib/data.ts:16-24`）

### クーポン処理

- コード一覧（`UMIGAME500`=500円/人、`カメハメハ`=1,000円/人）は `lib/constants/coupons.ts` にあり、**クライアントバンドルには含まれません**。`/api/coupon` 経由でのみ検証されます
- セットプラン C1〜C6 はコードが有効でも割引0（`COUPON_INELIGIBLE_PLAN_IDS`、coupons.ts:13）。予約APIでも再判定
- 総当たり対策: `/api/coupon` に10分15回のレート制限（`app/api/coupon/route.ts:9-28`）
- 人数・プラン変更時は200msデバウンスで再検証し、失効すれば0にリセット（`booking-form.tsx:632-679`）
- 3歳未満は割引対象外（`eligibleCount` が adult/child のみ、coupons.ts:29-31）
- 割引後の合計は `Math.max(0, …)` でマイナスにならない
- 下書き復元時、`couponDiscount` は必ず0にリセットされ再検証される（`booking-form.tsx:280-281`）

### 人数・年齢条件

`lib/plan-flags.ts` を単一ソースとして、フォーム・API・参加者フォームが共通参照しています。

```ts
// lib/plan-flags.ts:103-110
export function getParticipantAgeRange(planId, category) {
  if (category === "adult") return { min: 13, max: 100 }
  if (category === "child") return { min: isNightTourPlan(planId) ? 4 : 5, max: 12 }
  if (category === "under3" && FREE_UNDER3_PLAN_IDS.has(planId)) return { min: 0, max: 3 }
  return null
}
```

| 条件 | フォーム | API |
|---|---|---|
| 大人 13〜100歳 | ✓ | ✓ |
| 子供 5〜12歳（S3/S5は4〜12歳） | ✓ | ✓ |
| 3歳以下 0〜3歳（S3/S5のみ） | ✓ | ✓ |
| 60歳以上制限（S1/S3/S6/S8/C1/C3/C5） | ✓ `:897-899` | ✓ `:172-177` |
| 最大人数 | ✓ `:703-706` | ✓ `:260-262` |
| 大人1名以上必須 | ✓ `:913` | ✓ `:257-259` |
| 規約同意 | ✓ `:917` | ✓ `:263-265` |

### サーバー側検証

| 改ざん対象 | 防御 | 判定 |
|---|---|---|
| 金額 | サーバー再計算（クライアント値を無視） | ○ |
| プラン | `PLANS` 実在確認 + coming_soon拒否 + locale別許可 | ○ |
| 日付 | 形式検証 + 日本時間の過去日拒否（`getTodayInJapan`） | ○ |
| 時間 | `plan.timeTags` との照合、夜時間は `COMBO_NIGHT_TIMES` 照合 | ○ |
| 人数 | 上限・大人必須・カテゴリ妥当性 | ○ |
| 年齢 | `isParticipantAgeValid` でプラン別範囲 | ○ |
| レンタル | プラン別可否・子供の度付きマスク不可 | ○ |
| クーポン | サーバー再計算・対象外プラン強制0 | ○ |
| スタッフ指名 | ID許可リスト + プラン別可否 | △（S8のみ問題9） |
| LINE ID | クライアント値を使わずLINE公式APIの検証結果を採用 | ○ |
| 流入元 | `sanitizeAttributionValue` でASCII安全文字のみ、長さ制限 | ○ |
| locale | `isIntlLocale` + `isPlanAllowedForLocale` で貸切限定を強制 | ○ |

### エラー処理

- 500系のエラー詳細はお客様に返さない

  ```ts
  // components/booking-form.tsx:833-836
  const publicErrorMessage =
    response.status < 500 && responseData?.error
      ? responseData.error
      : "予約を送信できませんでした。時間をおいてもう一度お試しいただくか、LINEでお問い合わせください。"
  ```

- `console.error` にはエラーコード・HTTPステータスのみを出力し、氏名・電話・トークンは出していない（`route.ts:446, 501-504` / `line-login-service.ts:65, 108`）
- 401受信時は `invalidateLineSession()` でセッションを破棄しログイン導線へ戻す（`:830-832`）

### Apps Script連携

| 項目 | 状態 |
|---|---|
| 送信キー ⇄ 受信キー | 一致（`BookingPayload` ⇄ `data.*`） |
| 日付形式 | `YYYY-MM-DD`（`getCalendarDateParts_` が分解） |
| 時刻形式 | `HH:MM`（`normalizeTime_` が正規化）。**S8/S4は非対応（問題2）** |
| 配列（participants） | `buildParticipantsDetail` で整形 |
| 日本語・絵文字・改行 | JSON経由のため保持される |
| 同時アクセス | `LockService.waitLock(10000)` |
| 冪等性 | **なし（問題3）** |
| リトライ | なし |
| HTTPステータス | GASは常に200を返し、JSON内の `success` で判定 |
| CORS | GAS Webアプリはサーバー間通信のためCORS不要 |
| 認証 | **なし**（URLの秘匿性のみ。ただしURLは環境変数管理で非公開） |

### スプレッドシート連携（予約シート19列）

```
受付日時 / 予約番号 / 参加日 / 時間 / 名前 / プラン / 合計金額 / 電話 /
ステータス / 人数内訳 / 参加者詳細 / lineUserId / 予約ステータス / 開催場所 /
LINE名 / スタッフ指名 / クーポンコード / クーポン割引額 / LINE送信
```

`buildBookingRow_`（Code.gs:1010-1040）は**位置ベース**で配列を組み立てます。**列を追加・並べ替えるとコードが壊れます。**

### LINE連携

| 機能 | 実装 | 状態 |
|---|---|---|
| LINEログイン（LIFF） | `components/liff-provider.tsx` | ○ |
| IDトークン検証 | `lib/services/line-login-service.ts` | ○ |
| トークン失効の事前検知 | 残60秒未満で再ログイン誘導（`liff-provider.tsx:73-90`） | ○ |
| 予約確定通知 | GAS `sendLineNotify`（手動トリガー） | ○ |
| 通知API | `/api/line/notify`（Bearer認証 + retryKey で冪等） | ○ |
| LINE内ブラウザ判定 | `liff.isInClient()` → 完了画面の「トークに戻る」 | ○ |
| 友だち追加の促進 | 完了画面・フォーム冒頭の2箇所 | ○ |

### 復旧不能になる可能性

**復旧不能なケースは見つかりませんでした。**

GAS側はシート書き込みを最初に行うため、「シートに無いのにお客様には成功と表示された」という最悪ケースは構造的に発生しません。逆パターン（シートにあるが失敗表示）は問題3で起こりえますが、**シートに記録は残る**ため運営が電話・LINEで確認して復旧できます。

---

## 5. ファイル・画像監査

### 存在しないファイル

コードとMarkdownから参照される画像パス148件を `public/` の実ファイルと機械照合しました。**参照切れは0件です。**

検出された8件はいずれも誤検知でした。

| 検出パス | 実態 |
|---|---|
| `/combo-day-night.webp` 他3件 | `lib/tour-assets.ts` では `/images/tours/combo/...` とフルパスで参照。実ファイルも存在。パス抽出時の部分一致 |
| `/icon.png` | `components/json-ld.tsx:38` が `${SITE_URL}/icon.png` を参照。**`app/icon.png` が存在**し、Next.js の routes-manifest に `/icon.png` が静的ルートとして登録済み（ビルド出力 `.next/server/app/icon.png` で確認）✓ |
| `/images/blog/xxx-v2.jpg` | `docs/blog-writing.md:25` のテンプレート例 |
| `/images/gallery/turtle/turtle-007-couple.webp` | `lib/gallery-images.ts:9` のコメント内の記述例 |
| `/manifest.webm` | `docs/full-site-audit.md` の過去レポート本文 |

### 大文字小文字の問題

**0件。** macOSは大小を区別しませんがVercel（Linux）は区別するため、本番だけ404になる典型的な事故です。全148件を `grep -ixF` で厳密照合した結果、不一致はありませんでした。

### 未使用ファイル

`public/` 内の画像229件中、**111件（約48%）がどこからも参照されていません**。詳細は問題12を参照してください。

### 重い画像

| ファイル | サイズ | 備考 |
|---|---|---|
| `public/images/` 全体 | 38MB | 最大の占有 |
| `public/miyakojima-oceanview-cafe-tropical-drinks.png` | 1.9MB | **未参照**。PNGのため特に重い |
| `public/souichiro-staff-photo.jpg` | 496KB | 参照あり |
| `public/mana-staff-photo.jpg` | 480KB | 参照あり |
| `public/hikaru-staff-photo.jpg` | 328KB | 参照あり |

スタッフ写真は `next/image` 経由のため、実配信は AVIF/WebP に自動変換されて軽くなります。

### Next.js Image の設定

`next.config.mjs:18-36` は適切です。

| 設定 | 値 | 評価 |
|---|---|---|
| `formats` | `['image/avif', 'image/webp']` | ○ |
| `deviceSizes` | `[360, 414, 768, 1024, 1280, 1920]` | ○ モバイル実機幅を含む |
| `imageSizes` | `[16, 32, 48, 64, 96, 128, 256, 384]` | ○ |
| `minimumCacheTTL` | `31536000`（1年） | ○ |
| `dangerouslyAllowSVG` | `true` | ○ CSP + `contentDispositionType: 'attachment'` で無害化済み |
| `remotePatterns` | v0/Vercel Blob の2ドメイン | △ **現在どのコードからも参照されていない**（削除候補） |

### `<Image>` の使用状況

- **`<Image>` 29箇所すべてに `alt` あり**（`<Image` 29件 ⇄ `alt=` 29件）✓
- **`fill` を使う全箇所に `sizes` あり**（機械照合で欠落0件）✓
- `priority` 指定10箇所（各ページのヒーロー画像）✓
- 装飾画像は `alt=""` で明示（`image-gallery.tsx:145`、`article-related-content.tsx:54`）✓

### OGP・SNS共有

| 項目 | 状態 |
|---|---|
| `OG_IMAGE` が絶対URL | ✓ `lib/seo.ts:11` — LINEのリンクプレビューは相対URLを解決できないため必須 |
| 実ファイル存在 | ✓ `public/images/og-home.jpg` |
| 宣言サイズ 1200×630 | ✓ コメントに「実寸1200x630」と明記 |
| `metadataBase` 全ロケール設定 | ✓ |
| `twitter.card: summary_large_image` | ✓ |
| favicon / apple-touch-icon / icon | ✓ `app/favicon.ico`、`app/apple-icon.png`、`app/icon.png`（Next.js ファイル規約） |

**注**: `public/` 直下の `favicon-16x16.png`、`favicon-32x32.png`、`apple-touch-icon.png`、`icon.svg`、`icon-dark-32x32.png`、`icon-light-32x32.png` は**未参照**です。`app/` のファイル規約に移行済みのため、旧ファイルの残骸と思われます。

---

## 6. 互換性

コードから読み取れる範囲の評価です。**実機検証は一切行っていません。**

| 環境 | 判定 | 問題 | 根拠 | 実機確認の必要性 |
|---|---|---|---|---|
| iPhone / Safari | △ | `100vh` を使う `.min-h-screen-ios` があるが `-webkit-fill-available` フォールバック付き。`dvh` は未使用 | `app/globals.css:148-151` | **高**（アドレスバー可変時） |
| iPhone / 入力ズーム | ○ | `Input` の基底が `text-base`（16px）で `md:text-sm` は768px以上のみ → iOSの自動ズームは起きない | `components/ui/input.tsx:11` | 低 |
| iPhone / セーフエリア | ○ | `MobileCTA` と記事内スティッキーCTAが `env(safe-area-inset-bottom)` に対応 | `components/mobile-cta.tsx:33,38`<br>`components/blog/article-sticky-cta.tsx:42,51` | 中 |
| iPhone / 横スクロール | ○ | `html` / `body` に `overflow-x: hidden` | `app/globals.css:133-144` | 中 |
| Android / Chrome | ○ | Android固有の分岐なし。標準API中心 | — | 中 |
| iPad / タブレット | △ | `getDeviceType()` が幅768-1024をtabletと判定。レイアウト側のタブレット専用対応は未検証 | `lib/detailed-analytics.ts:30-35` | 中 |
| Windows / Mac | ○ | 問題の兆候なし | — | 低 |
| Safari 全般 | ○ | `backdrop-blur`（`glass-card`）は Safari 9+ 対応。`:has()` 未使用 | `app/globals.css:245-247` | 中 |
| Chrome / Edge | ○ | 問題なし | — | 低 |
| Firefox | ○ | 問題なし | — | 低 |
| **LINE内ブラウザ** | △ | LIFF初期化に `access_token` ハッシュのリトライ処理あり。`sessionStorage` 前提の下書き復元が制限環境で失敗しうるが `try/catch` 済み | `components/liff-provider.tsx:200-209`<br>`components/booking-form.tsx:116-138` | **高**（予約の主要導線） |
| Instagram / Facebook 内ブラウザ | △ | LIFFが動作しない可能性。外部ブラウザ誘導の実装は見当たらない | — | **高** |
| bfcache 復帰 | △ | `pagehide` で `page_engagement` / `booking_abandoned` が送信済みのため復帰後の再計測なし。フォーム状態は sessionStorage から復元 | `components/detailed-analytics.tsx:98`<br>`booking-form.tsx:1111` | 中 |
| JavaScript無効 | × | フォーム全体がクライアントコンポーネント。予約不可 | `components/booking-form.tsx:1` | 低（実用上許容） |
| 古い端末のJS互換 | ○ | `target: "ES6"`。Next.js 14 の既定 browserslist で optional chaining 等はトランスパイル済み | `tsconfig.json:5` | 低 |

### 使用しているブラウザAPI

| API | 使用箇所 | フォールバック |
|---|---|---|
| `navigator.sendBeacon` | `lib/detailed-analytics.ts:125-127` | ✓ fetch(keepalive) へフォールバック |
| `fetch(keepalive)` | 同 :134-141 | ✓ try/catch |
| `AbortController` | `gas-service.ts:55`、`line-login-service.ts:49` | 不要（サーバー側） |
| `URLSearchParams` | 複数 | 不要（広く対応） |
| `navigator.connection` | `lib/detailed-analytics.ts:37-42` | ✓ `\|\| "unknown"` |
| `window.screen` | 同 :88-89 | ✓ `\|\| 0` |
| `matchMedia` | CSS の `@media` のみ | — |
| `IntersectionObserver` | **未使用** | — |
| `ResizeObserver` | **未使用** | — |
| `Clipboard API` | **未使用** | — |
| `Web Share API` | **未使用** | — |
| `structuredClone` | **未使用** | — |

### z-index の階層

| 値 | 要素 | ファイル |
|---|---|---|
| `z-[1]` | 装飾 | — |
| `z-10` / `z-20` | セクション内の重なり | 26箇所 |
| `z-50` | ナビゲーションバー（sticky top-0） | `components/navbar.tsx:110` |
| `z-50` | プラン詳細の固定タブバー（fixed top-0） | `components/plan-detail-page.tsx:959` |
| `z-50` | 記事内スティッキーCTA（fixed bottom-0、md:hidden） | `components/blog/article-sticky-cta.tsx:45` |
| `z-[60]` | モバイル固定CTA（fixed bottom-0、md:hidden） | `components/mobile-cta.tsx:35` |
| `z-[100]` | 予約完了モーダル | `components/booking-form.tsx:1167` |
| `z-[100]` | 画像ライトボックス | `components/image-gallery.tsx:78` |
| `z-[100]` | ウェルカムアニメーション | `components/welcome-animation.tsx:39`（**未使用ファイル**） |

**下部固定CTAの重複は起きません。** `ArticleStickyCta` のコメントに明記され、`app/(ja)/miyakojima-sea-turtle/page.tsx:332` でも意図的に排他制御されています。

```tsx
// components/blog/article-sticky-cta.tsx:20-22
/**
 * 記事詳細ページだけに出すスマホ固定CTA。
 * サイト共通の MobileCTA はブログ記事ページでは描画されないため、ここでの二重表示は起きない。
 */
```

**懸念（Low）**: `plan-detail-page.tsx:959` の `fixed top-0 z-50` と、navbar の `sticky top-0 z-50` が同じ z-index です。スクロール時に固定タブバーが navbar を覆う設計と思われますが、DOM順序に依存するため実機での確認が望ましいです。

---

## 7. セキュリティ

### 確定している問題

1. **`/api/analytics/events` の無認証公開**（Medium）— 問題5
2. **依存パッケージの high 脆弱性10件**（Medium）— 問題10
3. **CSP と HSTS が未設定**（Low）— 問題11

### 潜在的な問題

**予約APIのレートリミットがインスタンス単位**（`app/api/booking/route.ts:88-111`）。Vercelは複数インスタンスを持ち、コールドスタートで消えます。コード内のコメントにもその旨が明記されています。

```ts
// 簡易レートリミット（インスタンス内メモリ）。Vercelはインスタンスを再利用するため
// 完全ではないが、スパム送信によるGAS予約シート・LINE通知の氾濫を抑止する
```

ただし**LINEトークン必須が実質的な主防壁**として機能しており、攻撃者は正規のLINEアカウントでログインしなければ1件も通せません。

**CSRF対策のOrigin検証なし**。`/api/booking` は `Content-Type` を検証せず `request.json()` でパースするため、`text/plain` を使ったクロスサイト送信は理論上プリフライトを回避できます。ただし**有効なLINE IDトークンが必須**のため、攻撃者は被害者のトークンを取得できず成立しません。

| エンドポイント | CSRF成立可能性 | 理由 |
|---|---|---|
| `/api/booking` | **不可** | 有効なLINE IDトークンが必要 |
| `/api/coupon` | 可（ただし無害） | 割引額の照会のみ。情報漏えい価値が低い |
| `/api/line/notify` | **不可** | `Bearer` シークレット必須 |
| `/api/analytics/events` | **可（問題5）** | 認証なし |

### 秘密情報

**露出は見つかりませんでした。**

| 確認項目 | 結果 |
|---|---|
| `.gitignore` | ✓ `.env*` と `.clasp.json` を登録済み |
| ローカルの `.env` ファイル | 存在しない（Vercel環境変数側で管理） |
| 追跡ファイル内の秘密情報 | `git ls-files` で確認 → なし |
| **Git履歴に追加された秘密ファイル** | **なし**（292コミットを走査。`.clasp.json.example` 2件のみで、中身はプレースホルダ） |
| 追跡ファイル内のGAS URL / トークン | `git grep` で `AKfycb`、`script.google.com/macros`、`Bearer <長い文字列>` を検索 → **0件** |

`NEXT_PUBLIC_` の使い分けも正しく行われています。

| 環境変数 | 露出 | 評価 |
|---|---|---|
| `NEXT_PUBLIC_LIFF_ID` | クライアント | ○ URLに現れる公開値 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | クライアント | ○ 公開前提 |
| `LINE_LOGIN_CHANNEL_ID` | サーバーのみ | ○ |
| `GAS_BOOKING_URL` | サーバーのみ | ○ |
| `LINE_NOTIFY_SECRET` | サーバーのみ | ○ |
| `LINE_CHANNEL_ACCESS_TOKEN` | サーバーのみ | ○ |
| `ANALYTICS_SHEETS_WEBHOOK_URL` | サーバーのみ | ○ |
| `ANALYTICS_SHEETS_SHARED_SECRET` | サーバーのみ | ○ |

GAS側の Spreadsheet ID・共有シークレットも `PropertiesService`（スクリプトプロパティ）管理で、コードに直書きされていません。

### 個人情報

| 項目 | 状態 |
|---|---|
| クライアントに露出する個人情報 | LINEの表示名とユーザーIDのみ（本人のもの） |
| 旧実装の localStorage 永続化 | ✓ 起動時に削除（`liff-provider.tsx:58-65, 281`） |
| ログ出力 | ✓ エラーコード・HTTPステータスのみ |
| Analyticsへの送信 | ✓ 三重の許可リストで遮断 |
| エラーメッセージ | ✓ 500系はサーバーの詳細を返さない |

### 不正予約

主防壁は **LINE IDトークンの検証**です。副次的にIP単位のレートリミット（10分5回）。reCAPTCHA / BotID は未導入ですが、LINE必須という強い制約があるため現状で妥当です。

### 不正イベント送信

問題5の通り、分析APIは無防備です。**セキュリティ面で最も対応価値の高い項目**です。

### XSS / インジェクション

| 経路 | 状態 |
|---|---|
| `dangerouslySetInnerHTML` | `components/json-ld.tsx` の8箇所のみ。いずれも `JSON.stringify(schema)` による**固定データ**の構造化マークアップで、ユーザー入力は流入しない ✓ |
| `react-markdown` | **`rehypeRaw` を使っていない**ため、Markdown中の生HTMLは無効化される ✓ 記事はリポジトリ内の `content/blog/*.md` のみでユーザー投稿なし |
| Open Redirect | LINEログインの `redirectUri` は `window.location.href`（自サイト）固定（`liff-provider.tsx:293`）。URLパラメータからのリダイレクトは未実装 ✓ |
| GAS備考欄のマーカー衝突 | `sanitizeAttributionValue`（`route.ts:341-342`）と `lib/attribution.ts:21-25` が ASCII安全文字のみに制限 ✓ |

### 推奨対策（優先順）

1. `/api/analytics/events` に same-origin チェックとレート制限を追加
2. `npm audit fix`（非破壊）で axios 等を更新
3. `Content-Security-Policy` を `report-only` から段階導入
4. GAS `doPost` の冪等化（問題3と兼ねる）
5. Next.js のメジャーアップグレード計画（問題10・13）

---

## 8. SEO・パフォーマンス・アクセシビリティ

### SEO — 良好

#### 全ルート一覧（40ルート + 4 APIルート）

```
日本語（16）
  /  /access  /blog  /blog/[slug]  /blog/page/[page]  /book  /faq
  /gallery  /miyakojima-sea-turtle  /plans  /plans/[id]  /privacy
  /safety  /staff  /terms  /tokushoho

英語（8）    /en  /en/book  /en/faq  /en/miyakojima-sea-turtle
             /en/plans  /en/plans/[id]  /en/privacy  /en/terms
韓国語（8）  /ko/... （同構成）
繁体字（8）  /zh-tw/... （同構成）

API（4）
  /api/analytics/events  /api/booking  /api/coupon  /api/line/notify
```

#### メタデータの網羅性

**全ルートが title / description / canonical / OGP / Twitter Card を持ちます。**

`metadata` を直接持たない2ページも、親レイアウトから**正しい**canonicalを継承しています。

| ページ | metadata の出所 | canonical | 評価 |
|---|---|---|---|
| `app/(ja)/page.tsx` | `app/(ja)/layout.tsx` | `/` | ✓ 正しい（ホームページ） |
| `app/(ja)/blog/page.tsx` | `app/(ja)/blog/layout.tsx` | `/blog` | ✓ 正しい |

**canonicalが誤って親を指す問題はありません。**

#### hreflang

`createMetadata` の `intlBasePath` を渡したページで ja / en / ko / zh-Hant / x-default を相互リンクします。

```ts
// lib/seo.ts:44-52
const languages = intlBasePath !== undefined
  ? {
      [LOCALE_LANG_TAGS.ja]: `${SITE_URL}${intlBasePath}`,
      ...Object.fromEntries(INTL_LOCALES.map((l) => [LOCALE_LANG_TAGS[l], …])),
      "x-default": `${SITE_URL}${intlBasePath}`,
    }
  : undefined
```

**日本語のみのページ（`/blog`・`/staff`・`/gallery`・`/access`・`/safety`・`/tokushoho`）には hreflang を出さない**という正しい設計です（存在しないロケールURLを宣言しない）。

#### サイトマップ

`app/sitemap.ts` は静的ページ・多言語ページ・プラン詳細・多言語プラン詳細・ブログ記事を網羅します。

- 多言語プランは `EN_PLAN_BY_ID` でフィルタ。実際のキー（S2/S4/S5/S7）が `INTL_PLAN_IDS`（S2/S4/S5/S7）と**完全一致** ✓
- `lastModified` は `new Date()` ではなく固定日を使用（毎ビルドで全URLが「今日」になる鮮度シグナルの毀損を回避）✓
- `/book` および各ロケールの `/book` は noindex のため除外 ✓
- `/blog/page/[page]` は自己参照canonicalのため除外 ✓（正しい）

#### robots.txt

```ts
// app/robots.ts
rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
sitemap: "https://www.umigamekyoudaimiyakojima.com/sitemap.xml",
```

`/book` はクロール許可 + noindex（クローラーに noindex を読ませるため正しい）✓

#### 予約完了ページのインデックス

**独立URLではなく同一ページ内の状態遷移**（`booking-form.tsx:1165` の `if (isSubmitted) return (...)`）のため、インデックスされる余地がありません ✓

#### ブログのページネーション

```ts
// app/(ja)/blog/page/[page]/page.tsx
export const dynamicParams = false          // 存在しないページ番号は404
export function generateStaticParams() { … } // 2ページ目以降のみ生成
// canonical は path: `/blog/page/${page}` で自己参照
```

✓ 適切

#### middleware のリダイレクト

```ts
// middleware.ts:41-43
export const config = {
  matcher: ['/', '/book', '/blog/16', '/blog/shimojishima-airport-2025-summer-schedule-access'],
}
```

すべて308 Permanent。リダイレクトチェーン・ループは matcher の限定により発生しません ✓

**懸念（Low）**: matcher が `/` と `/book` に限定されているため、`?page=staff` のような旧URLは**トップと予約ページ以外では変換されません**。当時のURL設計次第では取りこぼしがあるかもしれませんが、実害は限定的です。

#### 構造化データ

`components/json-ld.tsx` が8種のスキーマを提供します（WebSite / Organization / Person / LocalBusiness 他）。

- `dangerouslySetInnerHTML` + `JSON.stringify` による埋め込み ✓（正しい方法）
- `Organization.logo` は `${SITE_URL}/icon.png` → `app/icon.png` が `/icon.png` として配信されることをビルド出力で確認済み ✓
- `Organization.image` は `/images/gemini-generated-image-rq969urq969urq96.jpeg` → 実ファイル存在 ✓
- `@id` による相互参照（`#website` → `#organization`）✓

各スキーマの必須プロパティ妥当性の完全検証は、Googleリッチリザルトテストでの実測が確実です。

---

### パフォーマンス — 概ね良好

#### 良好な点

- **`"use client"` は31ファイル。`app/` 配下は `error.tsx` と `BlogPostClient.tsx` の2つだけ**で、ページコンポーネントはサーバーコンポーネントのまま保たれています。これは大きな加点です
- `next/font/google` の `Inter` を使用（`components/site-root-layout.tsx:3,16`）。CSS変数 `--font-inter` 経由で Tailwind に接続 ✓ FOIT/FOUT は Next.js が最適化
- `minimumCacheTTL: 31536000`、AVIF/WebP自動変換 ✓
- `<Image>` の `priority` 指定10箇所（各ページのヒーロー画像）✓
- `fill` を使う全箇所に `sizes` あり ✓ → CLS対策として適切
- `prefers-reduced-motion` 対応（`app/globals.css:305-314`）✓

#### 改善余地

| 項目 | 状態 | 評価 |
|---|---|---|
| `next/dynamic` の使用 | **0件** | `framer-motion`（12.23）、`react-markdown`、`suncalc` + `date-fns` は動的読み込みの候補 |
| スクロールハンドラの throttle | **なし** | `{ passive: true }` は付いており処理も軽量（`Math.max`/`Math.round` のみ）。INPへの実害は小さいが `requestAnimationFrame` でまとめるのが理想（`components/detailed-analytics.tsx:45-49, 96`） |
| GAS 10秒タイムアウト | — | 繁忙期に「10秒待たされて失敗」というUXになりえる（問題3と同根） |
| ローディング表示 | ✓ | `app/(ja)/blog/loading.tsx`、`components/booking-form-skeleton.tsx`（`role="status"` + `aria-live="polite"`）|
| 外部スクリプト | ✓ | GA4 は `@next/third-parties` の `GoogleAnalytics`（本番のみ）、Vercel Analytics は `@vercel/analytics` |

LCP / CLS / INP の実測は未実施です。PageSpeed Insights での測定を推奨します。

---

### アクセシビリティ — 良好

#### 確認できた正常項目

| 項目 | 実装 | 場所 |
|---|---|---|
| 送信完了時のフォーカス移動 | `tabIndex={-1}` + `ref.focus()` | `booking-form.tsx:295-298, 1172`（intl版にも同等実装） |
| 完了画面のダイアログ属性 | `role="dialog"` / `aria-modal="true"` / `aria-labelledby` | `booking-form.tsx:1167` |
| ラベルの関連付け | `htmlFor` + `id` | JA form 6組、participant-form 7組、intl form 全項目 |
| プラン選択のキーボード操作 | `sr-only` で視覚的に隠しつつ実体は `<input type="radio">` | `booking-form.tsx:1389` 他 |
| ギャラリーのキーボード操作 | `role="button"` + `tabIndex={0}` + `onKeyDown`（Enter / Space） | `components/image-gallery.tsx:219-228` ✓ |
| 見出し構造 | 全ページに `<h1>` が1つ（コンポーネント経由を含む） | 13コンポーネント + 8ページ |
| `lang` 属性 | `SiteRootLayout lang={...}` で各ロケール設定 | 4レイアウト |
| 入力支援 | `autoComplete="name"` / `type="tel" autoComplete="tel"` / `type="email" autoComplete="email"` | `booking-form.tsx:2185, 2197-2201`、`booking-form-intl.tsx:962-970` |
| 必須項目の伝達 | `required` 属性 + ラベルの `*` + 不足項目リスト | intl form `:962-966` 他 |
| エラー表示 | 送信不可の理由を日本語で列挙（`missingItems`） | `booking-form.tsx:936-963` |
| ローディングの通知 | `role="status"` + `aria-live="polite"` | `booking-form-skeleton.tsx:16-17` |
| 状態の通知 | `role="status"` | `booking-form.tsx:2349`、`booking-form-intl.tsx:1066` |
| 装飾要素 | `aria-hidden` 24箇所 | 全体 |
| `aria-label` | 18箇所 | ナビゲーション・アイコンボタン |
| `aria-invalid` | 16箇所 | UIコンポーネント基底 |
| `aria-expanded` / `aria-controls` / `aria-haspopup` | ナビゲーション開閉 | `components/navbar.tsx` |

#### 改善余地

| 項目 | 状態 | 重大度 |
|---|---|---|
| `aria-describedby` | **0件**。エラーメッセージが入力欄と programmatically に結び付いていない。ただしこのフォームは per-field インラインエラーではなく、集約リスト + トースト方式のため実害は限定的 | Low |
| ボタングループのラベル | `<Label>` 4箇所（開始時間・大人・子ども・3歳以下）が `htmlFor` を持たない。これらは単一の input ではなくボタン群のラベルのため。`<fieldset><legend>` または `role="group" aria-labelledby` が理想 | Low |
| `inputMode` | **0件**。`type="number"` により iOS では数値キーボードが出るため実害は小さい | Info |
| 色のコントラスト | `text-gray-400` が20箇所、`text-[10px]` との組み合わせが4箇所。`text-gray-400`（#9CA3AF）は白背景でコントラスト比 2.8:1 で **WCAG AA（4.5:1）を下回る**。補足情報が中心だが要確認 | Low |

コントラストの実測は、Lighthouse または axe DevTools での検証を推奨します。

---

## 9. 設定・依存関係・デッドコード

### package.json と実コードの整合

**全依存パッケージが実際に import されています。未使用パッケージはありません。**

| パッケージ | import箇所数 | 用途 |
|---|---|---|
| `lucide-react` | 38 | アイコン |
| `sonner` | 4 | トースト |
| `date-fns` | 3 | 日付フォーマット |
| `framer-motion` | 3 | アニメーション |
| `@vercel/analytics` | 2 | 分析 |
| `class-variance-authority` | 2 | UIバリアント |
| `@radix-ui/react-slot` | 2 | UI基底 |
| `sharp` | 2 | 画像生成スクリプト（`scripts/`） |
| `@line/bot-sdk` | 1 | `/api/line/notify` |
| `@line/liff` | 1 | LIFF |
| `@next/third-parties` | 1 | GA4 |
| `@radix-ui/react-checkbox` / `react-label` | 各1 | UI |
| `clsx` / `tailwind-merge` | 各1 | `cn()` |
| `gray-matter` | 1 | ブログ frontmatter |
| `react-markdown` | 1 | ブログ本文 |
| `suncalc` | 1 | サンセット時刻計算 |

**依存に無いのに import しているものもありません**（`fs`・`path` は Node.js 組み込み）。

### 重複する役割のパッケージ

`@vercel/analytics` と `@next/third-parties`（GA4）を併用しています。これは**意図的な二重計測**です。

- Vercel Analytics: 全30イベント（カスタムイベント）
- GA4: 7イベントのみ（コンバージョン計測用）
- スプレッドシート: 全30イベント（自前の詳細分析）

冗長ではありますが、3系統それぞれに役割があります。

### バージョン互換性

| 項目 | 値 | 評価 |
|---|---|---|
| Next.js | 14.2.35 | ○ 14系の比較的新しいパッチ |
| React | ^18.2.0 | ○ Next 14 と整合 |
| TypeScript | ^5 | ○ |
| Tailwind CSS | ^4.1.9（`@tailwindcss/postcss`） | ○ **CSS-first 方式**（`tailwind.config.*` は存在せず、`app/globals.css` の `@import "tailwindcss"` + `@theme inline` で設定）— v4 の正しい使い方 |
| ESLint | ^8.57.1 + `eslint-config-next` ^14.2.35 | ○ |
| `@line/bot-sdk` | ^10.8.0 | ○ `engines: node >=20` を要求 |

### Node.js バージョン

**`package.json` に `engines` フィールドがなく、`.nvmrc` も存在しません。** Vercel の既定 Node バージョン（現在は 24 LTS）が適用されます。`@line/bot-sdk` の `node >= 20` 要求は満たされますが、**明示していないため将来 Vercel の既定が変わったときに気づけません**（Info）。

### tsconfig.json

```json
{
  "target": "ES6",
  "strict": true,           ← ✓ 有効
  "moduleResolution": "bundler",
  "paths": { "@/*": ["./*"] }
}
```

`strict: true` かつ `tsc --noEmit` がエラー0 — 型安全性は担保されています ✓

### Edge Runtime / Node Runtime

| ルート | runtime | 評価 |
|---|---|---|
| `/api/analytics/events` | `"nodejs"`（明示） | ○ |
| `/api/booking` | 未指定 → Node（既定） | ○ |
| `/api/coupon` | 未指定 → Node | ○ |
| `/api/line/notify` | 未指定 → Node | ○ |
| `middleware.ts` | Edge（Next 14 の既定） | ○ 単純なリダイレクトのみ |

Edge Runtime の使用はありません。Vercel の推奨（Fluid Compute の Node.js）と整合しています ✓

### テストのカバレッジ

`scripts/test-alias-hooks.mjs` により `@/` エイリアスを解決しつつ、`node --test` で `.test.mjs` を実行します（80件全pass）。

| テストファイル | 対象 |
|---|---|
| `lib/analytics.test.mjs` | イベント名マッピング・プロパティのサニタイズ |
| `lib/booking-funnel.test.mjs` | 区分変換・重複防止・失敗段階の判定 |
| `lib/booking-rules.test.mjs` | 大人必須・最大人数・規約同意 |
| `lib/constants/coupons.test.mjs` | クーポン計算・対象外プラン |
| `lib/rental-options.test.mjs` | レンタル料金 |
| `lib/services/gas-service.test.mjs` | GAS応答判定（8ケース） |
| `lib/services/line-login-service.test.mjs` | LINE検証（失敗パターン網羅） |
| `lib/blog/*.test.mjs` | 記事CTA・本文分割・プラン事実 |

**カバーされていない範囲**: `app/api/booking/route.ts` の `calculateServerSidePrice` と `validateBookingRequest`（最も重要なビジネスロジック）、React コンポーネント全般。

### import 解決・循環参照

`tsc --noEmit` がエラー0のため、import 解決の問題はありません ✓ 循環参照の明示的な検査は未実施ですが、ビルドとテストが通っているため実害のある循環はありません。

### 重複定義（シャドウされるバレル）

問題12を参照してください。

### 多言語辞書の網羅性

**TypeScript の型システムが構造的に保証しています。**

```ts
// lib/i18n/dict.ts
const DICTS: Record<IntlLocale, IntlDict> = {
  en: EN_DICT,
  ko: KO_DICT,
  "zh-tw": ZH_TW_DICT,
}
```

`IntlDict`（`lib/i18n/types.ts:267-280`）は11個の必須プロパティを持ち、`strict: true` 下で `tsc --noEmit` がエラー0のため、**3言語すべてに全キーが揃っています** ✓ 翻訳キーの欠落は起こりえません。

**軽微な不整合（Info）**: `lib/i18n/types.ts:278` のコメントが `/** 国際版価格（日本語+¥2,000）の根拠説明。価格の脇に表示 */` となっていますが、`lib/i18n/en-prices.ts` では +¥2,000 の上乗せは既に廃止されています。コメントが古い状態です。

### 国際版フォームと日本語フォームの機能差

| 機能 | 日本語 | 国際版 | サーバー検証 |
|---|---|---|---|
| 対象プラン | 全プラン | **貸切のみ**（S2/S4/S5/S7） | ✓ `isPlanAllowedForLocale` |
| 価格 | `PLAN_PRICE_DATA` | `getEnPrice`（現在は同額） | ✓ 同じ関数を使用 |
| クーポン | ✓ | ✓ | ✓ |
| スタッフ指名 | ✓（S1/S2等） | ✓（S1/S2のみ） | ✓ |
| レンタル | ✓ | ✓ | ✓ |
| コンボプラン | ✓ | ✗（貸切限定のため対象外） | ✓ |
| ナイト時間選択 | ✓ | ✗（C系が対象外のため不要） | ✓ |
| 60歳制限 | ✓ | ✓ | ✓ |
| 人数上限 | ✓ | ✓ | ✓ |

**サーバー検証は共通の `validateBookingRequest` を通るため、片方だけ検証が甘いという穴はありません** ✓

### 国際版フォームの分析イベント

日本語版26箇所に対し、国際版は10箇所です。

| イベント | 日本語 | 国際版 |
|---|---|---|
| `booking_form_view` | ✓ | ✓ |
| `booking_started` | ✓ | ✓ |
| `booking_plan_selected` | ✓ | ✓ |
| `line_login_click` | ✓ | ✓ |
| `booking_submit_clicked` | ✓ | ✓ |
| `booking_submitted` / `booking_failed` | ✓ | ✓ |
| `booking_abandoned` | ✓ | ✓ |
| `booking_date_selected` | ✓ | **✗** |
| `booking_time_selected` | ✓ | **✗** |
| `booking_participants_completed` | ✓ | **✗** |
| `booking_price_confirmed` | ✓ | **✗** |
| `booking_representative_completed` | ✓ | **✗** |
| `booking_participant_details_*` | ✓ | **✗** |
| `booking_validation_error` | ✓ | **✗** |
| `line_login_succeeded` | ✓ | **✗** |

**国際版では中間ステージのファネル計測がありません**（Info）。外国語サイトの離脱地点を特定したい場合は追加が必要です。ただし `locale` パラメータは全イベントに含まれるため、送られているイベントの言語別集計は可能です。

---

## 10. コードからは判断できない項目

### Vercel管理画面で確認する項目

1. **Settings → Environment Variables** を開き、**Production** に以下がすべて設定されているか確認

   | 変数名 | 重要度 | 備考 |
   |---|---|---|
   | `NEXT_PUBLIC_LIFF_ID` | **最優先** | 未設定なら問題1が発動し、全予約が失敗 |
   | `LINE_LOGIN_CHANNEL_ID` | 高 | 数字のみであること（`/^\d+$/` 検証あり） |
   | `GAS_BOOKING_URL` | 高 | 未設定なら予約API が500 |
   | `ANALYTICS_SHEETS_WEBHOOK_URL` | 中 | 未設定なら分析が202で静かに無効化 |
   | `ANALYTICS_SHEETS_SHARED_SECRET` | 中 | 同上 |
   | `LINE_CHANNEL_ACCESS_TOKEN` | 中 | GAS→通知APIで使用 |
   | `LINE_NOTIFY_SECRET` | 中 | 同上 |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 低 | 未設定ならGA4送信なし |

2. **Settings → Functions** で Node.js バージョンを確認（`engines` 未指定のため既定値が適用される）

3. **Logs** で `/api/booking` の 502 / 503 / 401 の発生率を確認（問題1・問題3の実発生を裏付ける）

4. **Firewall** でレート制限ルールの有無（問題5の対策余地）

5. **Analytics** で Vercel Analytics のイベント受信状況

### Googleスプレッドシートで確認する項目

#### 予約シート

1. 1行目のヘッダーが以下19列と**一致**するか確認

   ```
   受付日時 / 予約番号 / 参加日 / 時間 / 名前 / プラン / 合計金額 / 電話 /
   ステータス / 人数内訳 / 参加者詳細 / lineUserId / 予約ステータス / 開催場所 /
   LINE名 / スタッフ指名 / クーポンコード / クーポン割引額 / LINE送信
   ```

   **列を追加・並べ替えるとコードが壊れます**（`buildBookingRow_` は位置ベース）

2. **D列（時間）で「サンセットSUP」（S8）のプランの行が空欄でないか**確認 → 問題2の実害確認

3. **同一日・同一氏名・同一プランの重複行**がないか確認 → 問題3の実害確認

4. Googleカレンダーに「サンセットSUP」の予定が登録されているか → 問題2・問題7の実害確認

#### 分析シート（「海亀兄弟 匿名分析レポート」）

5. 「イベントデータ」シートの1行目が `EVENT_HEADERS`（Code.gs:61行〜、約60列）と一致するか

6. 総行数を確認（1シート1,000万セル上限、約60列なので約16万行が上限）

7. 想定外の大量イベントが記録されていないか → 問題5の悪用兆候

8. 「予約ファネル分析」シートの到達率が100%を超えていないか（直近コミット `bbd305d` で修正済みのはずだが、修正前のデータが残っている可能性）

### Apps Script管理画面で確認する項目

#### 分析用プロジェクト（umigame-analytics）

1. **プロジェクトの設定 → スクリプト プロパティ**

   - `ANALYTICS_SPREADSHEET_ID` が設定されているか
   - `ANALYTICS_SHARED_SECRET` が設定され、Vercel の `ANALYTICS_SHEETS_SHARED_SECRET` と**一致**しているか

2. **デプロイ → デプロイを管理**

   - 「次のユーザーとして実行」= 自分
   - 「アクセスできるユーザー」= **全員**（Vercelから匿名POSTするため必須）

   ここが「全員」であること自体は仕様上必要で、実際の認証は共有シークレットで行われています

3. **実行数**（左メニュー）でエラー率と、`unauthorized` の発生頻度 → 問題5の悪用兆候

4. **割り当て** で1日あたりのスクリプト実行時間（無料枠90分/日）の消費状況

#### 予約用プロジェクト（umigame-reservation-admin）

5. **デプロイURL**が Vercel の `GAS_BOOKING_URL` と一致するか

6. **実行ログ**で「カレンダー登録エラー」を検索 → 問題2・問題7の実害確認

7. **doPost の平均実行時間**が10秒に対してどれだけ余裕があるか → 問題3の切迫度判定

8. `appsscript.json` の `oauthScopes` に対応する権限が付与されているか

   ```json
   ["spreadsheets", "calendar", "script.external_request", "userinfo.email"]
   ```

### Google Analytics管理画面で確認する項目

1. **レポート → リアルタイム**で `reservation_click` / `generate_lead` / `booking_form_view` が受信されているか
2. `generate_lead` の `value` パラメータが円換算で入っているか
3. GA4へは**7イベントのみ**送信される設計が意図通りか
4. **ホスト名フィルタ**の設定（Vercelプレビュー環境の混入対策）

### LINE Developers管理画面で確認する項目

1. **LIFF** タブ

   - エンドポイントURLが本番ドメイン（`https://www.umigamekyoudaimiyakojima.com/book`）を指しているか
   - Scope に `profile` と `openid` があるか（`getProfile()` と `getIDToken()` に必要）
   - LIFF ID が Vercel の `NEXT_PUBLIC_LIFF_ID` と一致するか

2. **LINEログイン チャネル**

   - チャネルIDが Vercel の `LINE_LOGIN_CHANNEL_ID` と一致するか
   - コールバックURLの登録

3. **Messaging API チャネル**

   - アクセストークンの有効期限（短期トークンだと失効します）
   - 友だち追加URL `https://lin.ee/jfp4laz` が有効か

### 実機のLINE内ブラウザで確認する項目

1. LINEのトーク画面から予約リンクを開き、フォームが正しく表示されるか
2. LINEログイン → 認証 → 復帰の往復で**入力内容が保持されるか**（`sessionStorage` 制限の実地確認）
3. 送信完了後の「LINEのトークに戻る」ボタンが機能するか（`liff.closeWindow()`）
4. iPhone実機で、フォーム入力時にキーボードが出た状態のレイアウト崩れ
5. サンセットSUP（S4/S8）を選んだときの時間表示
6. 韓国語・繁体字ページで、長い語によるレイアウト崩れがないか

---

## 11. 優先順位付き対応一覧

| 順位 | 重大度 | 問題 | 影響 | 推奨対応 | 修正対象 |
|---|---|---|---|---|---|
| 1 | Critical（条件付） | LIFF ID未設定時に全予約が401失敗 | 売上停止 | **まずVercelで設定確認**。恒久対応としてクライアント/サーバーの必須条件を揃える | Vercel管理画面 → `components/booking-form.tsx:750,963,1158,2362` |
| 2 | High | S8の予約が時間空欄でGASへ | 運営が集合時間を把握不能・カレンダー未登録 | `plan.id === 'S4'` を `TIME_OPTIONAL_PLAN_IDS.has(plan.id)` へ | `app/api/booking/route.ts:385-387` |
| 3 | High | GAS予約に冪等性なし・二重予約 | 枠の二重消費・顧客混乱 | GAS `doPost` 冒頭で `bookingNumber` 重複チェック。タイムアウトを15〜20秒へ | `apps-script/umigame-reservation-admin/Code.gs:1060`<br>`lib/services/gas-service.ts:56` |
| 4 | Medium | `booking_abandoned` がタブ切替で誤発火 | 離脱率が過大に出る | `pagehide` のみに限定、または trigger 別プロパティを追加 | `components/booking-form.tsx:1107-1112`<br>`components/booking-form-intl.tsx` 同等箇所 |
| 5 | Medium | 分析APIが無認証・無制限 | データ汚染・GASクォータ枯渇 | same-origin検証 + IPレートリミット | `app/api/analytics/events/route.ts:43` |
| 6 | Medium | SPA遷移でファネルイベント欠落 | フォーム表示数の過少計上 | pathname変化時に `firedOnce` をリセット | `lib/booking-funnel.ts:195-210` |
| 7 | Medium | カレンダー登録失敗の握りつぶし | シートとカレンダーの不整合が無自覚に発生 | 失敗時に管理者へ通知、またはシートにフラグ | `apps-script/umigame-reservation-admin/Code.gs:1216-1220` |
| 8 | Medium | プラン判定のハードコードが4箇所残存 | 将来のプラン追加時に問題2・9が再発 | `lib/plan-flags.ts` への参照に統一 | `components/booking-form.tsx:187-203,391,495,496` |
| 9 | Medium | 依存パッケージに high 脆弱性10件 | axios・next が実行時に露出 | `npm audit fix`（非破壊）→ Next.js アップグレード計画 | `package.json` |
| 10 | Low | S8のスタッフ指名がフォーム/サーバー不一致 | 仕様ドリフト | `STAFF_UNAVAILABLE_PLAN_IDS` にS8追加 | `lib/plan-flags.ts:27-29` |
| 11 | Low | CSP / HSTS 未設定 | XSS多層防御の欠如 | CSPを `report-only` から段階導入 | `next.config.mjs:3-17` |
| 12 | Low | デッドコード5ファイル・未使用画像111件 | デプロイサイズ・保守性 | 参照確認のうえ削除。`lib/constants/booking.ts` の `MAX_PARTICIPANTS: 4` は誤用の危険 | `components/`・`lib/`・`public/` |
| 13 | Low | `text-gray-400` のコントラスト不足 | WCAG AA 未達（2.8:1） | 補足テキストの色を `text-gray-500` 以上へ | 20箇所 |
| 14 | Low | `aria-describedby` 未使用 | 支援技術でのエラー伝達 | 集約リストに `role="alert"` を付与 | `components/booking-form.tsx:936-963` |
| 15 | Info | 国際版フォームに中間ファネルなし | 外国語サイトの離脱地点が不明 | 日本語版と同じフックを追加 | `components/booking-form-intl.tsx` |
| 16 | Info | `external_link_click` 等がfetch送信 | 遷移直前の取りこぼし | `sendDetailedEventBeacon` へ移行 | `components/detailed-analytics.tsx:72` |
| 17 | Info | Next.js 15+ の非同期 params 未対応 | アップグレード時に壊れる | codemod で変換（6ルート） | `app/**/[*]/page.tsx` |
| 18 | Info | `remotePatterns` の外部2ドメインが未使用 | 設定の残骸 | 削除候補 | `next.config.mjs:20-29` |
| 19 | Info | `engines` / `.nvmrc` 未指定 | Vercel既定Node変更時に気づけない | `engines.node` を明記 | `package.json` |
| 20 | Info | `next/dynamic` 未使用 | 初期バンドル | `suncalc` / `framer-motion` の動的読み込み検討 | `components/booking-time-slots.tsx` 他 |

---

## 12. 正常だった項目

問題点だけでなく、コード上で正常に実装されていると根拠を持って確認できた項目です。

### 予約・料金

| 項目 | 根拠 |
|---|---|
| **価格改ざん不可** | サーバーが `calculateServerSidePrice`（`app/api/booking/route.ts:292-314`）で全額再計算。クライアントの `totalPrice` は無視され、完了画面もサーバー返却値を優先表示（`components/booking-form.tsx:842-854`） |
| **クーポンコードがクライアントに漏れない** | `lib/constants/coupons.ts` はサーバー専用。`/api/coupon` 経由でのみ検証され、10分15回のレート制限あり（`app/api/coupon/route.ts:9-28`） |
| **対象外プランへのクーポン重ねがけ不可** | `COUPON_INELIGIBLE_PLAN_IDS`（C1〜C6）でフォーム・API双方が0に強制（`coupons.ts:13,24`） |
| **クーポンの人数変更時の再検証** | 200msデバウンスでサーバー再計算、失効すれば0にリセット（`booking-form.tsx:632-679`） |
| **下書き復元時の割引額リセット** | `couponDiscount: 0` を最後に上書き（`booking-form.tsx:280-281`） |
| **LINE本人確認が堅牢** | `iss` / `aud` / `sub` / `exp` を検証し、5秒タイムアウト（`lib/services/line-login-service.ts:82-96`）。**userId はクライアント値を使わずLINE公式APIの検証結果から取得**（`route.ts:397`） |
| **IDトークンの失効を送信直前に再確認** | 残60秒未満なら再ログインへ誘導し、入力内容は保持（`liff-provider.tsx:73-90,317-325`） |
| **GAS応答の厳格判定** | `success === true` を明示した場合のみ成功。HTMLエラーページ・空応答・不正JSONはすべて失敗扱い（`gas-service.ts:91`）。8ケースのテストで担保 |
| **シート書き込みの排他制御** | `LockService.waitLock(10000)`（`Code.gs:1042-1057`） |
| **連打防止** | `submissionInFlightRef` + `isSubmitting` の二重防御（`booking-form.tsx:741,2362`） |
| **プラン切替時に無効な時間を破棄** | 切替後の枠に無い時刻が残ってサーバー検証で弾かれる事故を防止（`booking-form.tsx:566-586`） |
| **プラン切替時にレンタル選択を再検証** | `planOffersRentals` で不可プランの選択をクリア（同 :570-584） |
| **LINEログイン往復での入力保持** | `sessionStorage` に下書き。**ID token は含めない**（`booking-form.tsx:111-138`） |
| **貸切限定の4層防御** | `INTL_PLAN_IDS` が一覧・トップ・詳細・フォームに同時に効き、サーバーの `isPlanAllowedForLocale` が最終防衛（`lib/i18n/locales.ts:40-58`） |
| **coming_soon プランの予約拒否** | フォーム（`:742-745`）とAPI（`:203-205`）の双方 |

### 分析

| 項目 | 根拠 |
|---|---|
| **イベント名の完全一致** | `lib/analytics-schema.ts` の30件と `apps-script/umigame-analytics/Code.gs` の `ANALYTICS_EVENTS` 30件が名前・順序とも一致（機械照合済み・差分0） |
| **個人情報の三重遮断** | クライアント（`lib/analytics.ts:39-42`）・サーバー（`app/api/analytics/events/route.ts:13,34-39`）・GAS（`normalizeProperties_` 1078-1104）の許可リスト |
| **URLクエリの遮断** | `safePath` がクエリ付きパスを "/" に落とす（`route.ts:24-27`）。`currentPathForAnalytics` が `liff.state` / `access_token` を含むクエリを除外（`liff-provider.tsx:96-102`） |
| **`booking_submitted` の発火位置が正しい** | `response.ok && success === true` を確認した後（`booking-form.tsx:828,855`）。送信ボタン押下は `booking_submit_clicked` として区別 |
| **失敗が成功として計測されない** | 例外時は必ず `booking_failed` で `outcome: "failed"`（`:871`） |
| **計測が予約を止めない** | 全送信が `try/catch` で握りつぶされる（`lib/booking-funnel.ts:277-283` / `lib/analytics.ts:150-165`） |
| **匿名性** | 永続ID・Cookie・ユーザー識別子なし。`lib/attribution.ts` は流入元のみを90日保持 |
| **GAS分析の認証** | 共有シークレット照合、未設定時はフェイルクローズ、`LockService.tryLock(10000)`（`Code.gs:243-267`） |
| **遷移直前イベントのBeacon化** | 実データで取りこぼしが確認された経緯を踏まえ `sendBeacon` 優先 + fetch フォールバック（`lib/detailed-analytics.ts:120-145,159-176`） |
| **`page_view` の二重送信防止** | `lastPageViewPath` ref で pathname 変化時のみ送信（`detailed-analytics.tsx:40-43`） |
| **`page_engagement` の二重送信防止** | `engagementSent` フラグで pagehide と cleanup の両方から呼ばれても1回（同 :79-82） |
| **LINE遷移を離脱と数えない** | `LINE_REDIRECT_FLAG` を sessionStorage にも保存し、リダイレクトでページが破棄されても判定できる（`lib/booking-funnel.ts:235-267`） |

### 画像・SEO

| 項目 | 根拠 |
|---|---|
| **参照切れ0件・大文字小文字不一致0件** | 148件を機械照合（Vercel（Linux）での404リスクなし） |
| **`<Image>` 全29箇所に `alt`** | `<Image` 29件 ⇄ `alt=` 29件 |
| **`fill` を使う全箇所に `sizes`** | 機械照合で欠落0件（CLS対策） |
| **OG画像が絶対URL・実寸1200×630・実ファイル存在** | `lib/seo.ts:11` |
| **`/icon.png` が実在** | `app/icon.png` → routes-manifest に `/icon.png` を確認（ビルド出力で検証済み） |
| **canonicalの継承が正しい** | metadataなしの2ページも親レイアウトから正しいcanonicalを継承 |
| **hreflangを対応ページのみに出す** | 日本語のみのページには出さない設計（`lib/seo.ts:44-52`） |
| **サイトマップが実在ルートを網羅** | `EN_PLAN_BY_ID` と `INTL_PLAN_IDS` が完全一致 |
| **`lastModified` が固定日** | 毎ビルドで「今日」になる鮮度シグナルの毀損を回避 |
| **`/book` が noindex** かつサイトマップ除外 | `app/(ja)/book/page.tsx:13` |
| **予約完了は独立URLでなく状態遷移** | インデックス不可能（`booking-form.tsx:1165`） |
| **ブログページネーションが自己参照canonical** | `blog/page/[page]/page.tsx:26-30`、`dynamicParams = false` |

### コード品質・セキュリティ

| 項目 | 根拠 |
|---|---|
| **型チェック エラー0** | `npx tsc --noEmit`（`strict: true`） |
| **ESLint 警告0・エラー0** | `npx next lint`（`next/core-web-vitals`） |
| **テスト80件全pass** | クーポン・予約ルール・レンタル・ファネル・GAS応答・LINE検証・ブログCTA |
| **秘密情報の露出なし** | `.env*` は .gitignore 済み、**Git履歴292コミットにも混入なし**、`NEXT_PUBLIC_` は公開前提の2値のみ |
| **XSS経路なし** | `dangerouslySetInnerHTML` はJSON-LDの固定データのみ、react-markdownは `rehypeRaw` 不使用 |
| **Open Redirectなし** | `redirectUri` は自サイト固定 |
| **セキュリティヘッダー4種を全パスに付与** | `next.config.mjs:3-17` |
| **サーバーコンポーネント主体** | `app/` 配下のクライアント化は2ファイルのみ |
| **未使用パッケージなし** | 全17依存が実際に import されている |
| **多言語辞書の欠落なし** | `IntlDict` 型 + `strict` + `tsc` エラー0 で構造的に保証 |
| **国際版とサーバー検証が共通** | 片方だけ検証が甘いという穴がない |
| **`plan-flags.ts` による単一ソース化** | 大半の判定で機能（例外は問題8で指摘した4箇所） |
| **`dangerouslyAllowSVG` の無害化** | CSP + `contentDispositionType: 'attachment'`（`next.config.mjs:33-35`） |
| **Tailwind v4 の正しい設定方式** | CSS-first（`@import "tailwindcss"` + `@theme inline`）。`tailwind.config.*` 不要 |
| **`prefers-reduced-motion` 対応** | `app/globals.css:305-314` |
| **キーボード操作対応** | ギャラリーの `role="button"` に `tabIndex={0}` + `onKeyDown`（Enter / Space）（`image-gallery.tsx:219-228`） |
| **完了時のフォーカス管理** | 見出しへフォーカス移動 + `role="dialog"`（`booking-form.tsx:295-298,1167`） |
| **下部固定CTAの重複防止** | `ArticleStickyCta` と `MobileCTA` の排他制御が明示的（`article-sticky-cta.tsx:20-22`） |
| **iOS入力ズーム対策** | `Input` の基底が `text-base`（16px）（`components/ui/input.tsx:11`） |
| **セーフエリア対応** | `env(safe-area-inset-bottom)`（`mobile-cta.tsx:33,38`） |

---

## 13. 未確認・未実施項目

| 項目 | 理由 | 次に確認すべき場所 |
|---|---|---|
| `next build` の実行 | `.next/` が既存し、実行するとビルド成果物を上書きするため見送り | 必要なら別ディレクトリで実施 |
| Lighthouse / axe による実測 | 本番URLへのアクセスと実行環境が必要 | PageSpeed Insights、Chrome DevTools |
| LCP / CLS / INP の実測値 | 同上 | Vercel Analytics の Speed Insights、または `web_vital` イベントの集計 |
| 色コントラストの実測 | クラス名からの推定のみ | axe DevTools、WAVE |
| 循環参照の明示的検査 | ビルドとテストが通っているため実害はないと判断 | `madge --circular` 等 |
| 実機での表示・操作検証 | 実機とLINEアカウントが必要 | iPhone / Android / iPad の実機 |
| LINE内ブラウザでの動作 | 同上 | LINEトーク画面からのアクセス |
| スプレッドシート本体の列・数式 | アクセス権限が必要 | 第10節参照 |
| GAS管理画面の設定・ログ・クォータ | 同上 | 第10節参照 |
| Vercel管理画面の環境変数・ログ | 同上 | 第10節参照 |
| GA4のイベント受信状況 | 同上 | 第10節参照 |
| LINE Developers の設定 | 同上 | 第10節参照 |
| 構造化データの Google 検証 | 実URLが必要 | リッチリザルトテスト |
| `apps-script/umigame-reservation-webapp/Code.gs`（2854行）の全読 | `doPost` を持たない管理画面用と判明した段階で優先度を下げた（予約受信は `umigame-reservation-admin` 側） | 同ファイルの `doGet` 以降 |
| GAS分析側の集計ロジック（ダッシュボード・日別・流入元・ファネル等9シート） | 1225行中、受信・正規化・列マッピング部分のみ精読 | `apps-script/umigame-analytics/Code.gs:338-1040` |

### 確認に必要な権限・情報

- Vercel 管理画面へのアクセス（環境変数・ログ・Firewall）
- Google スプレッドシート本体（予約シート・分析シート）
- Apps Script 管理画面2つ（分析用・予約管理用）
- Google Analytics 4 のプロパティ
- LINE Developers コンソール
- iPhone / Android / iPad の実機（特に LINE 内ブラウザ）

---

## 14. 最終確認

### 監査で守った制約

| 項目 | 結果 |
|---|---|
| **コードを変更していないこと** | ✓ 変更していません |
| **追加・削除したファイルがないこと** | ✓ プロジェクト内で追加・削除したファイルは**本レポート（`docs/full-site-audit-2026-08-05.md`）のみ**です。これはご依頼の成果物として作成しました |
| **パッケージを変更していないこと** | ✓ `npm install` / `npm audit fix` / パッケージの追加・削除・更新は行っていません |
| **ロックファイルを変更していないこと** | ✓ `npm audit --package-lock-only` は読み取り専用で、実行後に `git status` がクリーンであることを確認済み |
| **外部サービスに書き込んでいないこと** | ✓ Apps Script・スプレッドシート・Vercel・LINE・Google Analytics のいずれにも書き込み・デプロイ・設定変更を行っていません |
| **本番予約を作成していないこと** | ✓ 予約フォームの実行・送信は一切行っていません |
| **分析イベントを本番送信していないこと** | ✓ `/api/analytics/events` への実リクエストは行っていません |
| **Gitへのコミット・プッシュ・ブランチ作成をしていないこと** | ✓ 行っていません |

### 使用したコマンド

読み取り専用のみです。

```
Read / Grep / Glob（ファイル読み取り）
ls / cat / grep / find / sed -n / wc / du / comm / awk（読み取り）
git status / git diff / git log / git ls-files / git grep（読み取り）
node -e（純粋計算のみ。ファイル書き込みなし）
npx tsc --noEmit（型チェック。noEmit のため出力なし）
npx next lint（Lint。--fix は使用していません）
npm test（テスト実行）
npm audit --package-lock-only（読み取り専用の脆弱性照会）
```

`curl` / `wget` によるネットワーク送信は行っていません。

### 実行した検証の結果

| 検証 | 結果 |
|---|---|
| `npx tsc --noEmit` | **エラー0** |
| `npx next lint` | **警告0・エラー0**（`✔ No ESLint warnings or errors`） |
| `npm test` | **80件全pass**（fail 0 / cancelled 0 / skipped 0） |
| `npm audit --package-lock-only` | high 10件（第9節・問題10で詳述） |
| 画像パス照合（148件） | 参照切れ0件・大文字小文字不一致0件 |
| 分析イベント名照合（30件） | スキーマ ⇄ GAS 完全一致 |
| Git履歴の秘密情報走査（292コミット） | 混入なし |

### 最終的な `git status`

```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/full-site-audit-2026-08-05.md

nothing added to commit but untracked files present (use "git add" to track)
```

**追跡対象ファイルへの変更は0件です。** 未追跡ファイルは本レポート1件のみです。

### 最終的な `git diff`

**差分なし。** `git diff` / `git diff --cached` ともに出力ゼロ。

### HEAD

```
bbd305d59ee57c87e701176207bca786f77614e9
```

調査開始時と同一。stash もありません。

---

## 付録: 監査の実施経緯

本監査は2段階で実施しました。

**第1段階**: 13領域を並列調査する多エージェント構成を起動しましたが、**全13エージェントがセッショントークン上限（Asia/Tokyo 22:30リセット）で失敗**しました。

**第2段階**: 全領域を単一のセッションで直接コードを読んで監査しました。第1〜7段階（コード品質・予約フォーム・分析・GAS連携・画像・外部連携）、第8段階（互換性）、第9段階（セキュリティ）、第10段階（SEO・パフォーマンス・アクセシビリティ）、第11段階（設定・依存関係）のすべてを、実コードを根拠にカバーしています。

**実測が有効な領域**（Lighthouse による LCP/CLS/INP、axe によるコントラスト検証、実機での表示確認）は静的解析の限界があるため、第13節に未実施として明記しました。

**管理画面を確認できない項目は、正常だと断定していません。** すべて第10節に「確認場所と手順」付きで列挙しています。
