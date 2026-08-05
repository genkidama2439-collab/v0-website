import Image from "next/image"
import Link from "next/link"
import { BLUR_DATA_URLS } from "@/lib/image-placeholders"
import { PLAN_DETAILS } from "@/lib/plan-details"
import { ComingSoonBadge } from "@/components/coming-soon"

const experienceIds = ["S1", "S3", "S8", "S6", "slide-boat"] as const

const titleOverrides: Partial<Record<(typeof experienceIds)[number], string>> = {
  S1: "ウミガメシュノーケル",
  S3: "ナイトツアー",
  S8: "サンセットSUP",
  S6: "ドローンSUP",
  "slide-boat": "スライダーボート",
}

const subtitleOverrides: Partial<Record<(typeof experienceIds)[number], string>> = {
  S1: "安全管理徹底の少人数制ツアー",
  S3: "夜の冒険へ出かけよう",
  S8: "黄金の海に浮かぶひととき",
  S6: "宮古ブルーを空から撮る",
}

const experiences = experienceIds.map((id) => {
  const plan = PLAN_DETAILS[id]

  return {
    id,
    image: plan.image,
    title: titleOverrides[id] || plan.name,
    subtitle: subtitleOverrides[id] || plan.tagline,
    status: plan.status,
    href: plan.status === "coming_soon" ? `/plans/${plan.id}#coming-soon` : `/plans/${plan.id}`,
  }
})

function ExperienceCard({ exp }: { exp: typeof experiences[0] }) {
  return (
    <Link href={exp.href} className="block">
      <div className="group relative aspect-[3/4] sm:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer">
        <div className="absolute inset-0">
          <Image
            src={exp.image}
            alt={exp.title}
            fill
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URLS.turtle}
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {exp.status === "coming_soon" && (
          <ComingSoonBadge className="absolute left-3 top-3 bg-white/90 sm:left-4 sm:top-4" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
          <p className="text-emerald-300 text-[10px] sm:text-xs font-semibold mb-0.5">{exp.subtitle}</p>
          <h3 className="text-white text-sm sm:text-lg md:text-xl font-bold">{exp.title}</h3>
        </div>
        <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </Link>
  )
}

export function ExperienceSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-gray-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-16">
          <p className="text-emerald-400 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Experiences</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3">
            {experiences.length}つの<span className="text-emerald-400">感動体験</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg max-w-xl mx-auto">
            宮古島の海と自然を、朝から夜まで満喫できる多彩なプラン
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-6">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.title} exp={exp} />
          ))}
        </div>
      </div>
    </section>
  )
}
