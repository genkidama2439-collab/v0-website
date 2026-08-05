# 予約フォーム改善 やることリスト

- 作成日: 2026-08-01（Asia/Tokyo）
- 元になった調査: 読み取り専用で実施。この計画時点でコード・設定・データへの変更はしていない
- 対象: `/book`（日本語）、`/en/book`・`/ko/book`・`/zh-tw/book`（外国語）

## 前提の数字

| 指標 | 値 |
|---|---:|
| ページ表示 | 1,328 |
| 予約入力開始 | 73 |
| 予約完了 | 14 |
| 開始→完了 | 19.2% |
| 予約失敗イベント | 2 |
| 予約売上 | 319,000円 |
| 平均予約単価 | 約22,786円 |
| `/book` へ直接着地した人の開始→完了 | 約6.7%（15→1） |
| スマートフォン比率 | 約87% |

失敗イベントが2件しかないのに完了率が低い。つまり**システムエラーではなく、送信に到達する前に諦めている**。

---

## いちばん最初にやること

**フェーズ1（計測強化）だけを先に出す。**

いま「入力開始73 → 完了14」の間がブラックボックスで、どのステップで落ちているか数値で言えない。フェーズ2以降の優先順位は、フェーズ1のデータが1〜2週間たまってから決める。先にUIを直すと、効果があったのか分からないまま終わる。

---

## 未確認事項（着手前に確定させる）

| # | 確認すること | なぜ必要か | 確認方法 |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_LIFF_ID` が本番で設定されているか | 設定済みなら**LINEログインなしでは予約が一切できない**。P0-2の深刻度がこれで決まる | Vercelダッシュボードの環境変数を見る |
| 2 | LINEログイン往復で入力内容が保持されるか | コードからは断定できない。消えているなら最優先の離脱原因 | 実機（iPhone Safari / Android Chrome）で入力途中にLINEログインし、戻ってから確認 |
| 3 | 予約枠・空き枠を管理している実体があるか | コード上は見つからなかった。フェーズ4の前提 | 予約管理シートに枠マスタがあるか確認 |

---

## P0：重大（予約が取れない・二重になる）

### P0-1. 送信タイムアウト後の再送信で予約が二重登録される

- **事実**: `generateBookingNumber()` はリクエストごとに新規発番（`app/api/booking/route.ts:461`）。冪等キーなし
- **事実**: `sendToGAS` は10秒でタイムアウト、リトライなし（`lib/services/gas-service.ts:56`）
- **事実**: GASはシート書き込みを終えてから応答する（`apps-script/umigame-reservation-admin/Code.gs:1217`）。つまり**書き込み成功済みなのにタイムアウトで失敗が返る**ケースが成立する
- **事実**: 失敗時はトーストを出すだけでフォームが残り、再送信できる（`components/booking-form.tsx:741`）

やること:
- [ ] クライアントで冪等キー（UUID）を生成しペイロードに載せる
- [ ] GAS `doPost` で同一キーの既存行を検索し、あれば書き込まず既存の予約番号を返す
- [ ] シートに冪等キー列を**末尾追加**（挿入は不可）
- [ ] キー未送信の古いリクエストも従来どおり動くようにする

影響: シート、カレンダー、管理者メール、当日の受入人数。

### P0-2. LINEログインなしで予約する手段がない（要確認1）

- **事実**: 送信ボタンの `disabled` に `!hasFreshLineSession` が入っている（`components/booking-form.tsx:1997`）
- **事実**: IDトークンは約1時間で失効し、LIFFは自動更新しない（`components/liff-provider.tsx:56`）。長く入力していると送信直前に弾かれる（`components/booking-form.tsx:614`）
- **事実**: 日本語フォームにメールアドレス入力欄が存在しない（`BookingData.customerEmail` は定義だけあって未使用）

やること:
- [ ] 環境変数の設定状況を確認する（未確認事項1）
- [ ] LINEログインを任意化し、電話番号のみで送信できる経路を用意する
- [ ] 少なくともフォーム内に「LINEを使わない予約方法」（電話）を明示する

