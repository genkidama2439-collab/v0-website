import { NextResponse } from "next/server"

function generateBookingNumber(date: string): string {
  const dateStr = date.replace(/-/g, "") // 2026-01-14 -> 20260114
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let randomStr = ""
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
  }
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
      "https://script.google.com/macros/s/AKfycbz0ltHt_0WcQVw-KUD4iG5yvH32RGYgXkO6ajVjafiPtdRAK1rloQj7rmiXmk3o_Pte/exec"

    console.log("[v0] Sending booking to GAS:", { bookingNumber, gasUrl })

    const response = await fetch(gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gasPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] GAS response error:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      })
      return NextResponse.json({ error: "送信失敗" }, { status: 500 })
    }

    const result = await response.json()
    console.log("[v0] GAS response success:", result)

    return NextResponse.json({ success: true, bookingNumber })
  } catch (error) {
    console.error("[v0] Booking API error:", error)
    return NextResponse.json({ error: "送信失敗" }, { status: 500 })
  }
}
