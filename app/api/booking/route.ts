import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const participantRows = bookingData.participants
      .map((p: any, index: number) => {
        return `参加者${index + 1}\t${p.age}\t${p.height}\t${p.weight}\t${p.footSize}\t-`
      })
      .join("\n")

    const emailText = `予約番号\t${bookingNumber}
お名前\t${bookingData.customerName}
メール\t${bookingData.customerEmail}
電話番号\t${bookingData.customerPhone}

プラン\t${bookingData.planName}
参加日\t${bookingData.selectedDate}
時間帯\t${bookingData.selectedTime || "サンセット時刻（後日連絡）"}
人数\t${adultCount + childCount + under3Count}名（大人 ${adultCount} / 子ども ${childCount} / 幼児 ${under3Count}）
${bookingData.staffName && bookingData.staffName !== "指名なし" ? `スタッフ指名\t${bookingData.staffName}（+¥5,000）\n` : ""}
👥 参加者詳細
氏名\t年齢\t身長(cm)\t体重(kg)\t足サイズ(cm)\t料金
${participantRows}

合計\t¥${bookingData.totalPrice.toLocaleString()}
${bookingData.specialRequests ? `\n特記事項\t${bookingData.specialRequests}` : ""}`

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      subject: `【仮予約】${bookingData.selectedDate} ${bookingData.planName} - ${bookingData.customerName}様`,
      text: emailText,
    })

    if (error) {
      console.error("[v0] Email send error:", error)
      return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, bookingNumber })
  } catch (error) {
    console.error("[v0] Booking API error:", error)
    return NextResponse.json({ error: "予約処理中にエラーが発生しました" }, { status: 500 })
  }
}
