"use client"

import Link from "next/link"
import { Check, MessageCircle, Waves } from "lucide-react"

import {
  buildCtaUtm,
  getCtaPriceNote,
  withCtaUtm,
  type ArticleCtaAction,
  type ArticleCtaCardConfig,
  type CtaPosition,
} from "@/lib/blog/article-cta"
import { sendDetailedEvent } from "@/lib/detailed-analytics"

/**
 * CTAクリックを計測する。記事URLは page_path、キャンペーンは utm_campaign、
 * 設置位置は location と utm_content の両方へ入れる（シートのどちらの列からでも追える）。
 */
export function trackCtaClick(
  action: ArticleCtaAction,
  position: CtaPosition,
  campaign: string,
): void {
  sendDetailedEvent(
    "book_cta_click",
    {
      location: position,
      ctaType: action.type,
      ctaLabel: action.label,
      ...(action.planId ? { plan: action.planId } : {}),
    },
    buildCtaUtm(campaign, position),
  )
}

function CtaButton({
  action,
  position,
  campaign,
  variant,
}: {
  action: ArticleCtaAction
  position: CtaPosition
  campaign: string
  variant: "primary" | "secondary"
}) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:text-base"
      : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-50"

  const onClick = () => trackCtaClick(action, position, campaign)

  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {action.type === "line" && <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {action.label}
      </a>
    )
  }

  return (
    <Link href={withCtaUtm(action.href, campaign, position)} className={className} onClick={onClick}>
      {action.label}
    </Link>
  )
}

/**
 * 記事本文中に差し込む予約導線カード。
 * 記事ごとの文言・誘導先・価格は lib/blog/article-cta.ts の定義から渡す。
 */
export function ArticleCtaCard({
  card,
  campaign,
}: {
  card: ArticleCtaCardConfig
  campaign: string
}) {
  const priceNote = getCtaPriceNote(card)
  const isStrong = card.tone === "strong"

  return (
    <aside
      // 本文の一部ではなく案内であることを支援技術にも伝える
      aria-label={card.title}
      className={`not-prose my-10 overflow-hidden rounded-2xl border bg-white ${
        isStrong ? "border-emerald-200 shadow-md" : "border-emerald-100 shadow-sm"
      }`}
    >
      {isStrong && (
        <p className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold tracking-wide text-white sm:text-sm">
          <Waves className="h-4 w-4 shrink-0" aria-hidden="true" />
          {card.eyebrow}
        </p>
      )}

      <div className="p-5 sm:p-6">
        {!isStrong && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-700">
            <Waves className="h-4 w-4 shrink-0" aria-hidden="true" />
            {card.eyebrow}
          </p>
        )}

        <p className="text-lg font-bold leading-snug text-gray-900 sm:text-xl">{card.title}</p>
        <p className="mt-2.5 text-sm leading-relaxed text-gray-600 sm:text-[15px]">{card.description}</p>

        {card.features && card.features.length > 0 && (
          <ul className="mt-4 grid gap-2">
            {card.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {priceNote && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">
            {priceNote}
          </p>
        )}

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <CtaButton action={card.primary} position={card.position} campaign={campaign} variant="primary" />
          {card.secondary && (
            <CtaButton
              action={card.secondary}
              position={card.position}
              campaign={campaign}
              variant="secondary"
            />
          )}
        </div>
      </div>
    </aside>
  )
}
