# AI Readiness Audit

作成日: 2026-08-14
対象コミット: `a41a845`（`main`）
目的: Cloudflare AI Search / MCP / llms.txt / AI Agent 対応の**前提となる情報設計**を整理する。

> このドキュメントは**調査結果と設計案**です。Cloudflare の導入・Workers・MCP Server の実装は行っていません。
> 予約処理・GAS・LINE・Googleカレンダー・URL構造・デザインには一切手を入れていません。

---

## 1. 現在のサイト構成

### 1.1 全体像

```
Next.js 14 (App Router, TypeScript)  ── Vercel（main へのマージで本番自動デプロイ）
├─ app/(ja)/      日本語サイト（トップ・プラン・ブログ・FAQ・予約・法務ページ）
├─ app/(en)/ (ko)/ (zh)/  英語・韓国語・繁体字サイト（貸切プラン限定）
├─ app/api/       booking / coupon / line-notify / analytics-events
├─ components/    UI（home/ にトップ各セクション、intl/ に多言語ページ）
├─ lib/           プラン・料金・予約ルール・SEO・計測・ブログのデータとロジック
├─ content/blog/  ブログ記事25本（Markdown・1記事1ファイル）
└─ apps-script/   Google Apps Script 3プロジェクトのソース管理
   ├─ umigame-reservation-admin/    予約受付GAS（doPost・シート書込・カレンダー・管理者メール・LINE）
   ├─ umigame-reservation-webapp/   予約管理Webアプリ（HTMLService・閲覧/編集/削除/LINE送信）
   └─ umigame-analytics/            行動計測の集計GAS
```

### 1.2 公開URL（変更禁止）

| 区分 | URL | 生成元 |
|---|---|---|
| トップ | `/` | `app/(ja)/page.tsx` |
| プラン一覧 | `/plans` | `app/(ja)/plans/page.tsx` |
| プラン詳細 | `/plans/[id]`（15件） | `generateStaticParams` = `Object.keys(PLAN_DETAILS)` |
| ブログ | `/blog`, `/blog/[slug]`（25件）, `/blog/page/[page]` | `content/blog/*.md` |
| 予約 | `/book`（noindex） | `app/(ja)/book/page.tsx` |
| 固定ページ | `/faq` `/access` `/gallery` `/staff` `/safety` `/terms` `/privacy` `/tokushoho` `/miyakojima-sea-turtle` | 各 `page.tsx` |
| 多言語 | `/en/*` `/ko/*` `/zh-tw/*`（各8ページ＋プラン詳細4件） | `components/intl/*` ＋ 辞書 |

サイトマップ掲載は82URL（本番で全件 HTTP 200 を確認済み）。`/book` は `noindex, follow`。

---

## 2. ツアー情報が存在するファイル一覧

| ファイル | 保持している情報 | 役割 | 描画されるか |
|---|---|---|---|
| `lib/plan-details.ts` | 名称・タグライン・説明・料金の**文字列**・所要時間・年齢・ハイライト・流れ・含まれるもの・持ち物・注意事項・オプション・場所・集合時刻・支払方法・**プランFAQ 62件**・レビュー | **プラン詳細ページの実質マスタ** | ✅ `/plans/[id]` |
| `lib/plan-price-display.ts` | `PLAN_PRICE_DATA`（大人・子供料金の**数値**）＋料金表示の組み立て | **料金の正本** | ✅ 詳細ページ・ブログCTA |
| `lib/data.ts` | `RAW_PLANS`（もう1組の説明・料金・年齢・場所・集合・オプション・持ち物・注意事項）＋`PLANS`（導出）＋`FAQS`（24件）＋`STAFFS`＋`BLOG_CATEGORIES` | 予約API・多言語ページ用の配列 | 一部のみ（後述） |
| `lib/plan-flags.ts` | セット判定・時間枠候補・年齢範囲・60歳制限・貸切対応表・レンタル可否・セット内容テキスト | **参加条件・分類の正本** | ✅ フォーム・API・詳細ページ |
| `lib/booking-rules.ts` | Web予約の人数上限（貸切6プランのみ10名） | **人数上限の正本** | ✅ フォーム・API |
| `lib/rental-options.ts` | レンタル単価 ¥1,000・貸切は無料・ナイトは提供なし | **レンタル料金の正本** | ✅ フォーム・API |
| `lib/booking-plans.ts` | `BOOKING_PLANS`（`PLAN_DETAILS`＋`PLAN_PRICE_DATA`＋`booking-rules` の合成） | 日本語予約フォーム専用の派生ビュー | ✅ `/book` |
| `lib/beach-info.ts` | 候補ビーチ・駐車場・トイレ・シャワー・サンセットSUP候補地・月別集合時刻 | **開催場所と季節時刻の正本** | ✅ 詳細ページ・`/access` |
| `lib/i18n/en.ts` `ko.ts` `zh-tw.ts` | 各言語のプラン説明・持ち物・注意事項・**オプション価格（数値）**・FAQ（各21件）・UI文言 | 多言語サイトの本文 | ✅ `/en` `/ko` `/zh-tw` |
| `lib/i18n/en-prices.ts` | 外国語サイト料金（現在は空＝日本語と同額） | **外国語料金の正本** | ✅ |
| `lib/i18n/locales.ts` | `INTL_PLAN_IDS`（外国語で扱うプラン）・ロケール定義・予約タグ | **多言語掲載範囲の正本** | ✅ |
| `lib/tour-assets.ts` | ツアー写真パス・カバー画像 | 画像の正本 | ✅ |
| `lib/constants/coupons.ts` | クーポンコードと割引額・対象外プラン | **クーポンの正本**（サーバー専用） | ✅ API |
| `lib/seo.ts` | サイトURL・サイト名・共通description・OG画像・metadata生成 | **SEO共通値の正本** | ✅ 全ページ |
| `components/json-ld.tsx` | LocalBusiness の `makesOffer`（**プラン名＋料金を10件ハードコード**）・`priceRange`・住所・電話 | JSON-LD | ✅ |
| `components/home/faq-section.tsx` | トップ用FAQ 4件（**ファイル内ローカル定義**） | トップFAQ | ✅ `/` |
| `app/(ja)/miyakojima-sea-turtle/page.tsx` | 独自FAQ 5件（**ファイル内ローカル定義**）＋FAQPage JSON-LD | ピラーページ | ✅ |
| `lib/blog/article-cta.ts` | 記事ごとのCTA文言・誘導先・料金表示（`getPlanPriceDisplay` から導出） | 記事内予約導線 | ✅ ブログ |
| `content/blog/*.md` | 記事本文中の料金・定員の記述 | ブログ本文 | ✅ |
| `apps-script/umigame-reservation-admin/Code.gs` | セット分割後のプラン表示名・セット単価ルール・LINE文面・メール文面・カレンダー文面 | **予約システム内部** | ❌（社内） |
| `apps-script/umigame-reservation-webapp/Code.gs` | `ADMIN_PLAN_CATALOG`（**プランID・名称・大人/子供/3歳未満料金・構成・所要分数を再定義**） | 予約管理Webアプリ | ❌（社内） |

