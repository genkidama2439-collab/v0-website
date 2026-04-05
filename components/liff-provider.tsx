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

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initLiff = async () => {
      try {
        if (typeof window === "undefined" || !window.liff) {
          // SDK未読み込みの場合、少し待ってリトライ
          await new Promise((resolve) => setTimeout(resolve, 1000))
          if (!window.liff) {
            console.log("[LIFF] SDK not available")
            setIsLiffReady(true)
            return
          }
        }

        await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLineUserId(profile.userId)
          console.log("[LIFF] User logged in:", profile.userId)
        } else if (window.liff.isInClient()) {
          window.liff.login()
        } else {
          console.log("[LIFF] Accessed from browser")
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
