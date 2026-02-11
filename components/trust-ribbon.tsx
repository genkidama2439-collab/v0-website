import { Star, MessageCircle, Heart, Award } from "lucide-react"

export function TrustRibbon() {
  return (
    <section className="py-12 bg-white/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {/* Average Rating */}
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-2">
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
              <span className="text-3xl font-bold text-emerald-800 ml-2">4.9</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">平均評価</p>
          </div>

          {/* Total Reviews */}
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-2">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <span className="text-3xl font-bold text-emerald-800 ml-2">{"1876"}</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">総口コミ件数</p>
          </div>

          {/* Family Friendly */}
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-2">
              <Heart className="w-6 h-6 text-pink-500 fill-current" />
              <span className="text-3xl font-bold text-emerald-800 ml-2">100%</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">子連れ歓迎</p>
          </div>

          {/* Experience Cases */}
          <div className="flex flex-col items-center">
            <div className="flex items-center mb-2">
              <Award className="w-6 h-6 text-emerald-500" />
              <span className="text-3xl font-bold text-emerald-800 ml-2">1500+</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">年間実績</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-8 border-t border-emerald-100">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              安全講習実施
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              保険加入済み
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              器材レンタル無料
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              写真データ提供
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