---

## 3. ハードコード一覧

「同じ事実が、そのファイル内に直接書かれている」箇所。

| # | 情報 | 場所 | 現在の値 | 備考 |
|---|---|---|---|---|
| H1 | 大人・子供料金（数値） | `lib/plan-price-display.ts` `PLAN_PRICE_DATA` | 15プラン分 | **正本。ここが起点** |
| H2 | 大人・子供料金（数値・**上書きされて未使用**） | `lib/data.ts` `RAW_PLANS[].price/childPrice` | 15プラン分 | `PLANS` 生成時に H1 で上書きされるため無効 |
| H3 | 料金（**文字列**） | `lib/plan-details.ts` `price` `childPrice` | `"¥6,500"` `"¥6,000（子供）"` 等 | H1 と手動同期 |
| H4 | 料金（JSON-LD） | `components/json-ld.tsx` `makesOffer` | 10プラン分の `name` と `price` | H1 と手動同期・**5プラン欠落** |
| H5 | 料金レンジ | `components/json-ld.tsx` `priceRange` | `"¥4,000〜¥24,500"` | 手動 |
| H6 | 料金（管理GAS） | `apps-script/umigame-reservation-webapp/Code.gs` `ADMIN_PLAN_CATALOG` | 14プラン分の大人/子供/3歳未満 | **別リポジトリ相当・手動同期** |
| H7 | レンタル単価 | `lib/rental-options.ts` `RENTAL_UNIT_PRICE_YEN` | `1000` | **正本** |
| H8 | レンタル単価（重複） | `lib/data.ts` `RAW_PLANS[].options[].price` / `lib/plan-details.ts` `options[].price` / `lib/i18n/*.ts` `plans[].options[].price` | `1000` / `"¥1,000"` / `1000` | 4系統 |
| H9 | 開始時刻 | `lib/data.ts` `RAW_PLANS[].timeTags` | 各プランの候補時刻 | **サーバー検証の正本** |
| H10 | 開始時刻（フォーム提示） | `lib/plan-flags.ts` `DAY_SUP_TIMES` `COMBO_TURTLE_TIMES` `COMBO_NIGHT_TIMES` | 10件 / 4件 / 2件 | H9 と一致することを確認済み |
| H11 | 対象年齢（**表示文字列**） | `lib/data.ts` `ageRange` ／ `lib/plan-details.ts` `age` | `"5〜65歳"` `"0歳〜75歳"` 等 | **コードの判定値と別物**（後述 M1） |
| H12 | 対象年齢（**判定値**） | `lib/plan-flags.ts` `getParticipantAgeRange` | 大人13〜100・子供5〜12（ナイトは4〜12）・3歳未満0〜3 | **正本** |
| H13 | 人数上限 | `lib/booking-rules.ts` `PLAN_MAX_PARTICIPANTS` | 貸切6プランのみ10 | **正本** |
| H14 | 60歳以上の制限 | `lib/plan-flags.ts` `SENIOR_RESTRICTED_PLAN_IDS` | S1/S3/S6/S8/C1/C3/C5 | **正本。詳細ページの表示もここから導出** |
| H15 | 60歳以上の制限（**本文テキスト**） | `lib/data.ts` `RAW_PLANS[].precautions` | 8プラン分 | H14 と矛盾（後述 M2）・**どこにも描画されない** |
| H16 | 所要時間 | `lib/data.ts` `durationHours`（数値） ／ `lib/plan-details.ts` `duration`（文字列） | `2` ／ `"約2時間"` | 2系統・セットは表現が大きく異なる |
| H17 | 集合場所 | `lib/beach-info.ts`（**正本**） ／ `lib/data.ts` `location` ／ `lib/plan-details.ts` `location` | ビーチ名の並び | 3系統・区切り文字が不統一 |
| H18 | 集合時刻 | `lib/data.ts` `meetingTime.regular` ／ `lib/plan-details.ts` `meetingTime` ／ `lib/beach-info.ts` `SUNSET_SUP_MEETING_TIMES` | 文字列 / 文字列 / 月別時刻 | 3系統 |
| H19 | キャンセル規定 | `app/(ja)/terms/page.tsx` ／ `lib/data.ts` `FAQS` ／ GAS の LINE文面（`getConfirmMessage`） ／ 各言語辞書 | 「前日まで無料・当日100%」 | **4系統以上**（GAS含む） |
| H20 | 支払方法 | `lib/data.ts` `paymentMethod` ／ `lib/plan-details.ts` `paymentMethod` | 「現地現金決済」 | 2系統 |
| H21 | 電話番号・住所・営業時間 | `components/json-ld.tsx`（LocalBusiness / Organization） ／ `components/footer.tsx` ／ `app/(ja)/tokushoho/page.tsx` | `+81-80-5344-2439` 等 | 3系統 |
| H22 | サイト名・URL・説明 | `lib/seo.ts`（**正本**） ／ `components/json-ld.tsx`（`SITE_URL` `SITE_NAME` を再定義） | 同値 | 2系統 |
| H23 | LINE URL | `lib/blog/article-cta.ts` `LINE_CONSULT_URL` ／ 各コンポーネントに直書き | `https://lin.ee/jfp4laz` | 多数箇所に直書き |
| H24 | セット分割後のプラン名 | `apps-script/umigame-reservation-admin/Code.gs` ／ `apps-script/umigame-reservation-webapp/Code.gs` | `昼夜セット海亀` 等9種 | **予約システム内部。変更禁止** |
| H25 | プランFAQ | `lib/plan-details.ts` `faqs` | 62件 | JSON-LD未出力 |
| H26 | 共通FAQ | `lib/data.ts` `FAQS` | 24件 | `/faq` と `/miyakojima-sea-turtle` の JSON-LD |
| H27 | トップFAQ | `components/home/faq-section.tsx` | 4件 | ファイル内ローカル |
| H28 | ピラーページFAQ | `app/(ja)/miyakojima-sea-turtle/page.tsx` | 5件 | ファイル内ローカル・**独自のFAQPage JSON-LD** |
| H29 | 多言語FAQ | `lib/i18n/{en,ko,zh-tw}.ts` | 各21件 | 日本語FAQと独立 |

