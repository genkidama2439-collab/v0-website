import { hasTrackingConsent } from "@/lib/customer-tracking"

// 流入元計測：お客さんが「どのリンクを経由で来たか」を記録する。
// 着地時に UTMパラメータ（?utm_source=... 等）と外部参照元を localStorage に保存し、
// 予約送信時に /api/booking へ添付 → 管理者メール・カレンダーの備考に [流入元] として載る。
// 方式は GA と同じ「ラスト・ノンダイレクト」：新しい流入シグナル（UTM/外部参照元）が来たら
// 上書きし、直接アクセス（ブックマーク等）では直前の記録を保持する。90日で失効。

export interface Attribution {
  source: string // utm_source（例: instagram, gbp, flyer）
  medium: string // utm_medium（例: profile, qr）
  campaign: string // utm_campaign（任意）
  referrer: string // 外部参照元のホスト名のみ（例: www.google.com）
  landingPage: string // 最初に着地したページのパス
  ts: number
}

const STORAGE_KEY = "booking_attribution_v1"
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

// URL経由の値は誰でも操作できるため、備考欄のマーカー判定（[COMBO booking] や「ドローンSUP」等の
// GAS側プラン振り分け）と衝突しないよう ASCII の安全な文字だけ通す。UTM値はローマ字で付ける運用。
const sanitize = (value: string | null | undefined, maxLen: number): string =>
  (value || "")
    .replace(/[^\w\-./ ]/g, "")
    .trim()
    .slice(0, maxLen)

// LINEログインの認証画面。ここからの遷移は「新しい流入」ではなく認証の戻りなので、
// 参照元として扱わない。扱ってしまうと、google や instagram から来て予約フォームで
// LINEログインした人の流入元が ref:access.line.me に化け、本来の獲得元が消える。
const isLineAuthHost = (host: string): boolean =>
  host === "access.line.me" || host === "auth.line.me" || host === "liff.line.me"

// LINEアプリの内蔵ブラウザから来たときの参照元。リッチメニュー経由の本物の流入と、
// LINEログインの戻りが同じホストになって区別できない。リッチメニューのリンクには
// utm_source=line を付けて運用しているので、UTMが無いこのケースでは
// 既存の記録を優先し、上書きしない。
const isLineAppHost = (host: string): boolean =>
  host === "line.me" || host.startsWith("jp.naver.line") || host.startsWith("com.linecorp.line")

// 着地時に1回呼ぶ（AttributionTracker がマウント時に実行）
export function captureAttribution(): void {
  if (!hasTrackingConsent()) return
  try {
    const params = new URLSearchParams(window.location.search)
    const source = sanitize(params.get("utm_source"), 80)
    const medium = sanitize(params.get("utm_medium"), 80)
    const campaign = sanitize(params.get("utm_campaign"), 80)

    let referrerHost = ""
    let isInternalNavigation = false
    if (document.referrer) {
      try {
        const host = new URL(document.referrer).hostname
        if (host === window.location.hostname) isInternalNavigation = true
        else if (host) referrerHost = sanitize(host, 120)
      } catch {
        // 参照元URLが不正な形式でも計測全体は続行する
      }
    }

    // LINEの認証画面からの戻りは流入ではない。参照元として記録しない。
    if (referrerHost && isLineAuthHost(referrerHost)) referrerHost = ""

    // ブログ記事内CTAなど、サイト内リンクにも utm_* を付けている。
    // これを流入元として保存すると本来の獲得元（例: google / instagram）を潰してしまうため、
    // 同一ホストからの遷移では既存の記録を維持する。CTA自体の計測は book_cta_click 側で行う。
    if (isInternalNavigation && getAttribution()) return

    // LINEアプリ内ブラウザからの遷移でUTMが無い場合は、LINEログインの戻りの可能性が高い。
    // 既に流入元を掴んでいるなら上書きしない（初回訪問なら下で通常どおり記録される）。
    if (!source && referrerHost && isLineAppHost(referrerHost) && getAttribution()) return

    // 直接アクセス（UTMも外部参照元もなし）は上書きしない＝直前の流入元を保持
    if (!source && !referrerHost) return

    const attribution: Attribution = {
      source,
      medium,
      campaign,
      referrer: referrerHost,
      landingPage: sanitize(window.location.pathname, 120),
      ts: Date.now(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    // 計測は best-effort。プライベートブラウズ等で localStorage が使えなくても本体機能は止めない
  }
}

export function getAttribution(): Attribution | null {
  if (!hasTrackingConsent()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Attribution
    if (!parsed || typeof parsed.ts !== "number" || Date.now() - parsed.ts > MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

export function clearAttribution(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ストレージ制限中は何もしない。
  }
}

// Vercel Analytics イベント用の流入元ラベル
// 例: "instagram/profile"（UTMあり）, "ref:www.google.com"（参照元のみ）, "direct"（不明）
export function getAttributionSourceLabel(): string {
  const a = getAttribution()
  if (!a) return "direct"
  if (a.source) return a.medium ? `${a.source}/${a.medium}` : a.source
  if (a.referrer) return `ref:${a.referrer}`
  return "direct"
}
