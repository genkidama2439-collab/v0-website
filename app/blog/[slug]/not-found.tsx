import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-teal-600 mb-6">
          <Search className="h-24 w-24 mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">記事が見つかりません</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">お探しの記事は存在しないか、削除された可能性があります。</p>
        <Link href="/blog">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ブログ一覧に戻る
          </Button>
        </Link>
      </div>
    </div>
  )
}
