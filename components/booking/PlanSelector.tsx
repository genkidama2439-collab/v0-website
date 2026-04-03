'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlanSelectorProps {
  selectedPlan: string
  onSelectPlan: (planId: string, planName: string) => void
  plans: Array<{ id: string; name: string; price: number }>
}

export function PlanSelector({ selectedPlan, onSelectPlan, plans }: PlanSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">プランを選択</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'ring-2 ring-green-500 bg-green-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => onSelectPlan(plan.id, plan.name)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{plan.name}</h4>
                  <p className="text-sm text-gray-600">¥{plan.price.toLocaleString()}</p>
                </div>
                {selectedPlan === plan.id && <Badge>選択中</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