### P0-3. 入力内容が sessionStorage にしかない

- **事実**: `BOOKING_DRAFT_KEY` は `sessionStorage`（`components/booking-form.tsx:88-106`、外国語版は `components/booking-form-intl.tsx:64-85`）
- **事実**: 外部ブラウザのLINEログインは `/book → line.me → サイトルート → /book` と戻る（`components/liff-login-relay.tsx`）
- タブを閉じる・別タブで開き直すと全消失

やること:
- [ ] `localStorage` へ変更し、保存時刻を持たせて一定時間で破棄
- [ ] 送信成功時に確実に削除する
- [ ] 個人情報をブラウザに長く残すことになるため、保持期間を決める（要判断）

### P0-4. 送信エラーが消えてしまう

- **事実**: 送信失敗は `toast.error` のみ（`components/booking-form.tsx:740`）。フォーム内に残らない

やること:
- [ ] フォーム内にエラーを永続表示する
- [ ] 再送信して安全かどうか（重複しないか）を文言で伝える ← P0-1とセット

---

## フェーズ1：計測強化（低リスク・最優先）

前提条件: なし
リスク: 低。予約処理には触れない
ロールバック: 該当コミットの revert。GASは旧版を貼り戻す

### 1-A. シートに届いていないイベントを直す

- **事実**: `trackEvent` は Vercel Analytics と GA4 だけ。`sendDetailedEvent` だけが `/api/analytics/events` 経由でスプレッドシートに入る（`lib/detailed-analytics.ts:110`）

| イベント | 現在の実装 | シート到達 |
|---|---|---|
| `booking_form_view` | `trackEvent`（`components/booking-form.tsx:260`） | **届いていない** |
| `line_login_click` | `trackEvent`（3箇所） | **届いていない** |
| `book_cta_click` | `trackEvent` 6箇所 / ブログCTAのみ `sendDetailedEvent` | **一部だけ** |
| `booking_started` / `booking_submitted` / `booking_failed` | `sendDetailedEvent` | 届いている |

analytics GAS の `EVENT_DEFINITIONS` には定義があるのに、データが一度も入っていない状態。

- [ ] `booking_form_view` を `sendDetailedEvent` へ
- [ ] `line_login_click` を `sendDetailedEvent` へ
- [ ] `book_cta_click` の残り6箇所も `sendDetailedEvent` へ
- [ ] GA4への送信が二重計上にならないことを確認（`sendDetailedEvent` は内部で `trackEvent` を呼ぶ）

### 1-B. `booking_started` の発火条件を広げる

- **事実**: `<form onInputCapture={trackBookingStarted}>`（`components/booking-form.tsx:938`）。`input` イベントで発火するため、**プラン選択・人数±・時間選択はすべてButtonなので発火しない**。実質「希望日を選んだ時点」が起点

- [ ] プラン選択・人数変更・時間選択でも発火させる
- [ ] 1セッション1回だけの制御は維持する（`bookingStartedTrackedRef`）

### 1-C. ステップ別イベントを追加する

対象ファイル: `components/booking-form.tsx`、`lib/analytics-schema.ts`、`lib/analytics.ts`、`apps-script/umigame-analytics/Code.gs`

