"use client"

declare global {
  interface Window {
    liff: any
  }
}

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

// window.liffが利用可能になるまでポーリング（最大5秒）
async function waitForLiffSDK(maxWaitMs = 5000): Promise<boolean> {
  const interval = 100
  let elapsed = 0
  while (elapsed < maxWaitMs) {
    if (typeof window !== "undefined" && window.liff) return true
    await new Promise((r) => setTimeout(r, interval))
    elapsed += interval
  }
  return false
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initLiff = async () => {
      try {
        const sdkAvailable = await waitForLiffSDK(5000)
        if (!sdkAvailable) {
          console.log("[LIFF] SDK not available after 5s")
          setIsLiffReady(true)
          return
        }

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          setLiffError("LIFF_ID未設定")
          setIsLiffReady(true)
          return
        }

        await window.liff.init({ liffId })

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLineUserId(profile.userId)
          console.log("[LIFF] User logged in:", profile.userId)
        } else if (window.liff.isInClient()) {
          // LINEアプリ内だがログイン未完了 → ログインを促す
          console.log("[LIFF] In client but not logged in, initiating login")
          window.liff.login()
          return
        } else {
          console.log("[LIFF] Accessed from browser (not LINE app)")
        }

        setIsLiffReady(true)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error("[LIFF] init error:", msg)
        setLiffError(msg)
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
