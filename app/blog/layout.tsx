import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ブログ",
  description: "宮古島の海・ウミガメ・アクティビティ情報を発信。家族旅行のモデルコースや季節ごとのおすすめ情報も。",
  alternates: {
    canonical: "https://www.umigamekyoudaimiyakojima.com/blog",
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