| イベント | 発生条件 | 匿名で記録する値 | 分析目的 |
|---|---|---|---|
| `booking_plan_selected` | プラン選択ボタン押下 | plan, planName, locale | プラン別の入口 |
| `booking_date_selected` | 希望日が有効値に変化 | plan, 本日からの日数 | 直近予約か先の予約か |
| `booking_time_selected` | 開始時間選択 | plan, 時間帯（時のみ） | 人気枠と離脱枠 |
| `booking_participants_completed` | 大人1名以上が確定 | plan, headcount, 各区分数 | 人数入力の完了率 |
| `booking_price_confirmed` | 料金ブロック表示かつ合計>0 | plan, total, couponApplied | 金額を見た人数＝金額起因離脱の分母 |
| `booking_representative_completed` | 氏名と電話が両方入力済み | plan, locale | 個人情報入力の突破率 |
| `booking_participant_details_started` | 参加者カードに初回入力 | plan, headcount | 最大負担区間の入口 |
| `booking_participant_details_completed` | 全参加者の年齢・足サイズ充足 | plan, headcount | **最有力の離脱区間** |
| `booking_confirmation_viewed` | 最終確認ステップ表示 | plan, total | 送信直前の到達数 |
| `booking_submit_clicked` | 送信ボタン押下（成否問わず） | plan, total, line_logged_in | 押したのに完了しない差分＝技術要因 |
| `booking_step_back` | 前ステップへ戻る | 戻り元・戻り先ステップ名 | 迷いの発生箇所 |
| `booking_validation_error` | 送信不可のまま5秒以上滞在 | 不足項目の**種別のみ** | 何で詰まるかの特定 |
| `booking_abandoned` | 離脱時に未送信 | 到達最終ステップ, plan, 滞在秒 | ステップ別離脱率 |

**氏名・電話・メール・自由記述・年齢や体格の実値は絶対に送らない。** 不足項目は「氏名が未入力」という種別だけを送り、値は含めない。

- [ ] `ANALYTICS_EVENT_NAMES` に追加（`lib/analytics-schema.ts`）
- [ ] `ANALYTICS_PROPERTY_KEYS` と `ALLOWED_PROPERTY_KEYS` に新プロパティを追加（両方に入れないと落ちる）
- [ ] analytics GAS の `ANALYTICS_EVENTS`・`EVENT_DEFINITIONS`・`normalizeProperties_`・`EVENT_HEADERS`・`eventToRow_` に追加
- [ ] GASを本番へ貼り替えて反映

テスト:
- [ ] 各イベントが1回だけ発火する
- [ ] 個人情報が含まれない
- [ ] GASが受け取り、シートに列が出る

完了条件: シートに全ステップのイベントが記録され、どこで落ちているか数値で言える。

---

## フェーズ2：低リスク改善

前提条件: フェーズ1のデータが1〜2週間分たまっていること
リスク: 低〜中（ドラフト永続化のみ個人情報保持の判断が必要）
ロールバック: ファイル単位で revert 可能

### 2-A. タップ領域（実測値）

| 要素 | 現在 | 根拠 | 目標 |
|---|---:|---|---:|
| 時間選択ボタン | **32px** | `size="sm"` → `components/ui/button.tsx:26` | 44px以上 |
| 人数 +/- ボタン | 40px | `w-10 h-10` 明示 | 44px以上 |
| 送信ボタン | **40px** | `size="lg"` → `components/ui/button.tsx:27`（`py-4` は高さを上書きしない） | 48px以上 |

- [ ] 送信ボタンを `h-12`（48px）以上へ（`components/booking-form.tsx:1994`）
- [ ] 時間選択を `h-11`（44px）以上へ（`components/booking-time-slots.tsx:127`、`components/booking-form.tsx:1465` 付近のセット用も同様）
- [ ] 人数 +/- を44px以上へ

### 2-B. 文言の統一

- **事実**: 「今すぐ予約」は**送信＝即確定**と読めるが、実際は仮予約。`app/(ja)/terms/page.tsx:30` に「予約フォームの送信は仮予約です」と明記されており矛盾している

| 現在の文言 | 場所 | 統一案 |
|---|---|---|
| 今すぐ予約 | `components/navbar.tsx:27`、`app/(ja)/blog/[slug]/BlogPostClient.tsx:356` | 空き状況を見る |
| 今すぐ予約する | `components/image-gallery.tsx:285` | 空き状況を見る |
| 空き確認・予約する | 4箇所 | 空き状況を見る |
| 空き確認・予約 | 1箇所 | 空き状況を見る |
| 仮予約を送信する | `components/booking-form.tsx:2000` | そのまま（適切） |
| 送信完了しました！ | `components/booking-form.tsx:824` | 仮予約を受け付けました |

