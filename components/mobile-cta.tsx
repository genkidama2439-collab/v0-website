"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageSquare, Calendar } from "lucide-react"

export function MobileCTA() {
  const pathname = usePathname()
  const isBookingPage = pathname === "/book"

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white/98 backdrop-blur-xl border-t border-emerald-200/50 px-4 py-4 shadow-lg">
        <div className="flex space-x-4">
          <Button
            variant="outline"
            size="lg"
            className={`${isBookingPage ? "w-full" : "flex-1"} border-green-300 text-green-700 hover:bg-green-50 bg-white/80 font-semibold`}
            onClick={() => window.open("https://lin.ee/jfp4laz", "_blank")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            LINEで質問
          </Button>
          {!isBookingPage && (
            <Button
              asChild
              size="lg"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
            >
              <Link href="/book">
                <Calendar className="w-4 h-4 mr-2" />
                予約
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
