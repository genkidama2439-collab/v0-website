"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, AlertTriangle } from "lucide-react"

interface ParticipantDetails {
  id: string
  name: string
  age: number | ""
  height: number | ""
  weight: number | ""
  footSize: number | ""
  category: "adult" | "child" | "under3"
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
  const isNightTour = selectedPlan === "night-hunter" || selectedPlan === "S3"

  return (
    <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <User className="w-5 h-5" />
          参加者詳細情報
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          器材のサイズ調整や安全管理のため、参加者全員の詳細情報をご入力ください。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {participants.map((participant, index) => {
          const categoryLabel =
            participant.category === "adult" ? "大人" : participant.category === "child" ? "子ども" : "3歳未満"
          const isOverSixty =
            selectedPlan === "S1" && typeof participant.age === "number" && participant.age >= 60

          return (
            <div key={participant.id} className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-semibold text-emerald-800 mb-4">
                参加者 {index + 1} ({categoryLabel})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">氏名 *</Label>
                  <Input
                    value={participant.name}
                    onChange={(e) => onUpdate(participant.id, "name", e.target.value)}
                    placeholder="山田 太郎"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">年齢 *</Label>
                  <Input
                    type="number"
                    value={participant.age}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseInt(e.target.value)
                      onUpdate(participant.id, "age", value)
                    }}
                    min={participant.category === "under3" ? 0 : participant.category === "child" ? minAge : 13}
                    max={participant.category === "under3" ? 2 : participant.category === "child" ? 12 : 100}
                    className={`rounded-xl focus:border-emerald-500 ${isOverSixty ? "border-red-400 focus:border-red-500" : "border-emerald-200"}`}
                    aria-invalid={isOverSixty || undefined}
                    required
                  />
                  {isOverSixty && (
                    <p className="mt-2 text-xs text-red-600 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        安全面を考慮し、60歳以上の方がいるグループは
                        <strong>【貸切】ウミガメシュノーケルツアー</strong>
                        をご予約ください。
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    身長 (cm) {isNightTour ? "(任意)" : "*"}
                  </Label>
                  <Input
                    type="number"
                    value={participant.height}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseInt(e.target.value)
                      onUpdate(participant.id, "height", value)
                    }}
                    min="50"
                    max="220"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                    required={!isNightTour}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    体重 (kg) {isNightTour ? "(任意)" : "*"}
                  </Label>
                  <Input
                    type="number"
                    value={participant.weight}
                    onChange={(e) => {
                      const value = e.target.value === "" ? "" : Number.parseInt(e.target.value)
                      onUpdate(participant.id, "weight", value)
                    }}
                    min="5"
                    max="150"
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                    required={!isNightTour}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    足のサイズ (cm) {isNightTour ? "(任意)" : "*"}
                  </Label>
                  <Input
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
                • 身長・体重・足のサイズは器材選定のために必要です
                <br />• 安全のため、正確な情報をご入力ください
                <br />• 当日、大幅に異なる場合は器材の変更をお願いする場合があります
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
