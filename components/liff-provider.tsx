"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import type { Liff } from "@line/liff"

import {
  consumeLineLoginRedirectFlag,
  trackLineLoginFailed,
  trackLineLoginRedirectStarted,
  trackLineLoginReturned,
  type LineLoginErrorCategory,
  type LineReturnResult,
  type RedirectMethod,
} from "@/lib/booking-funnel"

interface LiffContextType {
  lineUserId: string | null
  lineDisplayName: string | null
  lineIdToken: string | null
  isLiffReady: boolean
  isLiffLoggedIn: boolean
  isInClient: boolean
  liffError: string | null
  loginLiff: () => void
  retryLiff: () => void
  closeWindow: () => void
  getFreshLineIdToken: () => string | null
  invalidateLineSession: () => void
  /**
   * 直前のページ表示がLINE認証からの復帰だったかを1回だけ返す（計測専用）。
   * line_login_succeeded は復元結果を判定できる予約フォーム側から送るため、
   * 復帰の事実だけをここから受け渡す。
   */
  consumeLineLoginReturn: () => { returnPath: string } | null
}

const LiffContext = createContext<LiffContextType>({
  lineUserId: null,
  lineDisplayName: null,
  lineIdToken: null,
  isLiffReady: false,
  isLiffLoggedIn: false,
  isInClient: false,
  liffError: null,
  loginLiff: () => {},
  retryLiff: () => {},
  closeWindow: () => {},
  getFreshLineIdToken: () => null,
  invalidateLineSession: () => {},
  consumeLineLoginReturn: () => null,
})

export const useLiff = () => useContext(LiffContext)

const STORAGE_KEY_USER_ID = "line_user_id"
const STORAGE_KEY_DISPLAY_NAME = "line_display_name"

function clearLegacyLiffStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_USER_ID)
    localStorage.removeItem(STORAGE_KEY_DISPLAY_NAME)
  } catch {
    // プライベートブラウジング等でストレージ制限がある場合は無視する。
  }
}

// LIFFモジュールをキャッシュ
let liffInstance: Liff | null = null

// LINEのIDトークンは発行から約1時間で失効するが、LIFFはセッションが残っていても
// IDトークンを自動更新しない。そのまま送信するとサーバー検証(/oauth2/v2.1/verify)で
// 必ず拒否されるため、残り時間がこの秒数を切ったら期限切れとして扱い再ログインへ誘導する。
const ID_TOKEN_MIN_REMAINING_SECONDS = 60

// ログイン済みLIFFセッションから「検証に通る見込みのある」IDトークンだけを取り出す。
// 期限切れ・取得不能なら null。
const readValidIdToken = (liff: Liff): string | null => {
  try {
    if (!liff.isLoggedIn()) return null
    const idToken = liff.getIDToken()
    const exp = liff.getDecodedIDToken()?.exp
    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (!idToken || typeof exp !== "number" || exp <= nowInSeconds + ID_TOKEN_MIN_REMAINING_SECONDS) {
      return null
    }
    return idToken
  } catch {
    return null
  }
}

// ---- 計測用のヘルパー（LINEログインの処理手順そのものは変更しない） --------

// 分析へ送るのはパスのみ。クエリやハッシュには liff.state・access_token・
// OAuthコード等が入りうるため決して含めない。
const currentPathForAnalytics = (): string => {
  try {
    return window.location.pathname || "/"
  } catch {
    return "/"
  }
}

// LINE認証から戻ってきたことを、コールバックの痕跡またはリダイレクト開始フラグから判定する。
const detectLoginCallback = (): boolean => {
  try {
    const params = new URLSearchParams(window.location.search)
    return (
      params.has("liff.state") ||
      params.has("code") ||
      params.has("liffClientId") ||
      window.location.hash.includes("access_token")
    )
  } catch {
    return false
  }
}