- [ ] 「今すぐ予約」を全廃する
- [ ] 一覧・記事のCTAは「空き状況を見る」に統一
- [ ] 完了画面の見出しを「仮予約を受け付けました」へ

### 2-C. その他の低リスク改善

- [ ] `/book` で `MobileCTA` を出さない（`app/(ja)/book/page.tsx:50`）。現状スクロール中ずっと画面下端約72pxを固定LINEバーが覆う
- [ ] 予約番号を完了画面に表示する（現在どこにも出ておらず、問い合わせ時に照合できない）
- [ ] フォーム内にFAQ折りたたみを置く（キャンセル条件・現地現金決済・器材無料・写真無料）
- [ ] P0-3のドラフト `localStorage` 化
- [ ] P0-4のエラー永続表示

テスト:
- [ ] 実機3種（iPhone Safari / Android Chrome / LINE内ブラウザ）
- [ ] LINEログイン往復
- [ ] タブを閉じて再訪

---

## フェーズ3：フォームの段階化

前提条件: フェーズ1・2完了。離脱ステップが数値で特定できていること
リスク: **高**。`components/booking-form.tsx`（2,008行）の全面改修
ロールバック: **機能フラグで旧フォームへ即時切替できる形で実装すること**

### 現状の構造

1画面スクロール型。ステップ分割されていない。

```
「3分で仮予約できます」+ STEP1/2/3 の3枠表示  ← 見た目だけ。実際は1ページ
 ① プラン選択      booking-form.tsx:1009
 ② 日時選択        :1428
 ③ 参加人数        :1544  └ 料金計算 :1669
 ④ 参加者詳細      :1804（ParticipantForm）
 ⑤ お客様情報      :1807
 ⑥ スタッフ指名    :1860
 ⑦ 同意 + 送信     :1911
```

問題: 料金を見て納得した直後に、いちばん重い参加者詳細（1人あたり最大6項目、4名なら24項目）が来る。

### 目標フロー

| STEP | 項目 | 既存との対応 |
|---|---|---|
| 1 希望内容 | プラン / 参加日 / 開始時間 / 人数 | 既存①②③ |
| 2 料金・条件 | 合計・内訳・所要時間・対象年齢・現地現金決済・キャンセル条件・**仮予約である旨** | 料金計算ブロックを昇格 |
| 3 代表者情報 | 氏名 / 電話 / LINEログイン | 既存⑤。**LINEログインをここへ前倒し** |
| 4 参加者詳細 | 年齢* / 足サイズ* / その他は任意 | 既存④を後ろへ |
| 5 最終確認・送信 | 全内容再掲 + 送信後の流れ + 同意 | 既存⑦ |

- [ ] `currentStep` 状態とステップ別バリデーション
- [ ] 進捗表示
- [ ] 戻る操作・ブラウザ戻るの設計
- [ ] リロード後のステップ復元

**送信ペイロードの形は変えない。** よってAPI・GAS・シート・カレンダー・LINE通知はすべて無改修で動く。

テスト:
- [ ] 全プラン種別 × 全ステップの遷移
- [ ] 多言語4言語
- [ ] 実機

---

## フェーズ4：予約枠・空き状況連携

前提条件: **枠管理の実体が必要（現状は存在しない）。** GASは受信した予約を記録するだけで、空き枠の概念がない
リスク: **最高**。運用フローの変更を伴う
ロールバック: 空き表示を隠すだけで従来動作へ戻せる設計にする

- [ ] 枠マスタの設計（シート側）
- [ ] GAS読み取りAPI
- [ ] 予約枠の一時確保
- [ ] 同時予約対策
- [ ] 満席時の代替便提案

---

## 壊してはいけないもの

