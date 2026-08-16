import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck, MessageCircle, Shield, Camera, Users, MapPin, CheckCircle2, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/json-ld"
import { createMetadata, SITE_URL } from "@/lib/seo"
import { getFaqs } from "@/lib/faq"
import { TrackedCta } from "@/components/tracked-cta"
import { getBlogPost } from "@/lib/blog"
import { getArticleCtaCard, getArticleCtaConfig, resolveRelatedContent } from "@/lib/blog/article-cta"
import { ArticleCtaCard } from "@/components/blog/article-cta-card"
import { ArticleRelatedContent } from "@/components/blog/article-related-content"
import { ArticleStickyCta } from "@/components/blog/article-sticky-cta"

const PAGE_PATH = "/miyakojima-sea-turtle"
// ユーザー指定の長尺タイトル。ルートの title.template による二重サフィックスを避けるため absolute で指定する。
const PAGE_TITLE = "宮古島でウミガメ（海亀）に会える場所と時期｜遭遇率・おすすめビーチ・ツアー解説"

export const metadata: Metadata = {
  ...createMetadata({
    title: PAGE_TITLE,
    description:
      "宮古島でウミガメ（海亀）に会えるビーチや遭遇率が高い時期、初心者・子どもでも泳げるか、個人で行く際の注意点まで解説。安全に宮古島のウミガメツアー・シュノーケルを楽しむなら少人数制の海亀兄弟へ。",
    path: PAGE_PATH,
    locale: "ja",
    intlBasePath: "/miyakojima-sea-turtle",
  }),
  title: { absolute: PAGE_TITLE },
}

// FAQの文言は lib/faq.ts が単一ソース。表示とFAQPage構造化データの両方がこの配列を使う。
const FAQS = getFaqs("sea-turtle-guide")

function SectionHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-4 scroll-mt-20">
      {children}
    </h2>
  )
}

