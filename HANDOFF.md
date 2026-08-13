# 分析・予約データ連携 引き継ぎメモ

## 最新状況（2026-08-13、未コミット・未デプロイ）

利用者の明示同意を条件に、匿名分析から「予約者と結合できる顧客・行動分析」へ移行する変更をローカルで実装した。下記の2026-07-23の作業ログは、導入前の履歴としてそのまま残している。

- 最大395日保持する `Visitor ID`、30分無操作で更新する `Visit ID`、予約フォーム単位の `予約ファネルID` を追加。
- 同意前・拒否後はGA4、Vercel Analytics、独自イベント、流入元保存、識別子生成を行わない。画面左下から同意を撤回できる。
- 予約送信時に同じ識別子と予約番号を付け、予約前の閲覧履歴を予約者へ結合可能にした。
- 予約台帳の既存19列を維持し、末尾へメール、識別子、同意記録、流入元、端末情報、参加者の年齢・身長・体重・足サイズ、要望・アレルギー等を追加。
- 日本語フォームにもメール欄を追加し、4言語すべてでメールを必須化。
- 行動イベント側には生の氏名・電話・メール・参加者数値を複製せず、予約番号と識別子で予約台帳に結合する。
- 行動イベントは395日後に日次削除するApps Scriptトリガーを追加。
- プライバシーポリシーと同意通知を日本語・英語・韓国語・繁体字中国語で更新。
- `npm test` 88件、`npm run lint`、`npx tsc --noEmit`、`npm run build` はすべて成功。

本番反映には、コードのコミット・デプロイに加えて次が必要。

1. `apps-script/umigame-analytics/Code.gs` を既存の分析GASへ反映し、既存の `ANALYTICS_SPREADSHEET_ID` を確認してから `setupAnalyticsWorkbook()` を1回実行する。
2. `apps-script/umigame-reservation-admin/Code.gs` を予約管理GASへ反映し、ウェブアプリを新バージョンでデプロイする。次回予約受信時に、既存行を消さず末尾列が自動追加される。
3. 同意・拒否、通常予約、LINEログイン往復、4言語のテスト予約を本番相当で確認する。

---

## 以前の匿名分析導入ログ（2026-07-23）

## ステータス: 完了

- PR #13 を `main` にマージ済み（コミット `bbdf2be`）、本番デプロイ確認済み。
- Google Sheetsのセットアップ・Webアプリデプロイ・Vercel環境変数登録、すべて完了。
- 本番サイトからのテストイベント送信 → スプレッドシート「イベントデータ」への記録を確認済み。
- 個人情報（氏名・メール・電話番号等）が記録されていないことを確認済み。
- 「ダッシュボード」「日別分析」の数値更新も確認済み。

残作業なし。以下は作業ログとして保存。

---

ブランチ: `wip/analytics-fix`（マージ済み）
直前コミット: `19ba06c feat: complete anonymous analytics and Sheets export`

## 今回のセッションで行ったこと

1. リポジトリ状態を確認（`git status` はクリーン、未コミット差分なし）。
2. 分析関連コード一式をレビュー:
   - `lib/analytics.ts` / `lib/analytics-schema.ts` / `lib/detailed-analytics.ts`
   - `app/api/analytics/events/route.ts`
   - `apps-script/umigame-analytics/Code.gs` / `README.md` / `appsscript.json`
   - `components/booking-form.tsx` / `booking-form-intl.tsx` / `detailed-analytics.tsx` / `site-root-layout.tsx`
3. **不具合を1件発見・修正**: Next.js側とApps Script側でイベントのフィールド名が2箇所ズレていた。
   - `landing_page`（Next.js側で一貫使用）↔ Apps Scriptは `landing_path` を読んでいた
   - `connection_type`（Next.js側で一貫使用）↔ Apps Scriptは `connection` を読んでいた
   - この結果、送信は成功していても「初回ページ」列と「接続」列が**常に空**になる状態だった。
   - `apps-script/umigame-analytics/Code.gs` の `normalizeEvent_` 内で読み取りキーをNext.js側の名前に合わせて修正済み（列構成・ヘッダー・列数は変更なし。合計39列で一致確認済み）。
