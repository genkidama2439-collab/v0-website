// スタッフ型定義
export interface Staff {
  id: string
  name: string
  role: string
  bio: string
  image: string
  languages: string[]
  specialties: string[]
}

// スタッフ一覧
export const staff: Staff[] = [
  {
    id: 'hikaru',
    name: 'ヒカル',
    role: 'シュノーケリング ガイド',
    bio: 'シュノーケリングのエキスパート。宮古島の海を知り尽くしています。',
    image: '/hikaru-staff-photo.jpg',
    languages: ['日本語', '英語'],
    specialties: ['シュノーケリング', 'サンゴ保全'],
  },
  {
    id: 'nagi',
    name: 'ナギ',
    role: 'ツアーコーディネーター',
    bio: 'ツアーの企画と調整が得意。お客様の満足度が何より嬉しいです。',
    image: '/nagi-staff-photo.jpg',
    languages: ['日本語', '英語', '中国語'],
    specialties: ['顧客サービス', 'ツアー企画'],
  },
  {
    id: 'souichiro',
    name: 'ソウイチロウ',
    role: 'ナイトツアー ガイド',
    bio: '夜間のジャングル探索は私の得意分野。生き物のことなら何でも知ってます。',
    image: '/images/night-tour-coconut-crab.jpg',
    languages: ['日本語', '英語'],
    specialties: ['ナイトツアー', '生物学'],
  },
  {
    id: 'yamachan',
    name: 'ヤマちゃん',
    role: 'オーナー',
    bio: '宮古島の自然を愛する。ゲストの笑顔が最高のご褒美。',
    image: '/yamachan-staff-photo.jpg',
    languages: ['日本語'],
    specialties: ['経営', '海の知識'],
  },
]

// スタッフを取得
export const getStaffById = (id: string): Staff | undefined => {
  return staff.find((member) => member.id === id)
}

// 全スタッフを取得
export const getAllStaff = (): Staff[] => {
  return staff
}
