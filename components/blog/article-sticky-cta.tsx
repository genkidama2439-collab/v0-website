"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Calendar, MessageSquare } from "lucide-react"

import {
  LINE_CONSULT_URL,
  withCtaUtm,
  type ArticleStickyCtaConfig,
} from "@/lib/blog/article-cta"
import { trackCtaClick } from "@/components/blog/article-cta-card"

const POSITION = "sticky_mobile" as const

// 記事を読み始めた直後に画面下を塞がないよう、少しスクロールしてから出す。
const SHOW_AFTER_SCROLL_PX = 400

/**
 * 記事詳細ページだけに出すスマホ固定CTA。
 * サイト共通の MobileCTA はブログ記事ページでは描画されないため、ここでの二重表示は起きない。
 */
export function ArticleStickyCta({
  sticky,
  campaign,
}: {
  sticky: ArticleStickyCtaConfig
  campaign: string
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsVisible(window.scrollY > SHOW_AFTER_SCROLL_PX)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      {/* 固定バー分の余白。記事末尾のボタンやフッターがバーに隠れないようにする。 */}
      <div aria-hidden="true" className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden" />

      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 md:hidden ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div
          className="border-t border-emerald-200/60 bg-white/95 px-3 pt-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm"
          style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-2">
            <a
              href={LINE_CONSULT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-green-300 bg-white px-3.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-50"
              onClick={() =>
                trackCtaClick(
                  { label: "LINEで相談", href: LINE_CONSULT_URL, type: "line", external: true },
                  POSITION,
                  campaign,
                )
              }
            >
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              相談
            </a>

            <Link
              href={withCtaUtm(sticky.href, campaign, POSITION)}
              className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
              onClick={() =>
                trackCtaClick(
                  {
                    label: sticky.label,
                    href: sticky.href,
                    type: sticky.type,
                    ...(sticky.planId ? { planId: sticky.planId } : {}),
                  },
                  POSITION,
                  campaign,
                )
              }
            >
              <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{sticky.label}</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
