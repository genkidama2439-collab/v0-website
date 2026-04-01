// ギャラリー画像型定義
export interface GalleryImage {
  id: string
  src: string
  alt: string
  category: string
  title: string
  description: string
}

// ギャラリー画像一覧
export const galleryImages: GalleryImage[] = [
  {
    id: 'gallery-1',
    src: '/images/sea-turtle-hero.jpg',
    alt: 'ウミガメとの遭遇',
    category: 'sea-turtle',
    title: 'ウミガメとの感動的な遭遇',
    description: 'シュノーケリング中にウミガメと出会った貴重な瞬間',
  },
  {
    id: 'gallery-2',
    src: '/images/snorkeling-underwater-coral-reef-fish.jpg',
    alt: 'コーラルリーフ',
    category: 'snorkeling',
    title: '美しいサンゴ礁',
    description: '宮古島の海の生物の楽園。カラフルな魚とサンゴ',
  },
  {
    id: 'gallery-3',
    src: '/images/sunset-sup-silhouettes.jpg',
    alt: 'サンセット',
    category: 'sunset',
    title: 'サンセットの美しさ',
    description: '西表島の絶景。一日の終わりを海で過ごす',
  },
  {
    id: 'gallery-4',
    src: '/images/s2-sea-turtle-closeup.jpg',
    alt: 'ウミガメ アップ',
    category: 'sea-turtle',
    title: 'ウミガメとの距離感',
    description: 'うっかり近づきすぎた時の貴重なショット',
  },
  {
    id: 'gallery-5',
    src: '/images/hero-aerial-ocean.jpg',
    alt: 'エアリアルショット',
    category: 'landscape',
    title: '上空からの景色',
    description: '宮古島全体を見渡す壮大な海の風景',
  },
  {
    id: 'gallery-6',
    src: '/images/miyakojima-night-tour-creatures.jpg',
    alt: 'ナイトツアー',
    category: 'night-tour',
    title: '夜間のジャングル生物',
    description: 'ナイトツアーでしか見ることのできない生き物たち',
  },
]

// カテゴリ別にギャラリー画像を取得
export const getGalleryImagesByCategory = (category: string): GalleryImage[] => {
  return galleryImages.filter((img) => img.category === category)
}

// ギャラリーカテゴリ一覧を取得
export const getGalleryCategories = (): string[] => {
  const categories = [...new Set(galleryImages.map((img) => img.category))]
  return categories
}

// 全ギャラリー画像を取得
export const getAllGalleryImages = (): GalleryImage[] => {
  return galleryImages
}