---

## 4. 重複情報一覧

### 4.1 料金

**情報:** 各プランの大人料金・子供料金

**使用箇所:**

| ファイル | 形式 | 現在の値（S1の例） |
|---|---|---|
| `lib/plan-price-display.ts:16` | 数値 | `{ price: 6500, childPrice: 6000 }` |
| `lib/data.ts:151` | 数値（**上書きされ無効**） | `price: 6500, childPrice: 6000` |
| `lib/plan-details.ts:63` | 文字列 | `price: "¥6,500"` / `childPrice: "¥6,000（子供）"` |
| `components/json-ld.tsx:110` | 文字列 | `price: "6500"` |
| `apps-script/umigame-reservation-webapp/Code.gs:90` | 数値 | `adultPrice: 6500, childPrice: 6000, under3Price: 6000` |

**判定:** **同一**（全15プラン・4系統の値が一致することを検証済み）。ただし**同期は完全に手作業**。

**補足:** `lib/data.ts` の `PLANS` は生成時に `PLAN_PRICE_DATA` で `price`/`childPrice` を、`PLAN_DETAILS` で `name` を上書きしている（`lib/data.ts:1169-1177`）。つまり `RAW_PLANS` に書かれた料金と名称は**読まれない死んだ値**。

### 4.2 プラン名

**使用箇所:**

| ファイル | S3の値 | S4の値 | S8の値 |
|---|---|---|---|
| `lib/plan-details.ts`（**正本**） | `本格ナイトツアー` | `【貸切】サンセットSUP` | `サンセットSUP` |
| `lib/data.ts` `RAW_PLANS`（**上書きされ無効**） | `【アマゾン帰りの男と行く】本格ナイトツアー` | `🌅【貸切】サンセットSUP` | `🌅 サンセットSUP` |
| `apps-script/.../webapp Code.gs` `ADMIN_PLAN_CATALOG` | `本格ナイトツアー` | `【貸切】サンセットSUP` | `サンセットSUP` |

**判定:** 実際に使われる値は**同一**。ただし `RAW_PLANS` に旧名称が残っており、`PLANS` の上書き（`lib/data.ts:1173`）を外すと**GASのシート名照合が壊れる**。

> 【前回監査の訂正】8/14の2回目監査で「管理GASカタログとサイトのS3/S4/S8の名称が不一致」と報告しましたが、これは誤りでした。`RAW_PLANS` の値を見ていたためで、実際にGASへ送られる `PLANS[].name` は3プランとも完全に一致しています。旧行のプラン自動判定に問題はありません。

### 4.3 レンタルオプション

| ファイル | 名称 | 価格 |
|---|---|---|
| `lib/rental-options.ts`（**正本**） | （名称なし・`wetsuitRental` / `prescriptionMaskRental`） | `1000`（貸切は`0`） |
| `lib/data.ts` `RAW_PLANS[].options` | ウェットスーツ / **度付きメガネ** | `1000` |
| `lib/plan-details.ts` `options` | ウェットスーツ / **度付きマスク** | `"¥1,000"` |
| `lib/i18n/{en,ko,zh-tw}.ts` `plans[].options` | 各言語名 | `1000`（実際は貸切のみ掲載なので**0が正**） |

**判定:** **表記ゆれ＋矛盾**。詳細は M3・M4 を参照。

### 4.4 FAQ

| 定義元 | 件数 | 描画先 | FAQPage JSON-LD |
|---|---|---|---|
| `lib/data.ts` `FAQS` | 24 | `/faq` | ✅ `/faq` と `/miyakojima-sea-turtle` の両方 |
| `components/home/faq-section.tsx` | 4 | `/` | ❌ |
| `app/(ja)/miyakojima-sea-turtle/page.tsx` | 5 | `/miyakojima-sea-turtle` | ❌（同ページのJSON-LDは `lib/data.ts` の24件を使用） |
| `lib/plan-details.ts` `faqs` | 62 | `/plans/[id]` | ❌ |
| `lib/i18n/{en,ko,zh-tw}.ts` | 各21 | `/en/faq` 他 | ✅ |

**判定:** **重複あり**。同一質問「持ち物は何が必要ですか？」がトップとピラーページに独立して存在。近い質問の分散は下表のとおり。

| テーマ | 出現箇所数 | 例 |
|---|---|---|
| 何歳から | 6 | `何歳から参加できますか？` / `子どもは何歳から参加できますか？` / `子供は何歳から参加できますか？` |
| 雨・天候 | 5 | `雨の日の代替プランは？` / `雨の日でも開催しますか？` / `雨でも開催しますか？` / `雨の日はどうなりますか？` |
| 集合場所 | 6 | `集合場所はどこですか？` / `集合場所はいつ分かりますか？` / `集合時間は何時ですか？` |
| 持ち物 | 2 | 完全に同一文言が2ファイル |

**重大な点:** `/miyakojima-sea-turtle` はページ本文に独自FAQ 5件を表示しながら、JSON-LD には `lib/data.ts` の24件を出力している。**表示とJSON-LDの内容が一致していない。**

### 4.5 その他の重複（検出結果）

機械的な突き合わせで検出した26件のうち、主要なもの。