export default function MiyakojimaSeaTurtlePage() {
  // 記事内予約導線。キーはページパス（ブログ記事はスラッグをキーにしている）。
  const articleCta = getArticleCtaConfig(PAGE_PATH)
  const articleRelated = articleCta
    ? resolveRelatedContent(articleCta.related, (slug) => getBlogPost(slug))
    : []
  const topCard = articleCta && getArticleCtaCard(articleCta, "article_top")
  const middleCard = articleCta && getArticleCtaCard(articleCta, "article_middle")
  const bottomCard = articleCta && getArticleCtaCard(articleCta, "article_bottom")

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50">
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: `${SITE_URL}/` },
          { name: "宮古島でウミガメに会える場所とシュノーケリング完全ガイド", url: `${SITE_URL}${PAGE_PATH}` },
        ]}
      />
      <FAQJsonLd faqs={FAQS} />
      <Navbar />

      <main>
        {/* Hero（軽量グラデーション。LCP画像を置かずスマホ表示速度を優先） */}
        <section className="relative bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700 text-white">
          <div className="max-w-4xl mx-auto px-5 pt-24 pb-14 sm:pt-28 sm:pb-20">
            <p className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-sm font-semibold mb-5">
              <MapPin className="w-4 h-4" />
              宮古島 ウミガメ（海亀）完全ガイド
            </p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-5 text-balance">
              宮古島でウミガメに会える場所と
              <br className="hidden sm:block" />
              シュノーケリング完全ガイド
            </h1>
            <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-2xl text-pretty">
              宮古島は、一年を通してウミガメ（海亀）に出会えるチャンスが高い人気のスポットです。このページでは、宮古島でウミガメに会いやすい場所や時期、初心者・お子様でも泳げるのか、個人で行く際の注意点、そして宮古島のウミガメツアーに参加するのがおすすめな理由までをまとめました。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <TrackedCta
                event="book_cta_click"
                eventProps={{ location: "pillar" }}
                href="/book"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-7 py-3.5 rounded-full shadow-lg transition-all active:scale-95 hover:bg-emerald-50"
              >
                <CalendarCheck className="w-5 h-5" />
                空き確認・予約する
              </TrackedCta>
              <TrackedCta
                event="line_click"
                eventProps={{ location: "pillar" }}
                href="https://lin.ee/jfp4laz"
                external
                className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-bold px-7 py-3.5 rounded-full border border-white/35 transition-all active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                LINEで相談
              </TrackedCta>
            </div>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-5 py-12 sm:py-16">
          {/* 誇大表現を避けるための注意書き */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-12">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-relaxed">
              ウミガメは野生動物です。本ページの「遭遇率が高い」という記載は遭遇を保証するものではありません。安全と環境保全のため、見つけても触れたり追いかけたりせず、そっと観察してください。
            </p>
          </div>

          <section className="mb-12">
            <SectionHeading id="spots">宮古島でウミガメに会える可能性が高い場所</SectionHeading>
            <p className="text-gray-700 leading-relaxed mb-4 text-pretty">
              宮古島の周囲にはサンゴ礁が広がり、ウミガメのエサとなる海草や藻が豊富なため、各地でウミガメが暮らしています。中でも遭遇率が高いとされるのは、次のようなエリアです。
            </p>
            <ul className="space-y-3">
              {[
                ["シギラビーチ周辺", "波が穏やかで、シュノーケル中にウミガメと出会えるチャンスが高いビーチです。"],
                ["新城（あらぐすく）海岸", "遠浅でリーフが近く、初心者でも観察しやすいエリアです。"],
                ["ボートで向かう沖のリーフポイント", "人が少なくウミガメが落ち着いて過ごしているため、遭遇率が高い傾向があります。"],
              ].map(([place, desc]) => (
                <li key={place} className="flex gap-3 bg-white rounded-xl p-4 shadow-sm">
                  <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">{place}</strong>：{desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 text-pretty">
              ビーチからのエントリーでも会えることはありますが、潮や天候、その日の海況に大きく左右されます。より高い確率で会いたい場合は、ポイントを熟知したガイドと一緒に行くのがおすすめです。スポット選びは
              <Link href="/blog/miyakojima-beginner-snorkeling-guide" className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium">
                初心者でも安心！宮古島シュノーケルスポットまとめ
              </Link>
              も参考にしてください。
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="season">ウミガメに会いやすい時期・時間帯</SectionHeading>
            <p className="text-gray-700 leading-relaxed mb-4 text-pretty">
              宮古島では一年を通してウミガメに会うことができますが、観察のしやすさは海況によって変わります。
            </p>
            <ul className="space-y-2 text-gray-700 leading-relaxed list-disc pl-5">
              <li>
                <strong className="text-gray-900">時期</strong>：海が穏やかで透明度が上がる4〜10月ごろは特に観察しやすいシーズンです。冬でも会えますが、北風で海が荒れる日が増えます。
              </li>
              <li>
                <strong className="text-gray-900">時間帯</strong>：風が弱く海が穏やかな午前中がおすすめです。
              </li>
              <li>
                <strong className="text-gray-900">潮</strong>：満潮前後はリーフ上を泳ぎやすく、観察しやすいことがあります。
              </li>
            </ul>
            <p className="text-gray-500 text-sm leading-relaxed mt-4">
              ※ウミガメは野生動物のため、時期・時間帯にかかわらず遭遇を保証するものではありません。
            </p>
          </section>

          {/* 25%地点：まだ情報収集中の読者向けの控えめな案内 */}
          {articleCta && topCard && <ArticleCtaCard card={topCard} campaign={articleCta.campaign} />}

          <section className="mb-12">
            <SectionHeading id="beginner">初心者や子どもでもウミガメシュノーケルはできる？</SectionHeading>
            <p className="text-gray-700 leading-relaxed mb-4 text-pretty">
              できます。ウミガメシュノーケルは、泳ぎの得意・不得意にかかわらず楽しめるアクティビティです。
            </p>
            <ul className="space-y-2 text-gray-700 leading-relaxed list-disc pl-5">
              <li>ライフジャケットを着用するので、浮いた状態で水面からウミガメを観察できます。</li>
              <li>
                <Link
                  href="/plans/S1"
                  className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium"
                >
                  少人数制ツアー
                </Link>
                ならガイドがそばでサポートするため、初めての方や泳ぎが苦手な方も安心です。
              </li>
              <li>
                海亀兄弟では5歳から参加可能。
                <Link
                  href="/blog/miyakojima-kids-snorkeling-age-guide"
                  className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium"
                >
                  お子様連れ
                </Link>
                のご家族にも多くご参加いただいています。
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <SectionHeading id="caution">個人で行く場合の注意点</SectionHeading>
            <p className="text-gray-700 leading-relaxed mb-4 text-pretty">
              ビーチから個人でシュノーケルする場合は、安全面と環境保全に十分注意してください。
              入りやすいビーチの設備や海況は
              <Link
                href="/blog/aragusu-beach-snorkeling-guide"
                className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium"
              >
                新城海岸完全ガイド
              </Link>
              にまとめています。
            </p>
            <ul className="space-y-3">
              {[
                ["離岸流・潮流に注意", "宮古島のビーチには流れが速い場所があります。沖に流されないよう、遊泳可能エリアと当日の海況を必ず確認しましょう。"],
                ["単独で泳がない", "必ず複数人で行動し、ライフジャケットを着用してください。"],
                ["ウミガメに触れない・追いかけない", "ウミガメは保護対象の野生動物です。触ったり進路をふさいだりせず、距離をとってそっと観察を。エサやりも厳禁です。"],
                ["紫外線・熱中症対策", "ラッシュガード、日焼け止め、こまめな水分補給を心がけましょう。"],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3 bg-white rounded-xl p-4 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">{title}</strong>：{desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4 text-pretty">
              不安がある場合や、より安全・確実に楽しみたい場合は、ガイド付きツアーの利用がおすすめです。
            </p>
          </section>

          {/* 60%地点：個人で行く注意点を読んだ直後。ツアーとの違いが一番伝わる位置 */}
          {articleCta && middleCard && <ArticleCtaCard card={middleCard} campaign={articleCta.campaign} />}

          <section className="mb-12">
            <SectionHeading id="why-tour">ツアー参加がおすすめな理由</SectionHeading>
            <ul className="space-y-3">
              {[
                [MapPin, "遭遇率を高めやすい", "ウミガメが見られるポイントや、その日の海況に合った場所をガイドが選びます。"],
                [Shield, "安全管理を任せられる", "器材の準備、流れや天候の判断をプロに任せて、安心して海に集中できます。"],
                [Camera, "写真・動画が残る", "泳ぐ自分とウミガメの姿をガイドが撮影。スマホを持ち込めない海中の思い出が残ります。"],
                [Users, "初心者サポートが手厚い", "シュノーケルの使い方から呼吸のコツまで、少人数制で丁寧にレクチャーします。"],
              ].map(([Icon, title, desc]) => {
                const I = Icon as typeof MapPin
                return (
                  <li key={title as string} className="flex gap-3 bg-white rounded-xl p-4 shadow-sm">
                    <I className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">
                      <strong className="text-gray-900">{title as string}</strong>：{desc as string}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="mb-12">
            <SectionHeading id="umigame-kyoudai">海亀兄弟のウミガメシュノーケルの特徴</SectionHeading>
            <p className="text-gray-700 leading-relaxed mb-4 text-pretty">
              海亀兄弟は、宮古島で家族向けの少人数制マリン体験を提供しています。
            </p>
            <ul className="space-y-2 mb-5">
              {[
                "少人数制で、ガイドが一人ひとりに目が届く",
                "写真・動画データを無料でプレゼント",
                "5歳から参加可能。初心者・お子様連れも安心",
                "前日までのキャンセル無料",
                "保険加入済みで安全管理を徹底",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-gray-700 leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-gray-700 leading-relaxed text-pretty">
              ツアーの種類や料金は
              <Link href="/#plans" className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium">
                ツアープラン一覧
              </Link>
              をご覧ください。空き状況の確認・ご予約は
              <TrackedCta event="book_cta_click" eventProps={{ location: "pillar_body" }} href="/book" className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium">
                予約フォーム
              </TrackedCta>
              から承っています。
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="faq">よくある質問</SectionHeading>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.question} className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">Q. {faq.question}</h3>
                  <p className="text-gray-700 leading-relaxed text-pretty">A. {faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 記事末尾：おすすめ → 予約カード。
              汎用の最終CTAは記事別CTAと役割が重なるため、こちらへ置き換えている。 */}
          {articleCta && (
            <>
              <ArticleRelatedContent items={articleRelated} campaign={articleCta.campaign} />
              {bottomCard && <ArticleCtaCard card={bottomCard} campaign={articleCta.campaign} />}
            </>
          )}
        </article>
      </main>

      <Footer />
      {/* 固定CTAは記事別のものに一本化する（サイト共通の MobileCTA とは二重に出さない） */}
      {articleCta && <ArticleStickyCta sticky={articleCta.sticky} campaign={articleCta.campaign} />}
    </div>
  )
}
