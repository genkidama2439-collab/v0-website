"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface LiffContextType {
  lineUserId: string | null
  lineDisplayName: string | null
  isLiffReady: boolean
  liffError: string | null
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  lineDisplayName: null,
  isLiffReady: false,
  liffError: null,
})

export const useLiff = () => useContext(LiffContext)

const STORAGE_KEY_USER_ID = "line_user_id"
const STORAGE_KEY_DISPLAY_NAME = "line_display_name"

// ページマッピング（クエリパラメータ → パス）
const PAGE_MAP: Record<string, string> = {
  home: "/",
  staff: "/staff",
  plan: "/",
  book: "/book",
  booking: "/book",
  gallery: "/gallery",
  faq: "/faq",
  blog: "/blog",
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [lineDisplayName, setLineDisplayName] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(() => {
    if (typeof window === "undefined") return false
    const params = new URLSearchParams(window.location.search)
    const page = params.get("page")
    return !!(page && PAGE_MAP[page])
  })
  const initialized = useRef(false)
  const router = useRouter()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // localStorageから復元
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID)
    const savedDisplayName = localStorage.getItem(STORAGE_KEY_DISPLAY_NAME)
    if (savedUserId) {
      setLineUserId(savedUserId)
      setLineDisplayName(savedDisplayName)
    }

    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID

      try {
        if (!liffId) {
          setIsRedirecting(false)
          setIsLiffReady(true)
          return
        }

        const liffModule = await import("@line/liff")
        const liff = liffModule.default

        let initSuccess = false
        try {
          await liff.init({ liffId })
          initSuccess = true
        } catch (initError) {
          if (window.location.hash && window.location.hash.includes("access_token")) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search)
            await liff.init({ liffId })
            initSuccess = true
          } else {
            throw initError
          }
        }

        if (initSuccess) {
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile()
            setLineUserId(profile.userId)
            setLineDisplayName(profile.displayName)
            localStorage.setItem(STORAGE_KEY_USER_ID, profile.userId)
            localStorage.setItem(STORAGE_KEY_DISPLAY_NAME, profile.displayName)
          } else if (liff.isInClient()) {
            liff.login()
            return
          }

          // pageクエリパラメータによるリダイレクト
          const params = new URLSearchParams(window.location.search)
          const page = params.get("page")
          if (page && PAGE_MAP[page]) {
            router.replace(PAGE_MAP[page])
          }
        }

        setIsRedirecting(false)
        setIsLiffReady(true)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        const detail = error instanceof Error && (error as any).code ? ` (code: ${(error as any).code})` : ""
        setLiffError(`${msg}${detail}`)
        setIsRedirecting(false)
        setIsLiffReady(true)
      }
    }

    initLiff()
  }, [router])

  // リダイレクト中はローディング表示（コンテンツを一切出さない）
  if (isRedirecting) {
    return (
      <LiffContext.Provider value={{ lineUserId, lineDisplayName, isLiffReady, liffError }}>
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#f0fdf4",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🐢</div>
            <div style={{ color: "#065f46", fontSize: 14, fontWeight: 500 }}>
              ページを読み込み中...
            </div>
          </div>
        </div>
      </LiffContext.Provider>
    )
  }

  return (
    <LiffContext.Provider value={{ lineUserId, lineDisplayName, isLiffReady, liffError }}>
      {children}
    </LiffContext.Provider>
  )
}
