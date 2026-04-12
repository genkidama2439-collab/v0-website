"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"

interface LiffContextType {
  lineUserId: string | null
  lineDisplayName: string | null
  isLiffReady: boolean
  liffError: string | null
  retryLiff: () => void
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  lineDisplayName: null,
  isLiffReady: false,
  liffError: null,
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

const MAX_LOGIN_RETRIES = 2
const LOGIN_RETRY_KEY = "liff_login_retry_count"

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [lineDisplayName, setLineDisplayName] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
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
          // ログイン成功 → リトライカウンタをリセット
          safeSetItem(LOGIN_RETRY_KEY, "0")

          try {
            const profile = await liff.getProfile()
            setLineUserId(profile.userId)
            setLineDisplayName(profile.displayName)
            safeSetItem(STORAGE_KEY_USER_ID, profile.userId)
            safeSetItem(STORAGE_KEY_DISPLAY_NAME, profile.displayName)
          } catch (profileError) {
            // アクセストークン期限切れ等 → 再ログインを試みる
            const retryCount = parseInt(safeGetItem(LOGIN_RETRY_KEY) || "0", 10)
            if (retryCount < MAX_LOGIN_RETRIES) {
              safeSetItem(LOGIN_RETRY_KEY, String(retryCount + 1))
              liff.logout()
              liff.login({ redirectUri: window.location.href })
              return
            }
            // リトライ上限に達した場合はエラーとして処理
            throw profileError
          }
        } else {
          // 未ログイン → ログインリダイレクト（ループ防止付き）
          const retryCount = parseInt(safeGetItem(LOGIN_RETRY_KEY) || "0", 10)
          if (retryCount < MAX_LOGIN_RETRIES) {
            safeSetItem(LOGIN_RETRY_KEY, String(retryCount + 1))
            liff.login({ redirectUri: window.location.href })
            return
          }
          // ログインループ検出 → リトライカウンタをリセットしてエラー扱い
          safeSetItem(LOGIN_RETRY_KEY, "0")
          setLiffError("LINEログインに失敗しました。LINEアプリからアクセスしてください。")
        }
      }

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

  const retryLiff = () => {
    // リトライカウンタをリセットして再初期化
    safeSetItem(LOGIN_RETRY_KEY, "0")
    setLiffError(null)
    setIsLiffReady(false)
    initialized.current = false
    initLiff()
  }

  return (
    <LiffContext.Provider value={{ lineUserId, lineDisplayName, isLiffReady, liffError, retryLiff }}>
      {children}
    </LiffContext.Provider>
  )
}
