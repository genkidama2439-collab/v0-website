// プラン型定義
export interface Plan {
  id: string
  name: string
  description: string
  duration: string
  price: number
  childPrice?: number
  maxParticipants: number
  features: string[]
  image: string
  rank?: number
}

// サンセットシュノーケリングプラン
export const plans: Plan[] = [
  {
    id: 'sunset-snorkel',
    name: 'サンセット シュノーケリング',
    description: '西表島の美しいサンセットを楽しみながらシュノーケリング',
    duration: '約3時間',
    price: 12000,
    maxParticipants: 4,
    features: ['シュノーケルギア貸出', 'プロガイド同行', '夕焼け写真撮影', 'ウェットスーツ'],
    image: '/images/sunset-sup-silhouettes.jpg',
  },
  {
    id: 'day-snorkel',
    name: 'デイ シュノーケリング',
    description: '宮古島の海で色とりどりの熱帯魚とサンゴを観察',
    duration: '約4時間',
    price: 10000,
    maxParticipants: 6,
    features: ['シュノーケルギア貸出', 'プロガイド同行', 'ランチ付', 'フォト撮影'],
    image: '/snorkeling-underwater-coral-reef-fish.jpg',
  },
  {
    id: 'family-plan',
    name: 'ファミリープラン',
    description: '小さなお子様も安心！家族向けシュノーケリング体験',
    duration: '約3時間',
    price: 8000,
    maxParticipants: 4,
    features: ['キッズギア貸出', '浅瀬中心のコース', 'プロガイド同行', '安全第一'],
    image: '/images/s1-sea-turtle-snorkeling.jpg',
  },
  {
    id: 'night-tour',
    name: 'ナイトツアー',
    description: '夜の宮古島の自然を探索！ジャングルの生き物観察',
    duration: '約2時間',
    price: 6000,
    maxParticipants: 6,
    features: ['ヘッドライト貸出', 'ナイトガイド', '双眼鏡貸出', 'スタートバー'],
    image: '/images/miyakojima-night-tour-creatures.jpg',
  },
]

// 価格マップ（プランIDと価格の対応）
export const planPriceMap: Record<string, number> = {
  'sunset-snorkel': 12000,
  'day-snorkel': 10000,
  'family-plan': 8000,
  'night-tour': 6000,
}

// プランを取得
export const getPlanById = (id: string): Plan | undefined => {
  return plans.find((plan) => plan.id === id)
}

// プランの価格を取得
export const getPlanPrice = (id: string): number => {
  return planPriceMap[id] || 0
}

// 大文字でも利用できるようにエクスポート（互換性）
export const PLANS = plans
