import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BreadcrumbJsonLd } from "@/components/json-ld"
import { createMetadata, SITE_URL } from "@/lib/seo"
import { TrackedTel } from "@/components/tracked-cta"

export const metadata: Metadata = createMetadata({
  title: "プライバシーポリシー",
  description:
    "海亀兄弟（宮古島ウミガメシュノーケルツアー）のプライバシーポリシー。ご予約時にお預かりする個人情報の利用目的と取り扱いについてご説明します。",
  path: "/privacy",
  locale: "ja",
  intlBasePath: "/privacy",
})

const SECTIONS: Array<{ title: string; body: React.ReactNode }> = [
  {
    title: "1. 取得する情報",
    body: (
      <>
        <p>当店は、ご予約・お問い合わせの際に以下の情報をお預かりします。</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>代表者の氏名、電話番号、メールアドレス</li>
          <li>LINEのユーザーID・表示名（LINE連携をご利用の場合）</li>
          <li>参加者の氏名（任意）、年齢、身長・体重（任意）、足のサイズ</li>
          <li>ご要望・ご相談などフォームにご入力いただいた内容</li>
          <li>閲覧ページ、流入元、クリック、スクロール、フォーム操作、予約の成否</li>
          <li>Visitor ID、Visit ID、予約ファネルID、デバイス・ブラウザ・OSの種別</li>
        </ul>
      </>
    ),
  },
  {
    title: "2. 利用目的",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>ご予約の受付・確認・変更・キャンセルのご連絡</li>
        <li>安全管理および器材（フィン・ウェットスーツ等）の準備</li>
        <li>ツアー中に撮影した写真・動画のお渡し</li>
        <li>お問い合わせへの対応</li>
        <li>同意いただいた方の予約前の閲覧履歴と予約情報を結合した、サービス改善、広告・集客効果、予約導線の分析</li>
      </ul>
    ),
  },
  {
    title: "3. 第三者提供",
    body: (
      <p>
        法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。
      </p>
    ),
  },
  {
    title: "4. 外部サービスの利用",
    body: (
      <>
        <p>当店は、業務遂行のために以下の外部サービスを利用しており、その範囲で情報が各サービスに保存されます。</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>予約情報の管理: Google スプレッドシート（Google LLC）</li>
          <li>お客様へのご連絡: LINE（LINEヤフー株式会社）</li>
          <li>サイト利用状況の解析: Vercel Analytics、当店のGoogleスプレッドシート。同意済みの場合、Visitor IDにより予約情報と結合します。</li>
          <li>
            サイト利用状況の解析: Google アナリティクス（Google LLC）。同意後にCookie等を利用し、アクセス状況を収集します。詳細は
            <a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
              Googleのポリシーと規約
            </a>
            をご確認ください。
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. 行動履歴の連携、同意と保存期間",
    body: (
      <div className="space-y-2">
        <p>行動履歴の取得は任意です。同意しない場合も予約できます。同意後は、ブラウザに保存するVisitor IDを予約データに付加し、予約前の閲覧履歴と氏名・連絡先・参加者情報を結合できる状態で保存します。</p>
        <p>Visitor IDと行動イベントの保存期間は最大395日です。予約データは、予約管理、安全管理、対応履歴および法令上必要な期間保存します。画面左下の「データ取得設定」から今後の取得を停止できます。保存済みデータの削除は、下記窓口へご連絡ください。</p>
      </div>
    ),
  },
  {
    title: "6. 安全管理",
    body: (
      <p>
        お預かりした個人情報への不正アクセス、紛失、漏えい等を防止するため、適切な安全管理措置を講じます。
      </p>
    ),
  },
  {
    title: "7. 開示・訂正・削除のご請求",
    body: (
      <p>
        ご本人からの個人情報の開示・訂正・削除のご請求には、本人確認のうえ速やかに対応します。下記の窓口までご連絡ください。
      </p>
    ),
  },
  {
    title: "8. お問い合わせ窓口",
    body: (
      <p>
        海亀兄弟（〒906-0014 沖縄県宮古島市平良松原107-1）
        <br />
        電話: <TrackedTel href="tel:08053442439" location="privacy" className="text-emerald-700 underline">080-5344-2439</TrackedTel>（7:00〜18:00・年中無休）
        <br />
        メール: <a href="mailto:info@umigamekyoudaimiyakojima.com" className="text-emerald-700 underline break-all">info@umigamekyoudaimiyakojima.com</a>
      </p>
    ),
  },
  {
    title: "9. 本ポリシーの改定",
    body: (
      <p>
        本ポリシーの内容は、法令の改正やサービス内容の変更に応じて改定することがあります。重要な変更は本ページでお知らせします。
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: SITE_URL },
          { name: "プライバシーポリシー", url: `${SITE_URL}/privacy` },
        ]}
      />
      <Navbar />
      <main>
        <section className="px-5 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-28 max-w-3xl mx-auto">
          <p className="text-emerald-600 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Legal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">プライバシーポリシー</h1>
          <p className="text-gray-600 text-sm sm:text-base mb-8">
            海亀兄弟（以下「当店」）は、お客様の個人情報を以下の方針に基づき適切に取り扱います。
          </p>
          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h2>
                <div className="text-gray-600 text-sm sm:text-base leading-relaxed">{section.body}</div>
              </section>
            ))}
          </div>
          <p className="mt-10 text-xs text-gray-500">制定日: 2026年6月13日　最終改定日: 2026年8月13日</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