| プラン | 情報 | A | B | 判定 |
|---|---|---|---|---|
| S1 | 集合時刻 | `data.ts:"開始時刻の15分前に集合"` | `plan-details:"開始時刻の15分前"` | 表記ゆれ |
| S3/S5 | 対象年齢 | `data.ts:"0歳〜75歳"` | `plan-details:"0〜75歳"` | 表記ゆれ |
| S4/S8 | 集合時刻 | `data.ts:"開始15分前に集合（開始時間・集合場所は前日にLINEでご案内）"` | `plan-details:"日没の約90分前（8月は17:45頃・12月は16:30頃…）"` | **内容が別物** |
| S4/S8 | 開催場所 | `data.ts:"…・…・…のいずれか（前日にLINEで確定）"` | `plan-details:"…／…／… のいずれか"` | 表記ゆれ（区切り文字） |
| C1〜C6 | 集合時刻 | `data.ts:"海亀ツアー開始の15分前…"` | `plan-details:"ウミガメツアー開始の15分前…"` | 表記ゆれ（**海亀 / ウミガメ**） |
| C1/C2 | 所要時間 | `data.ts:durationHours=3.5` | `plan-details:"昼2時間＋夜1.5時間"` | 表現差（数値 vs 説明文） |
| C5/C6 | 所要時間 | `data.ts:durationHours=4.5` | `plan-details:"朝〜夜の1日（…1.5h＋1.5h＋1.5h）"` | 表現差（合計4.5h vs 内訳計4.5h） |
| S1/S4/S8/C1〜C4 | 注意事項 | `data.ts` 4〜7件 | `plan-details` 4〜8件 | **内容が別物**（C4は完全に別の文面） |

---

## 5. 矛盾・表記ゆれ一覧

重大度順。**いずれも本監査では修正していません**（参加条件・料金の推測変更を禁じられているため）。

### M1 — 対象年齢の表示とシステム判定が一致しない【要確認】

| | 値 |
|---|---|
| 表示（`ageRange` / `age`） | 全シュノーケル・SUPプランで `"5〜65歳"`、ナイトで `"0歳〜75歳"` |
| システム判定（`getParticipantAgeRange`） | 大人 13〜100歳・子供 5〜12歳（ナイトは4〜12歳）・3歳未満 0〜3歳 |
| 60歳制限（`SENIOR_RESTRICTED_PLAN_IDS`） | S1/S3/S6/S8/C1/C3/C5 はグループ版で60歳以上不可 |

**問題:**
- 表示が「〜65歳」なのに、フォームは100歳まで入力を受け付ける
- グループ版は60歳以上を弾くので、実効上限は「〜59歳」であり「65歳」ではない
- 貸切版は60歳以上を受け付けるので、こちらも「65歳」ではない
- ナイトの `"0歳〜"` は3歳未満区分があるので整合するが、子供の下限は4歳で、`"0歳〜"` からは読み取れない

**影響:** お客様が自分の年齢で参加可否を判断できない。AIが `"5〜65歳"` を読み取ると誤答する。

**確認したいこと:** 各プランの**実際の**参加可能年齢の上限・下限。

### M2 — 貸切セット（C2/C4/C6）の注意事項が「予約できません」になっている【要確認】

`lib/data.ts` の `precautions`:

| プラン | コード上の60歳制限 | 本文 |
|---|---|---|
| S1（グループ） | 制限あり | 「60歳以上の方がご参加のグループは、安全面を考慮し**【貸切】ウミガメシュノーケルツアーをご予約ください**」✅ |
| S2（貸切） | 制限なし | 「60歳以上の方がご参加のグループは、安全面を考慮し**本プランをご予約ください**」✅ |
| C1/C3/C5（グループ） | 制限あり | 「…**本プランをご予約いただけません**。LINEよりご相談ください」✅ |
| **C2/C4/C6（貸切）** | **制限なし** | 「…**本プランをご予約いただけません**。LINEよりご相談ください」❌ |

**問題:** C1で「貸切版へ」と案内され、C2へ行くと「このプランは予約できません」と書かれている。C1→C2、C3→C4、C5→C6 のいずれも行き止まりになる。S1→S2 は正しい文面なので、**C系だけグループ版の文面がコピーされた可能性**が高い。

**現時点の実害:** `lib/data.ts` の `precautions` は**どのページにも描画されていない**ため、お客様には見えていない。ただし後で使い始めると誤った案内が出る。

**確認したいこと:** 貸切セット（C2/C4/C6）は60歳以上を受け付けるのか、受け付けないのか。コード（受け付ける）と本文（受け付けない）のどちらが正しいか。

### M3 — 貸切セット C4 のレンタル料金表示が実際の請求と食い違う【要確認】

| | 値 |
|---|---|
| `lib/data.ts` `RAW_PLANS.C4.options` | ウェットスーツ `1000`・度付きメガネ `1000`（`freeForPrivate` **なし**） |
| `lib/rental-options.ts` の実際の請求 | C4は貸切なので **0円** |

S1/S2 には `freeForPrivate: true` が付いているが、C4 には付いていない。**請求額は `getRentalUnitPrice` を使うため正しく0円**だが、`RAW_PLANS.options` を表示に使うと1,000円と出る。現在この配列は描画されていないため実害なし。

### M4 — レンタルオプションの名称が2種類ある【表記ゆれ】

- `lib/data.ts`: **度付きメガネ**
- `lib/plan-details.ts`: **度付きマスク**（実際に詳細ページへ表示される方）
- コード上の識別子: `prescriptionMaskRental`

### M5 — 「海亀」と「ウミガメ」の混在【表記ゆれ】

同じツアーを指して両方が使われる。特にセットプランの集合時刻文で `data.ts`＝「海亀ツアー」/ `plan-details`＝「ウミガメツアー」。GASのシート名は「昼夜セット**海亀**」で固定（変更禁止）。

### M6 — 60歳制限が本文に書かれていないプランがある【要確認】

S3・S6・S8 はコード上60歳制限があるが、`lib/data.ts` にも `lib/plan-details.ts` にも本文がない。プラン詳細ページはコードから自動表示するため画面には出るが、**AIやテキスト抽出には制限が伝わらない**。

### M7 — `/miyakojima-sea-turtle` の表示FAQとJSON-LDが別内容【SEO】

ページ本文は独自の5件、JSON-LD は `lib/data.ts` の24件。Googleのガイドライン上、FAQPage 構造化データは**ページに表示されている内容と一致している必要がある**。

### M8 — LocalBusiness の `makesOffer` に5プラン欠落【SEO】

掲載: S1・S3・S6・S7・C1・C2・C3・C4・C5・C6（10件）
欠落: **S2・S4・S5・S8・slide-boat**

