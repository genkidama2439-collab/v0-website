'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CustomerInfoProps {
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests: string
  errors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export function CustomerInfo({
  customerName,
  customerEmail,
  customerPhone,
  specialRequests,
  errors,
  onChange,
}: CustomerInfoProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">お客様情報</h3>

      <div className="space-y-2">
        <Label htmlFor="customerName">氏名 *</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => onChange('customerName', e.target.value)}
          placeholder="山田太郎"
          className={errors.customerName ? 'border-red-500' : ''}
        />
        {errors.customerName && <p className="text-sm text-red-500">{errors.customerName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerEmail">メールアドレス *</Label>
        <Input
          id="customerEmail"
          type="email"
          value={customerEmail}
          onChange={(e) => onChange('customerEmail', e.target.value)}
          placeholder="example@mail.com"
          className={errors.customerEmail ? 'border-red-500' : ''}
        />
        {errors.customerEmail && <p className="text-sm text-red-500">{errors.customerEmail}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerPhone">電話番号 *</Label>
        <Input
          id="customerPhone"
          value={customerPhone}
          onChange={(e) => onChange('customerPhone', e.target.value)}
          placeholder="090-1234-5678"
          className={errors.customerPhone ? 'border-red-500' : ''}
        />
        {errors.customerPhone && <p className="text-sm text-red-500">{errors.customerPhone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">特別なご要望（オプション）</Label>
        <Textarea
          id="specialRequests"
          value={specialRequests}
          onChange={(e) => onChange('specialRequests', e.target.value)}
          placeholder="アレルギーやご要望があればお知らせください"
          rows={3}
        />
      </div>
    </div>
  )
}
