const STORAGE_PREFIX = "booking-submission-v1"
const SUBMISSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface StoredSubmission {
  fingerprint: string
  submissionId: string
}

const memorySubmissions = new Map<string, StoredSubmission>()

const createSubmissionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  // 古いWebView向けのフォールバック。ID自体は認証には使わず、重複防止だけに使う。
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === "x" ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

const fallbackFingerprint = (value: string): string => {
  // crypto.subtle がない古いWebViewでも、同じ入力かどうかは判定できるようにする。
  let first = 2166136261
  let second = 2246822507

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    first = Math.imul(first ^ code, 16777619)
    second = Math.imul(second ^ code, 3266489917)
  }

  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`
}

const fingerprintPayload = async (payload: unknown): Promise<string> => {
  const serialized = JSON.stringify(payload)

  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const bytes = new TextEncoder().encode(serialized)
      const digest = await crypto.subtle.digest("SHA-256", bytes)
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
    }
  } catch {
    // 制限されたWebViewでは同期フォールバックを使う。
  }

  return fallbackFingerprint(serialized)
}

const storageKey = (scope: string): string => `${STORAGE_PREFIX}:${scope}`

const readStoredSubmission = (scope: string): StoredSubmission | null => {
  const memoryValue = memorySubmissions.get(scope)
  if (memoryValue) return memoryValue

  try {
    const raw = window.sessionStorage.getItem(storageKey(scope))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredSubmission>
    if (
      typeof parsed.fingerprint !== "string" ||
      typeof parsed.submissionId !== "string" ||
      !SUBMISSION_ID_PATTERN.test(parsed.submissionId)
    ) {
      return null
    }
    const stored = { fingerprint: parsed.fingerprint, submissionId: parsed.submissionId }
    memorySubmissions.set(scope, stored)
    return stored
  } catch {
    return null
  }
}

const writeStoredSubmission = (scope: string, value: StoredSubmission): void => {
  memorySubmissions.set(scope, value)
  try {
    window.sessionStorage.setItem(storageKey(scope), JSON.stringify(value))
  } catch {
    // sessionStorageが使えなくても、同じページ内の再送はメモリで保護する。
  }
}

/**
 * 同じ入力内容の再送には同じIDを返す。
 * 入力が変わった場合だけ新しいIDへ切り替えるため、保存済み予約を誤って別内容で再利用しない。
 */
export const getOrCreateBookingSubmissionId = async (
  scope: string,
  payload: unknown,
): Promise<string> => {
  const fingerprint = await fingerprintPayload(payload)
  const stored = readStoredSubmission(scope)

  if (stored?.fingerprint === fingerprint) return stored.submissionId

  const next = { fingerprint, submissionId: createSubmissionId() }
  writeStoredSubmission(scope, next)
  return next.submissionId
}

export const clearBookingSubmissionId = (scope: string): void => {
  memorySubmissions.delete(scope)
  try {
    window.sessionStorage.removeItem(storageKey(scope))
  } catch {}
}