`name` も一部が実際のプラン名と異なる（例: `"ウミガメシュノーケルツアー"` に対し実名は `"ウミガメと泳ぐシュノーケルツアー"`）。

### M9 — グループプランに人数上限がない【要確認・仕様確認】

`PLAN_MAX_PARTICIPANTS` は貸切6プラン（S2/S4/S7/C2/C4/C6）だけ10名。S1/S3/S6/S8/C1/C3/C5/slide-boat は**上限なし**でフォーム・APIとも一貫して動作する。コメントからは意図的な設計に見えるが、グループプランで大人数のWeb予約が自動で通ってよいかは運用判断。

---

## 6. 現在の予約データフロー

### 6.1 予約が成立するまで

```
[お客様]
  │  /book?plan=S1 （または /en/book 等）
  ▼
[予約フォーム]  components/booking-form.tsx（日本語） / booking-form-intl.tsx（多言語）
  │  参照: BOOKING_PLANS（= PLAN_DETAILS + PLAN_PRICE_DATA + booking-rules）
  │        plan-flags（時間枠・年齢・セット判定）/ rental-options / PLANS(多言語)
  │  LINEログイン必須（LIFF）→ ID token を取得
  │  同じ入力内容には同じ送信ID（Idempotency-Key）を付与
  ▼
[POST /api/booking]  app/api/booking/route.ts
  │  ① IPレートリミット（10分5件・同一送信IDは消費しない）
  │  ② 入力検証（PLANS / plan-flags / booking-rules / validation）
  │  ③ LINE ID token をLINE公式APIで検証 → userId 確定
  │  ④ 予約番号 = SHA256(lineUserId:送信ID) → 同じ入力なら常に同じ番号
  │  ⑤ 料金をサーバー側で再計算（クライアント値は不使用）
  │  ⑥ GASペイロード組み立て（planId・planName・specialRequests 等）
  ▼
[予約受付GAS]  apps-script/umigame-reservation-admin/Code.gs  doPost
  │  ① planId でプラン振り分け（単品 / 昼夜セット / 海空セット / まるごと1日セット）
  │  ② スクリプトロック内で予約番号を照合 → 既存なら duplicate:true で終了
  │  ③ 予約一覧シートへ 1〜3行を書き込み（45列）
  │  ④ Googleカレンダーへ 1〜3件の予定を作成
  │  ⑤ 管理者へ仮予約メール（GmailApp）
  ▼
[Google スプレッドシート「予約一覧」]  45列
  │
  ├─▶ [Googleカレンダー]  予定の説明文に「予約番号: XXX」を含める（照合キー）
  │
  └─▶ [予約管理Webアプリ]  apps-script/umigame-reservation-webapp/
         閲覧・検索・プラン変更・日時変更・削除・LINE送信
         │
         ▼
      [POST /api/line/notify]  Bearer NOTIFY_SECRET 認証
         ▼
      [LINE Messaging API]  お客様へ確定・満席・開催場所の通知
```

### 6.2 計測の流れ（予約とは独立）

```
[同意した閲覧者] → components/consent-aware-analytics.tsx（同意前は何も読み込まない）
  → lib/detailed-analytics.ts → POST /api/analytics/events → 分析GAS → 分析スプレッドシート
  同時に GA4 / Vercel Analytics へも送信
予約時は visitor_id / visit_id / 予約ファネルID を予約データへ同梱し、予約台帳と結合できるようにしている。
```

### 6.3 「サイト表示用データ」と「予約システム内部データ」の分離点

分離は **`app/api/booking/route.ts` の `buildGASPayload`** で起きる。

| 種別 | 値 | 使う側 | 変更したときの影響 |
|---|---|---|---|
| **内部識別子（変更禁止）** | `planId`（`S1`〜`S8`・`C1`〜`C6`・`slide-boat`） | 予約API・GAS振り分け・シート45列目・管理Webアプリ | 過去予約のプラン判定が壊れる |
| **内部識別子（変更禁止）** | 予約番号 `W` + SHA256先頭16桁 | GASの重複判定・カレンダー照合・LINE履歴 | 二重予約・二重メールが起きる |
| **半内部（変更に強い注意）** | `planName`（＝ `PLANS[].name` ＝ `PLAN_DETAILS[].name`） | シートF列・GASの名前判定（`isSplitComboPlanName` 等）・管理Webアプリの `ADMIN_PLAN_CATALOG` 照合 | 既存行のプラン判定・LINE文面の切替が壊れる |
| **GAS専用の内部名（変更禁止）** | `昼夜セット海亀` `昼夜セットヤシガニ` `海空セット（ウミガメシュノーケル）` `海空セット（ドローンSUP）` `まるごと1日セット海亀/ドローンSUP/ヤシガニ` `貸切まるごと1日セット…` | シートF列に実際に書かれる値 | 既存予約の行が識別できなくなる |
| **表示用（自由に変更可）** | タグライン・説明文・ハイライト・流れ・レビュー・画像 | サイトのみ | なし |
| **表示用だが同期が必要** | 料金・年齢・所要時間・集合場所・注意事項 | サイト＋（一部）GAS内の金額分割 | 表示と請求の食い違い |

> **重要:** `PLANS[].name` は `lib/plan-details.ts` の `name` から生成されている（`lib/data.ts:1173`）。
> つまり**プラン詳細ページの表示名を変えると、GASのシートに書き込まれる名前も変わる**。
> 表示名の変更は「表示だけの変更」ではない。

---

## 7. 現在の Single Source of Truth

### 7.1 すでに単一ソースになっているもの ✅

