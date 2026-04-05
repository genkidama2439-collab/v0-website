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
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          setLiffError("LIFF_ID未設定")
          setIsLiffReady(true)
          return
        }

        const liff = (await import("@line/liff")).default
        await liff.init({ liffId })

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          console.log("[LIFF] User logged in:", profile.userId)
        } else if (liff.isInClient()) {
          console.log("[LIFF] In client, initiating login")
          liff.login()
          return
        } else {
          console.log("[LIFF] Browser context")
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
