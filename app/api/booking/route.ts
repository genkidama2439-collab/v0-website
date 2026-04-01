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
    let bookingData
    try {
      bookingData = await request.json()
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      return NextResponse.json(
        { error: "リクエストの形式が正しくありません", details: "JSON パースエラー" },
        { status: 400 }
      )
    }

    // リクエストデータの検証
    if (!bookingData.selectedDate || !bookingData.customerName || !bookingData.customerEmail) {
      console.error("[v0] Missing required fields:", {
        selectedDate: !!bookingData.selectedDate,
        customerName: !!bookingData.customerName,
        customerEmail: !!bookingData.customerEmail,
      })
      return NextResponse.json(
        { error: "必須項目が不足しています", details: "selectedDate, customerName, customerEmail は必須です" },
        { status: 400 }
      )
    }

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

    // GAS URLを環境変数から取得、未設定の場合はデフォルトを使用
    const gasUrl =
      process.env.GAS_BOOKING_URL ||
      "https://script.google.com/macros/s/AKfycbz0ltHt_0WcQVw-KUD4iG5yvH32RGYgXkO6ajVjafiPtdRAK1rloQj7rmiXmk3o_Pte/exec"

    console.log("[v0] Using GAS URL:", gasUrl.substring(0, 60) + "...")

    let response
    try {
      response = await fetch(gasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gasPayload),
      })
    } catch (fetchError) {
      console.error("[v0] Network error while calling GAS:", fetchError)
      return NextResponse.json(
        {
          error: "ネットワークエラーが発生しました",
          details: fetchError instanceof Error ? fetchError.message : "不明なエラー",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
      } catch {
        errorText = "レスポンステキスト取得失敗"
      }

      console.error("[v0] GAS response error:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 200),
        gasUrl: gasUrl.substring(0, 50) + "...",
      })

      return NextResponse.json(
        {
          error: "GAS処理でエラーが発生しました",
          details: `ステータス: ${response.status} ${response.statusText}`,
          gasResponse: errorText.substring(0, 200),
          timestamp: new Date().toISOString(),
        },
        { status: response.status >= 500 ? 502 : 500 }
      )
    }

    let result
    try {
      result = await response.json()
    } catch (parseError) {
      console.error("[v0] GAS JSON parse error:", parseError)
      console.error("[v0] GAS response body:", await response.text())
      return NextResponse.json(
        {
          error: "GASレスポンスのパースに失敗しました",
          details: "GASからの応答が正しいJSON形式ではありません",
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      )
    }

    console.log("[v0] GAS response success:", { bookingNumber, result })

    return NextResponse.json({ success: true, bookingNumber })
  } catch (error) {
    console.error("[v0] Booking API error:", error)
    const errorMessage = error instanceof Error ? error.message : "不明なエラー"
    return NextResponse.json(
      {
        error: "予約処理中にエラーが発生しました",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
