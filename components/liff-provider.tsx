"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface LiffContextType {
  lineUserId: string | null
  isLiffReady: boolean
  liffError: string | null
  debugLog: string[]
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  isLiffReady: false,
  liffError: null,
  debugLog: [],
})

export const useLiff = () => useContext(LiffContext)

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])
  const initialized = useRef(false)

  const log = (msg: string) => {
    console.log("[LIFF]", msg)
    setDebugLog((prev) => [...prev, `${new Date().toLocaleTimeString()} ${msg}`])
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const initLiff = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID
      log(`liffId: ${liffId ?? "undefined"}`)
      log(`URL: ${window.location.href}`)
      log(`UA: ${navigator.userAgent.slice(0, 80)}`)

      try {
        if (!liffId) {
          setLiffError("LIFF_ID未設定")
          setIsLiffReady(true)
          return
        }

        const liffModule = await import("@line/liff")
        const liff = liffModule.default
        log("SDK loaded")

        await liff.init({ liffId })
        log(`init OK | isInClient: ${liff.isInClient()} | isLoggedIn: ${liff.isLoggedIn()} | OS: ${liff.getOS()}`)

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          log(`userId: ${profile.userId}`)
        } else if (liff.isInClient()) {
          log("In LINE client but not logged in → login()")
          liff.login()
          return
        } else {
          log("External browser → skipping login, no userId")
        }

        setIsLiffReady(true)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        const detail = error instanceof Error && (error as any).code ? ` (code: ${(error as any).code})` : ""
        log(`ERROR: ${msg}${detail}`)
        if (window.location.hash && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search)
        }
        setLiffError(`${msg}${detail}`)
        setIsLiffReady(true)
      }
    }

    initLiff()
  }, [])

  return (
    <LiffContext.Provider value={{ lineUserId, isLiffReady, liffError, debugLog }}>
      {/* デバッグパネル（確認後削除） */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)", color: "#0f0", fontSize: 11,
        padding: 8, maxHeight: "40vh", overflow: "auto", fontFamily: "monospace"
      }}>
        <div><b>LIFF Debug</b> | ready: {String(isLiffReady)} | userId: {lineUserId ?? "null"} | error: {liffError ?? "none"}</div>
        {debugLog.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {children}
    </LiffContext.Provider>
  )
}