| 対象 | 注意点 |
|---|---|
| シート列 | `COLUMNS`/`HEADERS`（`apps-script/umigame-reservation-admin/Code.gs:62`〜）は**末尾追加のみ**。挿入は既存180件超のデータを壊す |
| GASパラメータ名 | `buildGASPayload` が送る `bookingNumber` `planName` `totalPrice` `couponDiscount` `staffName` `specialRequests` `lineUserId` 等をGASが直接参照。**改名不可** |
| 備考欄マーカー | `[COMBO booking]`・「ドローンSUP」「ヤシガニ」の文字列でGASがセット判定・行分割・カレンダー分割を行う（`Code.gs:276-293`、`2404-2420`）。**書式を変えるとセットプランの処理が壊れる** |
| カレンダー | セットは2〜3イベントに分割登録。失敗しても `try/catch` で握りつぶされ予約自体は成立する |
| LINE通知 | 顧客への通知は送信時ではなく**スタッフの手動操作**（M列→U列確認→T列チェック）。フォーム改修では触らない |
| メール | `sendBookingEmail` は内部 try/catch。失敗しても予約は成立する |
| クーポン | サーバー再計算が正。フロント値は無視される |
| 流入元 | `attribution` を備考欄に `[流入元]` として記録。ブログCTAのUTMで上書きされないガードを2026-08-01に入れたばかり。**この経路を壊さないこと** |
| 外国語 | 貸切プランのみ受付。サーバー側でも制限（`app/api/booking/route.ts:206-211`） |
| 当日・前日判定 | `getTodayInJapan()` で過去日を拒否（`app/api/booking/route.ts:217`）。当日予約は受付可能 |

---

## テストケース一覧

### 正常系

プラン: S1 / S2 / S3 / S5 / S4 / S6 / S7 / C1 / C2 / C3 / C4 / C5 / C6
人数: 大人のみ / 大人+子供 / 3歳未満含む（S3・S5のみ）
オプション: クーポンあり / スタッフ指名あり / ウェットスーツ希望 / 度付きマスク希望（大人のみ）

各ケースで**フォーム表示額・API再計算額・シート記載額・管理者メール額・カレンダー額の5点が一致すること**を確認する。

### 異常系

- [ ] 通信失敗（オフライン）
- [ ] GAS 500 / HTML返却 / 空レスポンス / 不正JSON（`lib/services/gas-service.test.mjs` に既存fixtureあり）
- [ ] **GASタイムアウト（10秒超）→ 再送信で二重登録されないこと**（P0-1。現状は再現すると思われる）
- [ ] LINEトークン失効後の送信
- [ ] LINE検証401 → セッション破棄されログイン導線へ戻ること
- [ ] レートリミット（10分で6回目）
- [ ] バリデーションエラー各種
- [ ] 二重クリック（`submissionInFlightRef` で防止済み）
- [ ] 戻る操作・リロード後の入力復元
- [ ] 予約完了後の再送信防止

### スマートフォン

- [ ] iPhone Safari / Android Chrome / LINE内ブラウザ / PC
- [ ] セーフエリア
- [ ] キーボード表示時に送信ボタンが隠れないか
- [ ] 固定CTAとの重なり
- [ ] 時間選択・人数±のタップ精度
- [ ] 数値入力時のキーボード種別

### 多言語

- [ ] 日本語 / 英語 / 中国語(繁) / 韓国語
- [ ] 外国語サイトで通常プランIDを直接POSTして拒否されること
- [ ] LINEログイン後の戻り先が各言語の `/book` になること

---

## 進め方のまとめ

1. **未確認事項1〜3を確定させる**（環境変数・実機でのドラフト保持・枠管理の有無）
2. **フェーズ1を実装してデプロイ**、1〜2週間データを貯める
3. データを見て**P0とフェーズ2の優先順位を決め直す**
4. フェーズ3は離脱ステップが特定できてから。機能フラグ必須
5. フェーズ4は枠管理の実体を作ってから
