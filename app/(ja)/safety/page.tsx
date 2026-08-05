import type { Metadata } from "next"
import Link from "next/link"
import { Shield, LifeBuoy, Waves, CloudRainWind, ClipboardCheck, UserX, Sun } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MobileCTA } from "@/components/mobile-cta"
import { BreadcrumbJsonLd } from "@/components/json-ld"
import { TrackedCta } from "@/components/tracked-cta"
import { createMetadata, SITE_URL } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  title: "安全への取り組み｜少人数制・ライフジャケット・中止基準",
  description:
    "海亀兄弟の安全対策まとめ。少人数制ガイド、ライフジャケットと浮き具、浅瀬ビーチエントリー、保険加入、天候による中止基準、参加をお断りする条件まですべて公開しています。",
  path: "/safety",
  locale: "ja",
})

// アイコン付きセクション。内容はすべてプラン詳細・FAQ・利用規約に既出の事実のみで構成し、
// 新しい安全上の主張（数値・保証）はこのページで発明しない。
const SECTIONS: Array<{ icon: React.ElementType; title: string; body: React.ReactNode }> = [
  {
    icon: Shield,
    title: "少人数制で、ガイドの目が届く範囲だけをご案内",
    body: (
      <p>
        当店のツアーは基本的に少人数制です。一度にたくさんのお客様をお預かりしないことで、ガイドが一人ひとりの様子を常に確認しながら進行できます。お子様や泳ぎが苦手な方のペースに合わせられるのも、少人数制だからこそです。周りに気兼ねなく楽しみたい方には、お客様のグループだけでご案内する貸切プランもご用意しています。
      </p>
    ),
  },
  {
    icon: LifeBuoy,
    title: "ライフジャケット全員着用＋つかまれる浮き具を常備",
    body: (
      <>
        <p>
          シュノーケル・SUPツアーでは、泳力に関係なく全員にライフジャケットを着用いただきます。何もしなくても浮く状態で参加できるうえ、ガイドはつかまることのできる浮き具を常備しています。泳げない方は浮き具につかまったまま、ガイドと一緒に移動できます。
        </p>
        <p className="mt-2">
          子ども用のシュノーケルセット・ライフジャケットも無料でご用意しています。メガネの方には度付きマスク（大人用のみ・子供用はありません）、肌寒い季節にはウェットスーツのレンタルもあります（貸切プランは無料）。
        </p>
      </>
    ),
  },
  {
    icon: Waves,
    title: "浅瀬からのビーチエントリー（船に乗りません）",
    body: (
      <>
        <p>
          ツアーはビーチから歩いて海に入る「ビーチエントリー」方式です。船を使わないため船酔いの心配がなく、浅瀬でマスクの付け方や呼吸の練習をしてから、慣れたところで少しずつ進みます。
        </p>
        <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          ※水深は開催ビーチと当日の潮の満ち引きによって変わります。潮位によっては足がつかない場合もありますが、その場合もライフジャケットで浮いた状態のまま、浮き具とガイドのサポートで安全に楽しめます。不安な方は予約前にLINEでお気軽にご相談ください。
        </p>
      </>
    ),
  },
  {
    icon: CloudRainWind,
    title: "開催判断は「雨」より「風・波・雷」",
    body: (
      <>
        <p>
          小雨でも海の中の楽しさはほとんど変わらないため、開催の判断は雨そのものより風の強さ・波の高さ・雷を重視しています。当日の風向きに合わせて、その日いちばん穏やかで安全なビーチを選んでご案内します（集合場所が前日案内なのはこのためです。詳しくは
          <Link href="/access" className="text-emerald-700 underline underline-offset-2 font-medium">集合場所・アクセス</Link>
          をご覧ください）。
        </p>
        <p className="mt-2">
          安全を最優先し、当店の判断でツアーを中止する場合があります。<strong>当店判断の中止は、ツアー料金もキャンセル料も一切かかりません</strong>。お支払いは当日現地での現金決済のため、事前払いの返金手続きも発生しません。
        </p>
      </>
    ),
  },
  {
    icon: ClipboardCheck,
    title: "保険加入・開始前の安全講習",
    body: (
      <p>
        当店は保険に加入したうえでツアーを開催しています。ツアー当日は集合後に安全講習と器材の装着確認を行い、注意事項をご説明してから海に入ります。ツアー中はガイドが高画質カメラで撮影を行うため、お客様は両手を自由にして体験に集中していただけます。
      </p>
    ),
  },
  {
    icon: UserX,
    title: "安全のため、参加をお断りする場合があります",
    body: (
      <>
        <p>次に当てはまる方は、安全上の理由からご参加いただけません。</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>妊娠中、またはその可能性のある方</li>
          <li>飲酒されている方</li>
          <li>心臓疾患・てんかん・喘息などの持病をお持ちの方（状態により個別対応しますので、予約前にLINEでご相談ください）</li>
        </ul>
        <p className="mt-2">
          また、通常（相乗り）のシュノーケル・ドローンSUP系プランでは、60歳以上の方がいるグループは貸切プランのみのご案内としています。ご年配の方にも、周りに合わせず自分のペースで楽しんでいただくための運用です。各プランの対象年齢はプランページでご確認ください。
        </p>
      </>
    ),
  },
  {
    icon: Sun,
    title: "お客様にお願いしたいこと",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>宮古島の紫外線は本州の約1.5〜2倍です。ウォータープルーフの日焼け止め（サンゴにやさしいリーフセーフ推奨）とラッシュガードをご準備ください</li>
        <li>睡眠不足・二日酔いなど体調がすぐれない場合は無理をせず、日程変更をLINEでご相談ください（前日までの変更・キャンセルは無料です）</li>
        <li>ツアー中はガイドの案内する範囲内でお楽しみください</li>
      </ul>
    ),
  },
]

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: SITE_URL },
          { name: "安全への取り組み", url: `${SITE_URL}/safety` },
        ]}
      />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="text-emerald-600 font-semibold text-xs tracking-widest uppercase mb-2">Safety</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">安全への取り組み</h1>
        <p className="text-gray-600 leading-relaxed mb-10">
          海のツアーは「楽しかった」で終わることがすべてです。海亀兄弟が毎日のツアーで実際に行っている安全対策と、開催・中止の判断基準、参加条件をこのページにまとめました。
        </p>

        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-2xl bg-white border border-emerald-100 shadow-sm p-5 sm:p-6">
              <h2 className="flex items-start gap-3 text-lg sm:text-xl font-bold text-gray-900 mb-3">
                <s.icon className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {s.title}
              </h2>
              <div className="text-gray-700 leading-relaxed text-[15px]">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-emerald-600 text-white p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">不安なことは、予約前に何でも聞いてください</h2>
          <p className="text-emerald-50 text-sm mb-5">
            「泳げないけど大丈夫？」「この持病でも参加できる？」など、LINEで24時間受け付けています。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <TrackedCta
              event="book_cta_click"
              eventProps={{ location: "safety" }}
              href="/book"
              className="inline-block bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              空き確認・予約する
            </TrackedCta>
            <Link
              href="/faq"
              className="inline-block border border-white/60 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              よくある質問を見る
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