| 情報 | 正本 | 状態 |
|---|---|---|
| 料金（数値） | `lib/plan-price-display.ts` `PLAN_PRICE_DATA` | `lib/data.ts` が生成時に参照。ブログCTAも `getPlanPriceDisplay` 経由。**良い形** |
| プラン名 | `lib/plan-details.ts` `name` | `lib/data.ts` が生成時に参照 |
| セット判定・時間枠・年齢判定・60歳制限・貸切対応 | `lib/plan-flags.ts` | フォーム・API・詳細ページが共通参照。**コメントに単一ソースの意図が明記されている** |
| 人数上限 | `lib/booking-rules.ts` | フォーム・API共通 |
| レンタル料金 | `lib/rental-options.ts` | フォーム・API共通。貸切無料を `PRIVATE_PLAN_IDS` から導出しており設定漏れが起きにくい |
| クーポン | `lib/constants/coupons.ts` | サーバー専用・クライアントバンドルに含まれないことを確認済み |
| 外国語の掲載範囲 | `lib/i18n/locales.ts` `INTL_PLAN_IDS` | 一覧・トップ・詳細・フォーム・APIすべてに効く |
| 外国語料金 | `lib/i18n/en-prices.ts` `getEnPrice` | 表示と請求が同じ関数を通る |
| 開催候補ビーチ・サンセット時刻 | `lib/beach-info.ts` | 詳細ページと `/access` が共通参照 |
| サイトURL・サイト名・共通説明 | `lib/seo.ts` | 全ページのmetadata |
| 画像パス | `lib/tour-assets.ts` | |
| 予約列定義（45列） | 両GASで同一定義（`COLUMNS` / `ADMIN_COLUMNS`） | 一致を確認済み |

### 7.2 単一ソースが**存在しない**もの ❌

| 情報 | 現状 |
|---|---|
| **ツアーの構造化された全体像** | **存在しない。** 1プランの情報が `plan-details` `plan-price-display` `data.ts` `plan-flags` `booking-rules` `rental-options` `beach-info` `i18n/*` の8ファイルに分散している |
| **対象年齢（機械可読）** | 表示は文字列、判定はコード。両者が一致していない（M1） |
| **所要時間（機械可読）** | 数値（`durationHours`）と文字列（`duration`）が別々に存在。セットは内容が異なる |
| **集合場所・集合時刻** | 3系統に別文言 |
| **注意事項・参加条件** | `data.ts` と `plan-details` に別内容。描画されるのは後者だけ |
| **FAQ** | 5系統に分散。JSON-LD と表示内容が一致していないページがある |
| **キャンセル規定** | サイト4箇所＋GASのLINE文面に別々に記述 |
| **JSON-LD の料金・プラン名** | `components/json-ld.tsx` に手書き。5プラン欠落 |
| **事業者情報（電話・住所・営業時間）** | JSON-LD・フッター・特商法ページに別々に記述 |
| **AI向けの要約** | 存在しない（llms.txt もなし） |

---

## 8. 推奨データ構造

### 8.1 設計方針

1. **既存の正本を壊さない。** `PLAN_PRICE_DATA` `PLAN_DETAILS` `plan-flags` `booking-rules` `rental-options` `beach-info` は現状のまま**据え置き**、そこから**導出する読み取り専用の統合ビュー**を作る。
2. **新しい事実を手入力しない。** 統合ビューに書くのは「既存のどれかから導出できる値」だけ。導出できないものは `null` として `要確認` に落とす（勝手に補完しない）。
3. **識別子を3層に分ける。** 表示名を変えても予約が壊れない構造にする（現状は連動してしまっている）。
4. **段階的に移行する。** 統合ビューを作る → 生成物（JSON-LD・llms.txt）を統合ビューから作る → 最後に個別ファイルの重複を消す。

### 8.2 識別子の分離

| 層 | 名前 | 現在の値 | 変更可否 |
|---|---|---|---|
| システム内部 | `bookingPlanId` | `S1` … `C6` `slide-boat` | **不可**（GAS・シート45列目・管理Webアプリ） |
| URL | `slug` | `S1` …（現状 `bookingPlanId` と同値） | 不可（既存URL・被リンク） |
| シート照合 | `sheetPlanName` | `ウミガメと泳ぐシュノーケルツアー` 等 | **要注意**（GASの名前判定） |
| 表示 | `displayName` | 同上 | 現状は `sheetPlanName` と同一。**将来は分離したい** |

> 現状 `displayName` と `sheetPlanName` が同じ値なので、表示名を変えるとシートの値も変わる。
> 将来的には `sheetPlanName` を固定値として別管理し、`displayName` だけ自由に変えられるようにするのが望ましい（第4段階・要相談）。

### 8.3 提案する型

```ts
// lib/tour-master.ts（読み取り専用の導出ビュー。新しい事実は書かない）
export interface TourMaster {
  // ---- 識別子 ----
  id: string                 // = bookingPlanId。GAS・シートの正本
  slug: string               // URLセグメント（/plans/{slug}）
  bookingPlanId: string      // 予約APIへ送る planId
  sheetPlanName: string      // 予約一覧シートF列に入る名前（GAS名前判定の対象）

  // ---- 分類 ----
  status: "active" | "coming_soon"
  category: "snorkel" | "night" | "sup" | "drone_sup" | "set" | "other"
  isPrivate: boolean         // 貸切かどうか（PRIVATE_PLAN_IDS から導出）
  isSet: boolean             // セットプランか（COMBO_PLAN_IDS から導出）
  components: string[]       // セットを構成する行のプラン名（GAS内部名）

  // ---- 表示 ----
  displayName: string
  tagline: string
  summary: string            // heroDescription
  highlights: string[]

  // ---- 料金（PLAN_PRICE_DATA / rental-options / coupons から導出）----
  pricing: {
    currency: "JPY"
    adult: number
    child: number
    under3: number           // FREE_UNDER3_PLAN_IDS なら 0
    rentalUnitPrice: number  // 貸切は 0
    couponEligible: boolean
  }

  // ---- 参加条件（plan-flags / booking-rules から導出）----
  participants: {
    adultAgeMin: number      // 13
    adultAgeMax: number      // 100
    childAgeMin: number      // 4 or 5
    childAgeMax: number      // 12
    under3Allowed: boolean
    maxPerWebBooking: number | null   // null = Web予約の上限なし
    seniorRestricted: boolean         // 60歳以上はグループ版不可
    seniorAlternativeId: string | null
    displayAgeRange: string           // 既存の表示文字列（"5〜65歳" 等）
    displayAgeRangeMatchesRules: boolean  // ← M1 が解消されるまで false
  }

  // ---- 日程（data.ts timeTags / plan-flags から導出）----
  schedule: {
    startTimes: string[]           // サーバーが受理する開始時刻
    nightStartTimes: string[]      // セットの夜の部
    startTimeFixed: boolean        // false = 前日にLINEで確定（S4/S8）
    durationHours: number
    durationLabel: string
  }

  // ---- 場所（beach-info / plan-details から導出）----
  location: {
    label: string
    candidates: string[]           // beach-info のビーチ名
    confirmedBy: "before_tour_line" | "on_page"
  }

  // ---- 本文（plan-details から導出）----
  content: {
    included: string[]
    whatToBring: string[]
    precautions: string[]
    faqs: Array<{ question: string; answer: string }>
  }

  // ---- SEO / AI ----
  seo: {
    url: string
    image: string
    metaTitle: string
    metaDescription: string
  }

  // ---- 公開可否 ----
  visibility: {
    ja: boolean
    intlLocales: string[]          // INTL_PLAN_IDS から導出
    exposeToAi: boolean            // 公開情報のみ true
  }
}
```