// LINE側がOAuthエラーを返したかどうか。エラーの生文字列は取り出さない。
const detectProviderError = (): LineLoginErrorCategory | null => {
  try {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (!error) return null
    // access_denied はユーザーが同意画面で拒否・キャンセルしたケース
    return error === "access_denied" ? "user_cancelled" : "provider_error"
  } catch {
    return null
  }
}

const detectRedirectMethod = (liff: Liff | null): RedirectMethod => {
  if (!liff) return "unknown"
  try {
    return liff.isInClient() ? "line_app" : "external_browser"
  } catch {
    return "liff_login"
  }
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [lineDisplayName, setLineDisplayName] = useState<string | null>(null)
  const [lineIdToken, setLineIdToken] = useState<string | null>(null)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isLiffLoggedIn, setIsLiffLoggedIn] = useState(false)
  const [isInClient, setIsInClient] = useState(false)
  const [liffError, setLiffError] = useState<string | null>(null)
  const initialized = useRef(false)
  // 計測専用。LINE認証から戻った直後の1回だけ、予約フォームへ復帰の事実を渡す。
  const lineLoginReturnRef = useRef<{ returnPath: string } | null>(null)

  const consumeLineLoginReturn = useCallback((): { returnPath: string } | null => {
    const value = lineLoginReturnRef.current
    lineLoginReturnRef.current = null
    return value
  }, [])

  const clearLiffIdentity = useCallback(() => {
    setLineUserId(null)
    setLineDisplayName(null)
    setLineIdToken(null)
    setIsLiffLoggedIn(false)
    clearLegacyLiffStorage()
  }, [])

  const initLiff = useCallback(async () => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID

    // 計測用の判定材料は liff.init() より前に取る。
    // init はコールバックパラメータを消費し、失敗時の分岐でも hash を書き換えるため。
    const returnPath = currentPathForAnalytics()
    const providerError = detectProviderError()
    // consumeLineLoginRedirectFlag() は必ず呼ぶ。`detectLoginCallback() || consume...()` と
    // 書くと、コールバック痕跡がある通常の復帰では短絡評価で consume 側が実行されず、
    // sessionStorage の遷移中フラグが消えないまま残る。すると
    // isLineLoginRedirectInProgress() が以後ずっと true になり、
    // 「LINE認証への遷移は離脱に数えない」ガードが効きっぱなしになって、
    // 一度でもLINEログインしたタブでは booking_abandoned が二度と記録されなくなる。
    const hadRedirectFlag = consumeLineLoginRedirectFlag()
    const returnedFromLine = detectLoginCallback() || hadRedirectFlag
    lineLoginReturnRef.current = returnedFromLine ? { returnPath } : null

    // 認証から戻ったかどうかにかかわらず、結果を1回だけ記録するための小さなヘルパー。
    // 計測が失敗しても LINE ログイン処理は止めない。
    const reportReturn = (returnResult: LineReturnResult, hasLineSession: boolean) => {
      if (!returnedFromLine) return
      trackLineLoginReturned({ returnPath, returnResult, hasLineSession })
    }
    const reportFailure = (errorCategory: LineLoginErrorCategory) => {
      if (!returnedFromLine) return
      trackLineLoginFailed({ errorCategory, returnPath })
    }

    try {
      clearLiffIdentity()
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

      // LINEアプリ内ブラウザ（LIFF client）で開かれているか。closeWindow可否の判定に使う。
      try { setIsInClient(liff.isInClient()) } catch {}

      // LINE側がOAuthエラーを返していた場合は、セッション状態にかかわらず失敗として記録する
      if (providerError) {
        reportReturn("provider_error", false)
        reportFailure(providerError)
      }

      // 既にログイン済みならプロフィールを取得
      if (liff.isLoggedIn()) {
        const idToken = readValidIdToken(liff)
        if (!idToken) {
          // IDトークン期限切れ（LIFFは自動更新しない）。エラーではなく未ログイン扱いに戻し、
          // 通常のLINEログインボタンから再ログインしてもらう。
          try { liff.logout() } catch {}
          clearLiffIdentity()
          if (!providerError) {
            reportReturn("session_missing", false)
            reportFailure("token_expired")
          }
        } else {
          setIsLiffLoggedIn(true)
          try {
            const profile = await liff.getProfile()
            setLineUserId(profile.userId)
            setLineDisplayName(profile.displayName)
            setLineIdToken(idToken)
            if (!providerError) reportReturn("session_found", true)
          } catch (profileError) {
            // プロフィール取得失敗（アクセストークン失効等）
            // ログアウトしてリセット（次回ユーザーが手動でログインできるように）
            try { liff.logout() } catch {}
            clearLiffIdentity()
            setLiffError("LINE情報の取得に失敗しました。再度ログインしてください。")
            if (!providerError) {
              reportReturn("session_missing", false)
              reportFailure("provider_error")
            }
          }
        }
      } else {
        clearLiffIdentity()
        if (!providerError) {
          reportReturn("session_missing", false)
          reportFailure("missing_session")
        }
      }

      setIsLiffReady(true)
    } catch (error) {
      clearLiffIdentity()
      // liff.init 自体が失敗（コールバック処理の失敗）。生のエラー文字列は分析へ送らない。
      reportReturn("unknown", false)
      reportFailure("callback_error")
      const msg = error instanceof Error ? error.message : String(error)
      const detail =
        error instanceof Error && "code" in error && typeof error.code === "string"
          ? ` (code: ${error.code})`
          : ""
      setLiffError(`${msg}${detail}`)
      setIsLiffReady(true)
    }
  }, [clearLiffIdentity])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // 旧実装で永続化していた本人情報は復元せず、起動時に削除する。
    clearLegacyLiffStorage()
    initLiff()
  }, [initLiff])

  // ユーザーが手動でLINEログインを開始する
  const loginLiff = () => {
    // 遷移処理を開始できない場合は計測しない（仕様: 開始できなかったら発火させない）
    if (!liffInstance) return

    // 遷移前にフラグを立てる。この直後の pagehide を「離脱」と数えないため。
    trackLineLoginRedirectStarted({ redirectMethod: detectRedirectMethod(liffInstance) })

    liffInstance.login({ redirectUri: window.location.href })
  }

  const retryLiff = () => {
    clearLiffIdentity()
    setLiffError(null)
    setIsLiffReady(false)
    initialized.current = false
    initLiff()
  }

  // LINEアプリ内ブラウザのときだけウィンドウを閉じてトークに戻す。通常ブラウザでは何もしない（呼び出し側でフォールバック表示）。
  const closeWindow = () => {
    try { liffInstance?.closeWindow?.() } catch {}
  }

  // サーバーがLINE認証を拒否(401)したとき等に呼び、「連携済み」の見た目をやめてログイン導線へ戻す
  const invalidateLineSession = useCallback(() => {
    try { liffInstance?.logout() } catch {}
    clearLiffIdentity()
  }, [clearLiffIdentity])

  // 予約送信の直前に呼ぶ。ページ表示後に時間が経つとIDトークンが失効している場合があるため、
  // その時点で有効なトークンだけを返す。期限切れならセッションを破棄して null（UIはログイン導線に戻る）。
  const getFreshLineIdToken = useCallback((): string | null => {
    if (!liffInstance) return null
    const idToken = readValidIdToken(liffInstance)
    if (!idToken) {
      invalidateLineSession()
      return null
    }
    return idToken
  }, [invalidateLineSession])

  return (
    <LiffContext.Provider value={{ lineUserId, lineDisplayName, lineIdToken, isLiffReady, isLiffLoggedIn, isInClient, liffError, loginLiff, retryLiff, closeWindow, getFreshLineIdToken, invalidateLineSession, consumeLineLoginReturn }}>
      {children}
    </LiffContext.Provider>
  )
}
