# プロジェクト構造 - リファクタリング後

## ディレクトリ概要

```
海亀兄弟 Website
├── app/
│   ├── api/
│   │   └── booking/
│   │       └── route.ts          # 予約API (リファクタリング済)
│   ├── book/
│   │   └── page.tsx              # 予約ページ
│   ├── blog/
│   ├── faq/
│   ├── gallery/
│   ├── staff/
│   ├── page.tsx                  # ホームページ
│   ├── layout.tsx
│   ├── globals.css
│   └── icon.png
│
├── components/
│   ├── booking/                  # 予約関連コンポーネント (NEW)
│   │   ├── PlanSelector.tsx       # プラン選択
│   │   ├── CustomerInfo.tsx       # 顧客情報入力
│   │   ├── ParticipantManager.tsx # 参加者管理
│   │   └── index.ts              # エクスポート
│   ├── ui/                       # shadcn UIコンポーネント
│   ├── booking-form.tsx          # メインのBookingForm（既存）
│   ├── booking-time-slots.tsx
│   ├── navbar.tsx
│   ├── footer.tsx
│   └── ... その他のコンポーネント
│
├── lib/
│   ├── constants/                # 定数 (NEW)
│   │   └── booking.ts            # 営業時間、価格設定、エラーメッセージ
│   │
│   ├── utils/                    # ユーティリティ関数 (NEW)
│   │   ├── validation.ts         # バリデーション関数
│   │   ├── calculations.ts       # 計算関数
│   │   └── index.ts              # エクスポート
│   │
│   ├── services/                 # ビジネスロジック層 (NEW)
│   │   ├── gas-service.ts        # GAS連携
│   │   └── index.ts              # エクスポート
│   │
│   ├── hooks/                    # カスタムフック (NEW)
│   │   ├── useBookingForm.ts     # 予約フォーム状態管理
│   │   └── index.ts              # エクスポート
│   │
│   ├── data/                     # データモジュール (NEW)
│   │   ├── plans.ts              # プラン情報
│   │   ├── staff.ts              # スタッフ情報
│   │   ├── faqs.ts               # FAQ情報
│   │   ├── images.ts             # ギャラリー画像
│   │   └── index.ts              # 統合エクスポート
│   │
│   ├── date-utils.ts             # 日付ユーティリティ（既存）
│   ├── image-blur.ts             # 画像処理（既存）
│   └── utils.ts                  # 汎用ユーティリティ（既存）
│
├── public/
│   ├── images/
│   ├── ... 画像ファイル
│
└── package.json

```

## 改善点まとめ

### 1. ユーティリティ層の構築
- `lib/constants/booking.ts`: マジックナンバー廃止、一元管理化
- `lib/utils/validation.ts`: バリデーション関数の再利用可能化
- `lib/utils/calculations.ts`: ビジネス計算ロジックの分離

### 2. API層の整理
- `app/api/booking/route.ts`: 130行 → 80行に削減
- ロジック関数化で可読性向上
- `gas-service.ts`で外部連携を独立化

### 3. データ層の分割
- `lib/data.ts`: 2700行 → 5つの専門モジュール
- プラン、スタッフ、FAQ、画像を独立管理
- 各モジュールにアクセッサ関数を提供

### 4. コンポーネント最適化
- `lib/hooks/useBookingForm.ts`: フォーム状態管理を抽出
- `components/booking/`: 再利用可能な小型コンポーネント
- 単一責任原則を遵守

### 5. ディレクトリ構造化
- `lib/constants/`: 定数の一元管理
- `lib/utils/`: ユーティリティ関数群
- `lib/services/`: ビジネスロジック層
- `lib/hooks/`: カスタムフック
- `lib/data/`: データモジュール
- `components/booking/`: 予約関連コンポーネント

## メリット

✅ **可読性**: コードが論理的に整理され理解しやすい  
✅ **再利用性**: 関数やコンポーネントが独立して再利用可能  
✅ **保守性**: 変更の影響範囲が明確で修正が容易  
✅ **テスト性**: 各関数が独立してテスト可能  
✅ **スケーラビリティ**: 新機能追加時の構造拡張が容易

## マイグレーション手順

1. 既存コンポーネントから新しいユーティリティをインポート
2. `lib/data/index.ts`から統合エクスポートをインポート
3. 新規サブコンポーネントをBookingFormで使用
4. 古いコードの段階的な移行
