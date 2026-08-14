"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, AlertTriangle } from "lucide-react"
import { SENIOR_RESTRICTED_PLAN_IDS, getAdultAgeMax, getPrivateCounterpartName } from "@/lib/plan-flags"
import { getRentalUnitPrice, planOffersRentals } from "@/lib/rental-options"

interface ParticipantDetails {
  id: string
  name: string
  age: number | ""
  height: number | ""
  weight: number | ""
  footSize: number | ""
  category: "adult" | "child" | "under3"
  wetsuitRental: boolean
  prescriptionMaskRental: boolean
}

interface ParticipantFormProps {
  participants: ParticipantDetails[]
  minAge: number
  selectedPlan: string
  onUpdate: (id: string, field: keyof ParticipantDetails, value: any) => void
}

export function ParticipantForm({ participants, minAge, selectedPlan, onUpdate }: ParticipantFormProps) {
  if (participants.length === 0) return null

  // ナイトツアーかどうかを判定
  const isNightTour = selectedPlan === "S3" || selectedPlan === "S5"
  const showRentals = planOffersRentals(selectedPlan)
  const rentalUnitPrice = getRentalUnitPrice(selectedPlan)
  const rentalPriceLabel = rentalUnitPrice === 0
    ? "プラン料金に含む"
    : `+\u00a5${rentalUnitPrice.toLocaleString()}`
  // 60歳以上お断りのグループ版プランと、その案内先（貸切版）は plan-flags を単一ソースに参照
  const seniorCounterpartName = getPrivateCounterpartName(selectedPlan)
  // 対象年齢の上限もプランページの表記と同じ plan-flags から取る
  const adultAgeMax = getAdultAgeMax(selectedPlan)

  return (
    <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2 text-emerald-800">
          <User className="w-5 h-5" />
          参加者詳細情報
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          参加者名・身長・体重は分かる範囲で大丈夫です。年齢は安全確認、足のサイズはフィン準備のためご入力をお願いします。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {participants.map((participant, index) => {
          const categoryLabel =
            participant.category === "adult" ? "大人" : participant.category === "child" ? "子ども" : "3歳以下"
          const isOverSixty =
            SENIOR_RESTRICTED_PLAN_IDS.has(selectedPlan) && typeof participant.age === "number" && participant.age >= 60

          return (
            <div key={participant.id} className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-emerald-800 mb-4">
                参加者 {index + 1} ({categoryLabel})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor={`participant-${participant.id}-name`} className="text-sm font-medium text-gray-700 mb-2 block">氏名 (任意)</Label>
                  <Input
                    id={`participant-${participant.id}-name`}
                    value={participant.name}
                    onChange={(e) => onUpdate(participant.id, "name", e.target.value)}
                    placeholder="山田 太郎"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor={`participant-${participant.id}-age`} className="text-sm font-medium text-gray-700 mb-2 block">年齢 *</Label>
                  <Input
                    id={`participant-${participant.id}-age`}
                    type="number"
                    value={participant.age}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseInt(e.target.value)
                      onUpdate(participant.id, "age", value)
                    }}
                    min={participant.category === "under3" ? 0 : participant.category === "child" ? minAge : 13}
                    max={
                      participant.category === "under3"
                        ? 3
                        : participant.category === "child"
                          ? 12
                          : adultAgeMax
                    }
                    className={`rounded-xl focus:border-emerald-500 ${isOverSixty ? "border-red-400 focus:border-red-500" : "border-emerald-200"}`}
                    aria-invalid={isOverSixty || undefined}
                    required
                  />
                  {isOverSixty && (
                    <p className="mt-2 text-xs text-red-600 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        安全面を考慮し、60歳以上の方がいるグループは
                        <strong>{seniorCounterpartName}</strong>
                        をご予約ください。
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`participant-${participant.id}-height`} className="text-sm font-medium text-gray-700 mb-2 block">
                    身長 (cm) (任意)
                  </Label>
                  <Input
                    id={`participant-${participant.id}-height`}
                    type="number"
                    value={participant.height}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseInt(e.target.value)
                      onUpdate(participant.id, "height", value)
                    }}
                    min="50"
                    max="220"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor={`participant-${participant.id}-weight`} className="text-sm font-medium text-gray-700 mb-2 block">
                    体重 (kg) (任意)
                  </Label>
                  <Input
                    id={`participant-${participant.id}-weight`}
                    type="number"
                    value={participant.weight}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseInt(e.target.value)
                      onUpdate(participant.id, "weight", value)
                    }}
                    min="5"
                    max="150"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <Label htmlFor={`participant-${participant.id}-foot`} className="text-sm font-medium text-gray-700 mb-2 block">
                    足のサイズ (cm) {isNightTour ? "(任意)" : "*"}
                  </Label>
                  <Input
                    id={`participant-${participant.id}-foot`}
                    type="number"
                    step="0.5"
                    value={participant.footSize}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseFloat(e.target.value)
                      onUpdate(participant.id, "footSize", value)
                    }}
                    min="10"
                    max="35"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                    required={!isNightTour}
                  />
                </div>
              </div>

              {showRentals && (
                <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
                  <p className="mb-3 text-sm font-semibold text-cyan-900">レンタル希望</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`participant-${participant.id}-wetsuit`}
                        checked={participant.wetsuitRental === true}
                        onCheckedChange={(checked) =>
                          onUpdate(participant.id, "wetsuitRental", checked === true)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`participant-${participant.id}-wetsuit`}
                        className="cursor-pointer text-sm leading-relaxed text-gray-700"
                      >
                        ウェットスーツレンタル
                        <span className="ml-1 font-semibold text-cyan-700">（{rentalPriceLabel}）</span>
                      </Label>
                    </div>

                    {participant.category === "adult" ? (
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`participant-${participant.id}-prescription-mask`}
                          checked={participant.prescriptionMaskRental === true}
                          onCheckedChange={(checked) =>
                            onUpdate(participant.id, "prescriptionMaskRental", checked === true)
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`participant-${participant.id}-prescription-mask`}
                          className="cursor-pointer text-sm leading-relaxed text-gray-700"
                        >
                          度付きマスクレンタル
                          <span className="ml-1 font-semibold text-cyan-700">（{rentalPriceLabel}）</span>
                        </Label>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-amber-700">
                        ※度付きマスクは大人用のみで、子供用はありません。
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>ご注意:</strong>
            <br />
            {isNightTour ? (
              <>
                • 身長・体重・足のサイズは任意です
                <br />• ただし、より正確なご案内のため、ご入力いただくことをお勧めします
              </>
            ) : (
              <>
                • 足のサイズはフィン準備のため必須です
                <br />• 身長・体重は任意です（分かる範囲でご入力ください）
                <br />• 当日、大幅に異なる場合は器材の変更をお願いする場合があります
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
