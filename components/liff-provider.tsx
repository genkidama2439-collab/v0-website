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
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  isLiffReady: false,
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
          console.error("[LIFF] NEXT_PUBLIC_LIFF_ID is not set")
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
        console.error("[LIFF] init error:", error)
        setIsLiffReady(true)
      }
    }

    initLiff()
  }, [])

  return (
    <LiffContext.Provider value={{ lineUserId, isLiffReady }}>
      {children}
    </LiffContext.Provider>
  )
}