4. 再検証:
   - `npx tsc --noEmit` → エラーなし
   - `npm run lint` → エラー・警告なし
   - `node --test lib/*.test.mjs lib/**/*.test.mjs` → 36件全て成功
5. 列マッピング（`EVENT_HEADERS` とダッシュボード/日別分析のQUERY式が参照する列番号）を1つずつ突き合わせ、他のズレがないことを確認済み。追加の不具合は見つからず。
6. Vercel CLI: `vercel whoami` は引き続き `Not authorized`。`.vercel/project.json` はリンク済み（projectId/orgId確認済み）なのでプロジェクト再リンクは不要、ログインのみ必要。
7. `git diff main..wip/analytics-fix` を確認 → `main` にはこの分析コード一式（`app/api/analytics/events/route.ts` 含む）がまだ存在しない。**本番へ反映するにはこのブランチのマージ＋デプロイが必要**。
8. GitHub PRはまだ作成していない（`gh auth status` は認証済み、必要なら私が作成可能）。

## Code.gs の修正差分（このセッションで実施）

```
-    landing_path: safeText_(input.landing_path, 300),
+    landing_path: safeText_(input.landing_page, 300),
```
```
-    connection: safeText_(input.connection, 30),
+    connection: safeText_(input.connection_type, 30),
```

この修正はコミット済み（`df2265a`）。`wip/analytics-fix` を push し、`main` へのPRを作成済み:
https://github.com/umigame-kyoudai/umigame-kyoudai-site/pull/13
（まだマージはしていません。内容を確認のうえ、マージのタイミングはユーザー判断でお願いします。）

## 重要な注意（重複作成を防ぐ）

既存のスプレッドシート「海亀兄弟｜匿名アクセス・予約分析」は作成済み。
`Code.gs` の `setupAnalyticsWorkbook()` はスクリプトプロパティ `ANALYTICS_SPREADSHEET_ID` が**未設定だと新しいスプレッドシートを作成してしまう**設計（`SpreadsheetApp.create(...)`）。
→ 既存シートのIDを先にスクリプトプロパティへ設定してから実行しないと、重複したスプレッドシートができてしまう。下記の手順1〜3で必ず先にIDを設定すること。

## 残作業（手動での実行が必要）— 正確な手順

### 1. 既存スプレッドシートのIDを確認
1. 「海亀兄弟｜匿名アクセス・予約分析」をGoogle Sheetsで開く。
2. URLの `https://docs.google.com/spreadsheets/d/【ここがID】/edit` の部分をコピーする。

### 2. Apps Scriptプロジェクトを作成してコードを配置
1. 開いたスプレッドシート内で「拡張機能」→「Apps Script」を選ぶ（そのスプレッドシートに紐づくスクリプトが作成される）。
2. デフォルトの `Code.gs` の中身を全て削除し、リポジトリの `apps-script/umigame-analytics/Code.gs`（今回修正済みの内容）を貼り付ける。
3. 左側の歯車アイコン「プロジェクトの設定」を開き、「"appsscript.json" マニフェスト ファイルをエディタで表示する」にチェックを入れる。
4. エディタに表示された `appsscript.json` の中身を、リポジトリの `apps-script/umigame-analytics/appsscript.json` の内容に置き換える。

### 3. 既存シートを使うようスクリプトプロパティを設定（重複作成防止）
1. 「プロジェクトの設定」→「スクリプト プロパティ」→「スクリプト プロパティを追加」。
2. キー: `ANALYTICS_SPREADSHEET_ID`　値: 手順1でコピーしたスプレッドシートID。
3. 保存する。

