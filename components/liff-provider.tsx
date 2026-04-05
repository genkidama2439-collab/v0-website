"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface LiffContextType {
  lineUserId: string | null
  isLiffReady: boolean
  liffError: string | null
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  isLiffReady: false,
  liffError: null,
})

export const useLiff = () => useContext(LiffContext)

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID
      console.log("[LIFF] Starting init. liffId:", liffId ?? "undefined")
      console.log("[LIFF] Current URL:", window.location.href)

      try {
        if (!liffId) {
          setLiffError("LIFF_ID未設定（Vercel環境変数を確認）")
          setIsLiffReady(true)
          return
        }

        const liffModule = await import("@line/liff")
        const liff = liffModule.default
        console.log("[LIFF] SDK loaded, liff object:", typeof liff)

        await liff.init({ liffId })
        console.log("[LIFF] init() succeeded")
        console.log("[LIFF] isInClient:", liff.isInClient())
        console.log("[LIFF] isLoggedIn:", liff.isLoggedIn())
        console.log("[LIFF] OS:", liff.getOS())

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          console.log("[LIFF] User logged in:", profile.userId)
        } else if (liff.isInClient()) {
          console.log("[LIFF] In LINE client but not logged in, initiating login")
          liff.login()
          return
        } else {
          console.log("[LIFF] External browser context, not logged in")
          // 外部ブラウザではログインを促す
          liff.login()
        }

        setIsLiffReady(true)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        const detail = error instanceof Error && (error as any).code ? ` (code: ${(error as any).code})` : ""
        console.error("[LIFF] init error:", msg, detail, error)
        setLiffError(`${msg}${detail}`)
        setIsLiffReady(true)
      }
    }

    initLiff()
  }, [])

  return (
    <LiffContext.Provider value={{ lineUserId, isLiffReady, liffError }}>
      {children}
    </LiffContext.Provider>
  )
}
