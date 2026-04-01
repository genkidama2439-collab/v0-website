'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Participant } from '@/lib/hooks/useBookingForm'

interface ParticipantManagerProps {
  participants: Participant[]
  onAddParticipant: (category: Participant['category']) => void
  onRemoveParticipant: (id: string) => void
  onUpdateParticipant: (id: string, updates: Partial<Participant>) => void
  error?: string
}

export function ParticipantManager({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  error,
}: ParticipantManagerProps) {
  const categoryLabels: Record<Participant['category'], string> = {
    adult: '大人',
    child: '子供',
    under3: '3歳未満',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">参加者情報</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddParticipant('adult')}
          >
            大人を追加
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddParticipant('child')}
          >
            子供を追加
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddParticipant('under3')}
          >
            幼児を追加
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {participants.length === 0 ? (
        <p className="text-gray-500 italic">参加者を追加してください</p>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`participant-${participant.id}`} className="text-sm">
                  {categoryLabels[participant.category]}の名前
                </Label>
                <Input
                  id={`participant-${participant.id}`}
                  value={participant.name}
                  onChange={(e) => onUpdateParticipant(participant.id, { name: e.target.value })}
                  placeholder="参加者名"
                  size={30}
                />
              </div>

              {participant.category === 'child' && (
                <div className="w-20 space-y-2">
                  <Label htmlFor={`age-${participant.id}`} className="text-sm">
                    年齢
                  </Label>
                  <Input
                    id={`age-${participant.id}`}
                    type="number"
                    value={participant.age || ''}
                    onChange={(e) => onUpdateParticipant(participant.id, { age: parseInt(e.target.value) })}
                    min="0"
                    max="18"
                  />
                </div>
              )}

              <Badge variant="secondary">{categoryLabels[participant.category]}</Badge>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveParticipant(participant.id)}
                className="text-red-500 hover:text-red-700"
              >
                削除
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
