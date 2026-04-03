'use client'

import { useState, useCallback } from 'react'
import { validateEmail, validatePhoneNumber, validateParticipants } from '@/lib/utils/validation'
import { calculatePrice, formatDate } from '@/lib/utils/calculations'
import { BOOKING_CONFIG, ERROR_MESSAGES } from '@/lib/constants/booking'

export interface Participant {
  id: string
  category: 'adult' | 'child' | 'under3'
  name: string
  age?: number
}

export interface BookingFormData {
  selectedDate: string
  selectedTime: string
  participants: Participant[]
  planId: string
  planName: string
  totalPrice: number
  customerName: string
  customerEmail: string
  customerPhone: string
  staffName?: string
  specialRequests?: string
}

export const useBookingForm = () => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    participants: [],
    selectedDate: '',
    selectedTime: '',
    planId: '',
    planName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // フォーム入力を更新
  const updateField = useCallback((field: keyof BookingFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // エラークリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  // 参加者を追加
  const addParticipant = useCallback((category: Participant['category']) => {
    if ((formData.participants?.length ?? 0) >= BOOKING_CONFIG.MAX_PARTICIPANTS) {
      setErrors((prev) => ({
        ...prev,
        participants: `参加者は${BOOKING_CONFIG.MAX_PARTICIPANTS}名までです`,
      }))
      return
    }

    const newParticipant: Participant = {
      id: `participant-${Date.now()}`,
      category,
      name: '',
      age: category === 'child' ? 10 : undefined,
    }

    setFormData((prev) => ({
      ...prev,
      participants: [...(prev.participants || []), newParticipant],
    }))
  }, [formData.participants?.length])

  // 参加者を削除
  const removeParticipant = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: (prev.participants || []).filter((p) => p.id !== id),
    }))
  }, [])

  // 参加者情報を更新
  const updateParticipant = useCallback((id: string, updates: Partial<Participant>) => {
    setFormData((prev) => ({
      ...prev,
      participants: (prev.participants || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }))
  }, [])

  // フォーム検証
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.selectedDate) newErrors.selectedDate = '日付を選択してください'
    if (!formData.selectedTime) newErrors.selectedTime = '時刻を選択してください'
    if (!formData.planId) newErrors.planId = 'プランを選択してください'
    if (!formData.customerName) newErrors.customerName = '氏名を入力してください'

    const emailValidation = validateEmail(formData.customerEmail || '')
    if (!emailValidation.valid) newErrors.customerEmail = emailValidation.error || 'メールアドレスが不正です'

    const phoneValidation = validatePhoneNumber(formData.customerPhone || '')
    if (!phoneValidation.valid) newErrors.customerPhone = phoneValidation.error || '電話番号が不正です'

    const participantValidation = validateParticipants(formData.participants?.length ?? 0)
    if (!participantValidation.valid) newErrors.participants = participantValidation.error

    if ((formData.participants?.length ?? 0) === 0) {
      newErrors.participants = '参加者を追加してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // フォームをリセット
  const resetForm = useCallback(() => {
    setFormData({
      participants: [],
      selectedDate: '',
      selectedTime: '',
      planId: '',
      planName: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      specialRequests: '',
    })
    setErrors({})
  }, [])

  // 料金を計算
  const calculateTotalPrice = useCallback((planId: string, planPrices: Record<string, number>) => {
    return calculatePrice(planId, formData.participants?.length ?? 0, planPrices)
  }, [formData.participants?.length])

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateField,
    addParticipant,
    removeParticipant,
    updateParticipant,
    validateForm,
    resetForm,
    calculateTotalPrice,
  }
}
