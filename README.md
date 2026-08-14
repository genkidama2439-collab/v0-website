# 海亀兄弟 — 宮古島ウミガメツアー予約サイト

宮古島でウミガメと泳ぐシュノーケルツアー「海亀兄弟」の公式サイト。
ツアー紹介・予約・ブログ（観光情報）・英語版を備えた Next.js アプリです。

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://www.umigamekyoudaimiyakojima.com)

- 本番サイト: **https://www.umigamekyoudaimiyakojima.com**
- リポジトリ: https://github.com/umigame-kyoudai/umigame-kyoudai-site

## 技術スタック

| 区分 | 採用技術 |
|---|---|
| フレームワーク | Next.js 14（App Router）/ React 18 |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 / framer-motion |
| 画像 | next/image（Vercel Blob ストレージ） |
| 予約連携 | Google Apps Script（予約シート）+ LINE Bot SDK / LIFF |
| 計測 | Vercel Analytics（予約・LINE CTA のカスタムイベント） |

## ローカル開発

```bash
npm install
npm run dev     # http://localhost:3000
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | ビルド済みアプリの起動 |
| `npm run lint` | Lint 実行 |
| `npm test` | ロジックの自動テスト（`node --test`） |

型チェックは `npx tsc --noEmit` で実行します。

### 環境変数

予約・LINE 連携には以下の環境変数が必要です（Vercel のプロジェクト設定で管理）。

| 変数名 | 必須 | 用途 |
|---|---|---|
| `GAS_BOOKING_URL` | ○ | 予約データの送信先（Google Apps Script Web アプリ URL）。未設定だと予約APIが常に失敗する |
| `LINE_CHANNEL_ACCESS_TOKEN` | ○ | LINE 公式アカウントからの通知送信 |
| `LINE_NOTIFY_SECRET` | ○ | `/api/line/notify` 認証用シークレット（GAS側の`NOTIFY_SECRET`と同じ値） |
| `NEXT_PUBLIC_LIFF_ID` | ○ | LINE ログイン（LIFF）連携。設定時は予約送信にLINEログインが必須になる |
| `LINE_LOGIN_CHANNEL_ID` | ○ | 予約APIでLIFF ID tokenを検証するLINE Login Channel ID（サーバー専用） |
| `ANALYTICS_SHEETS_WEBHOOK_URL` | — | 行動計測を記録する分析GASの `/exec` URL。未設定なら計測を送らないだけで予約は動く |
| `ANALYTICS_SHEETS_SHARED_SECRET` | — | 分析GASの`ANALYTICS_SHARED_SECRET`と同じ共有シークレット |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | — | GA4 測定ID |

## デプロイ

`main` ブランチへ push すると **Vercel が本番へ自動デプロイ**します。
プレビューは PR / 非 main ブランチの push で自動生成されます。

### Google Apps Script

海亀兄弟の予約管理GASは[`apps-script/umigame-reservation-admin/`](apps-script/umigame-reservation-admin/)で管理します。GASを確認・変更するときは、最初に同フォルダの`README.md`と`CHANGELOG.md`を確認してください。

予約管理Webアプリのソースは[`apps-script/umigame-reservation-webapp/`](apps-script/umigame-reservation-webapp/)で管理します。既存の予約受付GASとは別の管理画面専用プロジェクトとしてデプロイします。

行動計測の集計GASは[`apps-script/umigame-analytics/`](apps-script/umigame-analytics/)で管理します。

`docs/gas-line-notify.js`は旧参考ファイルで、本番への貼り付けには使用しません。

**GASのコードはリポジトリを更新しただけでは本番へ反映されません。** 各フォルダの`LATEST.md`に
本番反映状況を記載しているので、変更後は必ず貼り付け＋新バージョンでの再デプロイまで行ってください。

## ディレクトリ構成

```
app/            ルーティング（App Router）
  (ja)/           日本語サイト（トップ・プラン・ブログ・予約フォーム・FAQ 等）
  (en)/ (ko)/ (zh)/  英語 / 韓国語 / 繁体字中国語サイト（貸切プランのみ）
  api/            予約 / クーポン / LINE 通知 / 行動計測のサーバー処理
  sitemap.ts / robots.ts  SEO 設定
components/      UI コンポーネント（home/ にトップ各セクション、intl/ に多言語ページ）
lib/             データ・ロジック（プラン・ブログ・料金・予約・計測・SEO 等）
  data.ts         プラン / ブログ / スタッフのマスターデータ
  plan-flags.ts   セットプラン判定・時間枠・年齢条件の単一ソース
  *.test.mjs      `npm test` が実行するロジックテスト
apps-script/     Google Apps Scriptの管理ソース・変更履歴
public/          画像など静的アセット
middleware.ts    旧 URL の 308 リダイレクト（リンク評価の集約）
```

## 主な機能

- ツアープラン紹介（シュノーケル・ナイト・SUP・昼夜セットなど）
- Web 予約フォーム（料金・クーポンはサーバー側で再計算、IP レートリミット付き）
- 同じ内容の再送を同じ予約番号として扱う二重登録防止（送信ID × GAS側の予約番号照合）
- 予約内容を Google スプレッドシートへ連携し、LINE で通知
- 観光情報ブログ（SEO 流入の受け皿）
- 日本語 / 英語 / 韓国語 / 繁体字中国語の 4 言語対応（hreflang 相互リンク）
- 同意した利用者のみを対象とした行動計測（Google スプレッドシートへ集計）