### 4. 初期化を1回実行
1. エディタ上部の関数選択で `setupAnalyticsWorkbook` を選び、「実行」。
2. 初回はGoogleの権限確認が出る（「確認されていないアプリ」の警告が出た場合は「詳細」→「(プロジェクト名)に移動 (安全ではないページ)」→許可）。`https://www.googleapis.com/auth/spreadsheets` の権限のみ要求される。
3. 実行ログに表示される `spreadsheetUrl` が、手順1で開いた既存シートと**同じURLであること**を確認する（違う場合は新規作成されてしまっているので、すぐに教えてください。中止して原因を確認します）。
4. スプレッドシートを開き直し、「ダッシュボード」「日別分析」「イベントデータ」「設定・定義」の4シートができていることを確認する。

### 5. 共有シークレットを1回生成
1. 関数選択で `generateAnalyticsSharedSecret` を選び、「実行」。
2. 実行ログに表示された文字列をコピーし、**パスワード管理ツールなど安全な場所にのみ**保存する（チャット・Git・Slack等には絶対に貼らない）。

### 6. Webアプリとしてデプロイ
1. 右上「デプロイ」→「新しいデプロイ」。
2. 種類の選択で「ウェブアプリ」を選ぶ。
3. 「次のユーザーとして実行」: 自分。「アクセスできるユーザー」: 全員。
4. 「デプロイ」をクリックし、必要なら権限を再度許可する。
5. 発行された `.../exec` で終わるURLをコピーする。

### 7. Vercelにログイン（ここは私は代行できません）
ローカルの `vercel whoami` が `Not authorized` のままです。以下のどちらかを行ってください。
- ターミナルで `vercel login` を実行してブラウザでログインする、または
- Vercelダッシュボード（vercel.com）に直接ログインして環境変数を設定する（CLIログイン不要で完結します）。

### 8. Vercel環境変数を登録
Vercelダッシュボード → 該当プロジェクト → Settings → Environment Variables で以下を追加（Production / Preview / Development すべてにチェック）:

| 名前 | 値 |
|---|---|
| `ANALYTICS_SHEETS_WEBHOOK_URL` | 手順6でコピーした `/exec` URL |
| `ANALYTICS_SHEETS_SHARED_SECRET` | 手順5でコピーした共有シークレット |

保存する。

### 9. 本番へコードを反映
現状 `main` ブランチにはこの分析機能のコードがまだ入っていません（`wip/analytics-fix` にのみ存在）。環境変数を登録しただけでは本番には反映されません。
PRを作成済みです: https://github.com/umigame-kyoudai/umigame-kyoudai-site/pull/13
内容を確認のうえ、マージしてください。マージ後、Vercelがmainブランチの自動デプロイを本番に反映する設定になっていれば、そのままProductionへ反映されます（Vercelダッシュボードのプロジェクト設定 → Git で、Production Branchが `main` になっているか確認してください）。

### 10. 本番反映後の動作確認
1. 本番サイトを開き、2〜3ページ移動する。
2. 予約フォームに1件テスト送信する（内容はテストとわかるものでOK。個人情報を入れる必要はない）。
3. スプレッドシートの「イベントデータ」シートに `page_view` → `booking_started` → `booking_submitted`（または失敗時は `booking_failed`）の行が追加されることを確認する。
4. 追加された行に氏名・メール・電話番号が**含まれていない**ことを確認する。
5. 「ダッシュボード」「日別分析」の数値・グラフが更新されることを確認する。

## 未解決・要判断事項

- PR #13 のマージタイミング（内容確認後、ユーザー判断でマージしてください）。
- Vercelログインは私が代行できないため、上記手順7はユーザー側で実施が必要。
- 上記手順1〜6（Sheets初期化・共有シークレット生成・Webアプリデプロイ）もGoogleアカウントでの操作が必要なため、ユーザー側で実施が必要。
