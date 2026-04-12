"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface LiffContextType {
  lineUserId: string | null
  lineDisplayName: string | null
  isLiffReady: boolean
  isLiffLoggedIn: boolean
  liffError: string | null
  loginLiff: () => void
  retryLiff: () => void
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  lineDisplayName: null,
  isLiffReady: false,
  isLiffLoggedIn: false,
  liffError: null,
  loginLiff: () => {},
  retryLiff: () => {},
})

export const useLiff = () => useContext(LiffContext)

const STORAGE_KEY_USER_ID = "line_user_id"
const STORAGE_KEY_DISPLAY_NAME = "line_display_name"

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // プライベートブラウジング等でストレージ制限がある場合は無視
  }
}

// LIFFモジュールをキャッシュ
let liffInstance: any = null

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [lineDisplayName, setLineDisplayName] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const initialized = useRef(false)

  const initLiff = async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID

    try {
      if (!liffId) {
        setIsLiffReady(true)
        return
      }

      const liffModule = await import("@line/liff")
      const liff = liffModule.default
      liffInstance = liff

      // LIFF初期化（ログインはしない）
      try {
        await liff.init({ liffId })
      } catch (initError) {
        if (window.location.hash && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search)
          await liff.init({ liffId })
        } else {
          throw initError
        }
      }

      // 既にログイン済みならプロフィールを取得
      if (liff.isLoggedIn()) {
        setIsLiffLoggedIn(true)
        try {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
          setLineDisplayName(profile.displayName)
          safeSetItem(STORAGE_KEY_USER_ID, profile.userId)
          safeSetItem(STORAGE_KEY_DISPLAY_NAME, profile.displayName)
        } catch (profileError) {
          // プロフィール取得失敗（トークン期限切れ等）
          // ログアウトしてリセット（次回ユーザーが手動でログインできるように）
          try { liff.logout() } catch {}
          setIsLiffLoggedIn(false)
          setLiffError("LINE情報の取得に失敗しました。再度ログインしてください。")
        }
      }
      // 未ログインの場合は何もしない（ユーザーがボタンを押すのを待つ）

      setIsLiffReady(true)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const detail = error instanceof Error && (error as any).code ? ` (code: ${(error as any).code})` : ""
      setLiffError(`${msg}${detail}`)
      setIsLiffReady(true)
    }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // localStorageから復元
    const savedUserId = safeGetItem(STORAGE_KEY_USER_ID)
    const savedDisplayName = safeGetItem(STORAGE_KEY_DISPLAY_NAME)
    if (savedUserId) {
      setLineUserId(savedUserId)
      setLineDisplayName(savedDisplayName)
    }

    initLiff()
  }, [])

  // ユーザーが手動でLINEログインを開始する
  const loginLiff = () => {
    if (!liffInstance) return
    liffInstance.login({ redirectUri: window.location.href })
  }

  const retryLiff = () => {
    setLiffError(null)
    setIsLiffReady(false)
    initialized.current = false
    initLiff()
  }

  return (
    <LiffContext.Provider value={{ lineUserId, lineDisplayName, isLiffReady, isLiffLoggedIn, liffError, loginLiff, retryLiff }}>
      {children}
    </LiffContext.Provider>
  )
}