### 8.4 情報の性質による分離（STEP 5への回答）

| 区分 | 内容 | 置き場所（提案） | AI公開 |
|---|---|---|---|
| **比較的固定** | プラン名・slug・基本料金・年齢条件・所要時間・装備・基本説明・ハイライト | `lib/plan-details.ts` + `lib/plan-price-display.ts`（現状維持）→ `tour-master` で統合 | ✅ 可 |
| **運用で変化** | 開催時間・季節ルール・候補ビーチ・サンセット時刻 | `lib/beach-info.ts` + `lib/plan-flags.ts`（現状維持） | ✅ 可（「候補・当日確定」と明記して） |
| **運用で変化・コード外** | 空き状況・当日開催可否・海況・台風対応 | **コードに持たない。** 将来 MCP のツール（GASまたはAPI）で動的に返す | △ 動的のみ |
| **予約システム内部** | `planId`・予約番号・シート列定義・GAS内部プラン名・LINE User ID・`NOTIFY_SECRET`・スプレッドシートID・カレンダーID | `apps-script/*`（現状維持） | ❌ **不可** |
| **社内運用** | スタッフ指名料・売上按分ルール・管理者メール文面 | 現状維持 | ❌ 不可 |

---

## 9. 移行対象ファイル

段階ごとの対象。**第1段階のみ本PRで実施**。

### 第1段階（リスク極小・本PRで実施）
| ファイル | 作業 |
|---|---|
| `docs/ai-readiness-audit.md` | 新規（本書） |
| `lib/tour-master.ts` | 新規。既存モジュールから導出する読み取り専用ビュー。**既存コードは一切変更しない** |
| `lib/tour-master.test.mjs` | 新規。重複情報のドリフト検知テスト |

### 第2段階（低リスク・別PR推奨）
| ファイル | 作業 |
|---|---|
| `components/json-ld.tsx` | `makesOffer` と `priceRange` を `tour-master` から生成（手書き10件を廃止・欠落5プランを解消） |
| `app/(ja)/miyakojima-sea-turtle/page.tsx` | 表示FAQとJSON-LDを一致させる（M7） |
| `components/home/faq-section.tsx` | ローカルFAQを共通FAQへ寄せる |
| `lib/faq.ts`（新規） | FAQの単一ソース化（共通・プラン別・多言語をタグで分類） |

### 第3段階（中リスク・要相談）
| ファイル | 作業 |
|---|---|
| `lib/data.ts` | `RAW_PLANS` から**描画されていない重複フィールド**を削除（`precautions` `whatToBring` `options` `location` `meetingTime` `paymentMethod` `description` `ageRange` 等）。※ `PLANS` の生成ロジックと予約APIが参照するフィールドは残す |
| `app/llms.txt/route.ts`（新規） | `tour-master` から生成 |
| `app/api/tours/route.ts`（新規） | `tour-master` のJSON配信（MCP・AI Search用） |

### 第4段階（要相談・単独PR）
| 対象 | 作業 |
|---|---|
| `sheetPlanName` の分離 | 表示名を変えてもシート名が変わらないようにする。**GASの名前判定に触れるため、GAS側の対応とセットで実施** |
| M1〜M6 の文言修正 | オーナー確認後に反映 |

---

## 10. 触ってはいけない箇所

| 対象 | 理由 |
|---|---|
| `app/api/booking/route.ts` の検証・料金再計算・GASペイロード | 予約が成立しなくなる／請求額が変わる |
| `lib/services/gas-service.ts` の再送・タイムアウト・予約番号生成 | 二重予約・二重メールが発生する |
| `lib/booking-submission.ts` の送信ID | 同上 |
| `apps-script/**` すべて | **リポジトリを直しても本番へは反映されない。** 貼り替え＋再デプロイが必要。誤ると予約受信・LINE・カレンダーが止まる |
| GAS内部プラン名（`昼夜セット海亀` 他9種） | 既存予約行の識別が壊れる |
| `PLANS[].name` の生成（`lib/data.ts:1169-1177`） | シートF列の値が変わり、GASの名前判定・管理Webアプリのプラン照合が壊れる |
| `plan-flags.ts` の集合・判定関数 | フォームとAPIの両方が参照。片方だけ変えると予約が通らなくなる |
| `booking-rules.ts` `rental-options.ts` `constants/coupons.ts` | 請求額に直結 |
| `lib/i18n/locales.ts` `INTL_PLAN_IDS` | 外国語サイトの掲載範囲とAPIの受付範囲を同時に決めている |
| 既存URL（`/plans/[id]` の id、ブログ slug） | 被リンク・検索評価を失う |
| `lib/seo.ts` の `SITE_URL` / canonical / hreflang | 検索インデックスが壊れる |
| `components/json-ld.tsx` の `@id`（`#organization` `#website` `#business`） | 参照関係が切れる |
| `/book` の noindex | 予約ページがインデックスされる |

---

## 11. リスク

