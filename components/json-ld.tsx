const SITE_URL = "https://www.umigamekyoudaimiyakojima.com"

// LocalBusiness schema for the homepage
export function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: "海亀兄弟",
    description: "宮古島で家族向け少人数制マリン体験。ウミガメシュノーケル、VIP貸切ツアー、ナイトツアー、サンセットSUP。",
    url: SITE_URL,
    telephone: "08053442439",
    address: {
      "@type": "PostalAddress",
      streetAddress: "平良西里861-5",
      addressLocality: "宮古島市",
      addressRegion: "沖縄県",
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 24.79,
      longitude: 125.28,
    },
    image: `${SITE_URL}/images/s1-sea-turtle-snorkeling.jpg`,
    priceRange: "¥4,000〜¥9,000",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "07:00",
      closes: "18:00",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "10136",
      bestRating: "5",
    },
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
  plan: { name: string; heroDescription: string; price: string; image: string; rating: number; reviews: number; id: string }
}) {
  const priceNum = plan.price.replace(/[^0-9]/g, "")
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
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/book?plan=${plan.id}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: plan.rating.toString(),
      reviewCount: plan.reviews.toString(),
      bestRating: "5",
    },
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
