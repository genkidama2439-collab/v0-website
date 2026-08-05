export type BookingParticipantCategory = "adult" | "child" | "under3"

export type BookingParticipantRuleInput = {
  category: string
  age?: number | ""
}

export type BookingRuleIssue =
  | { code: "ADULT_REQUIRED" }
  | { code: "MAX_PARTICIPANTS"; maxParticipants: number }
  | { code: "TERMS_REQUIRED" }

// 画面で「11名以上はLINE相談」と明記しているプラン。
// フォームとAPIが同じ上限を使うため、ここを単一ソースにする。
export const PLAN_MAX_PARTICIPANTS: Readonly<Record<string, number>> = {
  S2: 10,
  S4: 10,
  S7: 10,
  C2: 10,
  C4: 10,
  C6: 10,
}

export function getPlanMaxParticipants(planId: string | null | undefined): number | undefined {
  return planId ? PLAN_MAX_PARTICIPANTS[planId] : undefined
}

export function validateBookingRules({
  planId,
  participants,
  agreedToTerms,
}: {
  planId: string
  participants: BookingParticipantRuleInput[]
  agreedToTerms: unknown
}): BookingRuleIssue | null {
  if (!participants.some((participant) => participant.category === "adult")) {
    return { code: "ADULT_REQUIRED" }
  }

  const maxParticipants = getPlanMaxParticipants(planId)
  if (maxParticipants !== undefined && participants.length > maxParticipants) {
    return { code: "MAX_PARTICIPANTS", maxParticipants }
  }

  if (agreedToTerms !== true) {
    return { code: "TERMS_REQUIRED" }
  }

  return null
}
