import { TOUR_MASTER } from "@/lib/tour-master"

const SITE_URL = "https://www.umigamekyoudaimiyakojima.com"
const SITE_NAME = "海亀兄弟"

// SNS等の公式プロフィールURL（ナレッジグラフ強化用）。
// ここに追加すると Organization / LocalBusiness の sameAs に反映される。
const SITE_SAME_AS: string[] = [
  "https://www.instagram.com/umigamekyoudai",
]

// 全ページ共通：Google検索上のサイト名を明示する（WebSite）。
export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "ja-JP",
    publisher: { "@id": `${SITE_URL}/#organization` },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// 全ページ共通：発行元の事業者（Organization）。サイト・記事の publisher として参照される。
export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    image: `${SITE_URL}/images/gemini-generated-image-rq969urq969urq96.jpeg`,
    telephone: "+81-80-5344-2439",
    areaServed: ["宮古島", "沖縄県宮古島市"],
    ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// スタッフ紹介（/staff）：実在ガイドを Person として明示し E-E-A-T を補強。
export function StaffPersonJsonLd({
  staff,
}: {
  staff: { id: string; name: string; role?: string; image?: string }[]
}) {
  const schema = staff.map((person) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    ...(person.role ? { jobTitle: person.role } : {}),
    ...(person.image
      ? { image: person.image.startsWith("http") ? person.image : `${SITE_URL}${person.image}` }
      : {}),
    worksFor: { "@id": `${SITE_URL}/#organization` },
    url: `${SITE_URL}/staff`,
  }))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// LocalBusiness schema for the homepage
export function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SportsActivityLocation", "TouristAttraction"],
    "@id": `${SITE_URL}/#business`,
    name: SITE_NAME,
    description: "宮古島で家族向け少人数制マリン体験。ウミガメシュノーケル、貸切ツアー、ヤシガニ探検、サンセットSUP、ドローンSUP、昼夜セット。",
    url: SITE_URL,
    telephone: "+81-80-5344-2439",
    address: {
      "@type": "PostalAddress",
      postalCode: "906-0014",
      streetAddress: "平良松原107-1",
      addressLocality: "宮古島市",
      addressRegion: "沖縄県",
      addressCountry: "JP",
    },
    hasMap: "https://maps.app.goo.gl/j3nA2ug4iijmbR6j7",
    areaServed: ["宮古島", "沖縄県宮古島市"],
    geo: {
      "@type": "GeoCoordinates",
      latitude: 24.79,
      longitude: 125.28,
    },
    image: `${SITE_URL}/images/gemini-generated-image-rq969urq969urq96.jpeg`,
    priceRange: `¥${Math.min(...TOUR_MASTER.map((tour) => tour.pricing.adult)).toLocaleString()}〜¥${Math.max(...TOUR_MASTER.map((tour) => tour.pricing.adult)).toLocaleString()}`,
    // 掲載プラン・料金・URLは lib/tour-master.ts（= PLAN_PRICE_DATA / PLAN_DETAILS）から生成する。
    // 以前は10件を手書きしており、S2・S4・S5・S8・slide-boat が抜け、S1の名前も実名と違っていた。
    makesOffer: TOUR_MASTER.map((tour) => ({
      "@type": "Offer",
      name: tour.displayName,
      price: String(tour.pricing.adult),
      priceCurrency: tour.pricing.currency,
      url: tour.seo.url,
      availability:
        tour.status === "coming_soon"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
    })),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "07:00",
      closes: "18:00",
    },
    ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
    // 検証可能な口コミ・評価データと紐づかないため aggregateRating は出力しない。
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Product schema for plan detail pages
export function PlanJsonLd({ plan }: {
  plan: { name: string; heroDescription: string; price: string; image: string; id: string; status?: "active" | "coming_soon" }
}) {
  const priceNum = plan.price.replace(/[^0-9]/g, "")
  const isComingSoon = plan.status === "coming_soon"
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: plan.name,
    description: plan.heroDescription,
    image: plan.image.startsWith("http") ? plan.image : `${SITE_URL}${plan.image}`,
    url: `${SITE_URL}/plans/${plan.id}`,
    brand: { "@type": "Brand", name: "海亀兄弟" },
    offers: {
      "@type": "Offer",
      price: priceNum,
      priceCurrency: "JPY",
      availability: isComingSoon ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      url: isComingSoon ? `${SITE_URL}/plans/${plan.id}#coming-soon` : `${SITE_URL}/book?plan=${plan.id}`,
    },
    // 検証可能な口コミ・評価データと紐づかないため aggregateRating は出力しない。
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQPage schema
export function FAQJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// BreadcrumbList schema
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// BlogPosting schema for blog article pages
export function BlogPostingJsonLd({
  post,
}: {
  post: { id: string; title: string; excerpt: string; image: string; author: string; publishedAt: string; date?: string }
}) {
  const url = `${SITE_URL}/blog/${post.id}`
  const image = post.image?.startsWith("http") ? post.image : `${SITE_URL}${post.image}`
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.publishedAt,
    dateModified: post.date || post.publishedAt,
    author: { "@type": "Organization", name: post.author || SITE_NAME },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
