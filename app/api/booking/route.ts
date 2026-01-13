import { NextResponse } from "next/server"

function generateBookingNumber(date: string): string {
  const dateStr = date.replace(/-/g, "")
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `#KAI-${dateStr}-${randomStr}`
}

export async function POST(request: Request) {
  try {
    const bookingData = await request.json()

    const bookingNumber = generateBookingNumber(bookingData.selectedDate)

    const adultCount = bookingData.participants.filter((p: any) => p.category === "adult").length
    const childCount = bookingData.participants.filter((p: any) => p.category === "child").length
    const under3Count = bookingData.participants.filter((p: any) => p.category === "under3").length

    const gasPayload = {
      bookingNumber,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      planName: bookingData.planName,
      selectedDate: bookingData.selectedDate,
      selectedTime: bookingData.selectedTime || "サンセット時刻（後日連絡）",
      participants: bookingData.participants,
      adultCount,
      childCount,
      under3Count,
      totalPrice: bookingData.totalPrice,
      staffName: bookingData.staffName,
      specialRequests: bookingData.specialRequests,
    }

    const gasUrl =
      "https://script.google.com/macros/s/AKfycbzbqUzjz4utNEQoZQLeqWuf2r64AXPsOQKF9_-QDdeYGT8fL89n7Gf36c8Z2dJj802vtg/exec"

    const response = await fetch(gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gasPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] GAS error:", errorText)
      return NextResponse.json(
        { error: `メール送信に失敗しました: ${response.status} ${response.statusText}` },
        { status: 500 },
      )
    }

    const result = await response.json()

    return NextResponse.json({ success: true, bookingNumber })
  } catch (error) {
    console.error("[v0] Booking API error:", error)
    const errorMessage = error instanceof Error ? error.message : "不明なエラー"
    return NextResponse.json({ error: `予約処理中にエラーが発生しました: ${errorMessage}` }, { status: 500 })
  }
}