| # | リスク | 度合い | 対策 |
|---|---|---|---|
| R1 | 統合ビューが**6つ目のコピー**になり、かえって重複が増える | 中 | `tour-master` には**導出値しか置かない**。定数リテラルを書かない。テストで既存ソースとの一致を検証 |
| R2 | プラン表示名の変更が、シートF列とGASの名前判定へ波及する | **高** | 第4段階まで表示名を変更しない。本書の §6.3 に明記 |
| R3 | JSON-LD を自動生成に切り替えると、既存の構造化データが一時的に変わる | 中 | 第2段階で単独PR。切替前後のJSON-LDをdiffで確認 |
| R4 | FAQ統合で `/faq` の内容や順序が変わり、検索評価が動く | 中 | 質問文・回答文は変更せず、**置き場所だけ**を移す |
| R5 | M1〜M6 を推測で直すと、実際の運用条件と食い違う | **高** | **直さない。**オーナー確認まで `要確認` のまま |
| R6 | `lib/data.ts` の未使用フィールド削除で、気づいていない参照を壊す | 中 | 第3段階で `tsc` + `build` + 目視で参照確認してから |
| R7 | GAS側（`ADMIN_PLAN_CATALOG` の料金）が Next.js 側と独立しているため、料金改定時に片方だけ直る | **高** | 料金改定手順書を作る。または将来 MCP/API 経由でGASが参照する |
| R8 | 統合ビューを AI へ公開する際に、内部情報（LINE ID・シートID・売上按分）が混ざる | **高** | `visibility.exposeToAi` を必ず経由。`apps-script/**` の値は `tour-master` に**一切入れない** |

---

## 12. 推奨移行手順

| 段階 | 内容 | 前提 | 検証 |
|---|---|---|---|
| **1** | 監査（本書）＋ `lib/tour-master.ts`（導出ビュー）＋ドリフト検知テスト | なし | `npm test` `tsc` `lint` `build`。**既存ファイルを変更しない**ので画面・予約は不変 |
| **2** | M1〜M6 をオーナーへ確認し、正しい値を確定 | オーナー回答 | — |
| **3** | JSON-LD（`makesOffer` `priceRange`）を `tour-master` から生成 | 段階1 | 生成前後のJSON-LDをdiff。Rich Results Test |
| **4** | FAQ を `lib/faq.ts` へ単一ソース化。`/miyakojima-sea-turtle` の表示とJSON-LDを一致させる | 段階1 | `/faq` の表示内容が変わらないことを目視 |
| **5** | `lib/data.ts` の未描画重複フィールドを削除 | 段階1・3・4 | `tsc` `build` ＋ 予約フォームとAPIの動作確認 |
| **6** | `app/llms.txt` と `app/api/tours` を `tour-master` から生成 | 段階1〜5 | 出力内容に内部情報が含まれないことを確認 |
| **7** | `sheetPlanName` と `displayName` の分離（GAS側とセット） | 段階1〜6・GAS再デプロイ枠 | テスト予約で単品・セットの行名を確認 |

---

## 13. Cloudflare AI Search / MCP 対応に向けて後から必要になる作業

**今回は実装しません。** 段階1〜6が終わった後に着手できるよう、必要作業だけ列挙します。

### 13.1 データ供給側（このリポジトリ）

| 作業 | 内容 | 依存 |
|---|---|---|
| `app/llms.txt/route.ts` | サイト全体の案内（プラン一覧・料金・URL・問い合わせ導線）を `tour-master` から生成 | 段階1 |
| `app/llms-full.txt/route.ts` | プラン詳細・FAQ・注意事項の全文 | 段階1・4 |
| `app/api/tours/route.ts` | `TourMaster[]` をJSONで配信。`visibility.exposeToAi` が false のものは除外 | 段階1 |
| `app/api/faq/route.ts` | FAQ の構造化配信 | 段階4 |
| `robots.ts` の更新 | `llms.txt` の場所を示す。AIクローラの扱いを明示 | 上記 |
| JSON-LD の拡張 | `TouristTrip` / `Service` の併記、`provider` を `#organization` へ紐付け | 段階3 |

### 13.2 動的データ（コードに持てないもの）

| 情報 | 現在の在り処 | 将来の取得方法 |
|---|---|---|
| 空き状況 | Googleカレンダー／予約一覧シート | MCPツール `getAvailability(planId, date)` を **GAS側に新設**（読み取り専用・認証付き） |
| 当日開催可否・海況 | 運用者の判断（コード外） | 管理Webアプリに入力欄を設け、読み取り専用APIで公開 |
| 台風・季節運休 | 現在どこにもない | 同上。**要確認**：現在どう告知しているか |

### 13.3 MCP Server 側（Cloudflare Workers・未着手）

| ツール案 | 返すもの | 権限 |
|---|---|---|
| `list_tours` | `tour-master` の公開項目 | 公開 |
| `get_tour` | 1プランの詳細＋FAQ | 公開 |
| `search_faq` | FAQ全文検索 | 公開 |
| `check_availability` | 空き状況 | 公開（レート制限あり） |
| `create_booking` | **実装しない方が安全。** 予約はLINE認証必須のため、AIには `/book?plan=ID` のURLを返すに留める | — |

### 13.4 Cloudflare AI Search 側（未着手）

- クロール対象は `llms-full.txt` と `/api/tours` を優先
- `apps-script/**`・`/api/booking`・`/api/line/notify`・`/book` は**対象外**にする
- 更新頻度: プラン情報は低頻度、空き状況は AI Search ではなく MCP から取る

### 13.5 着手前に決めておくこと

1. AIに公開してよい情報の範囲（料金・空き状況・スタッフ名・電話番号）
2. AI経由の予約を許すか（現在の設計はLINE認証必須のため、**URLを返すだけ**が安全）
3. M1〜M6 の正しい値（AIは書かれたとおりに答えるため、矛盾を残したまま公開すると誤案内になる）

---

## 付録A: 検証に使ったコマンド

```bash
npm test          # 114件 → 追加後 119件
npx tsc --noEmit
npm run lint
npm run build
```

ドリフト検知は `lib/tour-master.test.mjs` が `npm test` で自動実行されます。

## 付録B: 未解決の確認事項（オーナー確認待ち）

| # | 確認したいこと |
|---|---|
| Q1 | 各プランの実際の参加可能年齢（上限・下限）。表示「5〜65歳」は正しいか（M1） |
| Q2 | 貸切セット C2・C4・C6 は60歳以上を受け付けるか（M2） |
| Q3 | S3・S6・S8 の60歳制限をページ本文にも書くか（M6） |
| Q4 | レンタルオプションの正式名称は「度付きメガネ」か「度付きマスク」か（M4） |
| Q5 | グループプランのWeb予約に人数上限を設けるか（M9） |
| Q6 | S4・S8 の集合時刻の案内はどちらが正しいか（「開始15分前」か「日没の約90分前」か）（§4.5） |
| Q7 | 台風・季節運休の告知は現在どこで行っているか（13.2） |
