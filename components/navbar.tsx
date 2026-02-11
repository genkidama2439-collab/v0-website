"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, MessageSquare } from "lucide-react"
import { TurtleLogo } from "./TurtleLogo"

const LINE_URL = "https://lin.ee/jfp4laz"

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/staff", label: "スタッフ" },
  { href: "/gallery", label: "ギャラリー" },
  { href: "/blog", label: "ブログ" },
  { href: "/faq", label: "よくある質問" },
] as const

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const handleLineClick = () => window.open(LINE_URL, "_blank")
  const closeMenu = () => setIsOpen(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
              <TurtleLogo size={32} className="sm:w-10 sm:h-10" />
            </div>
            <span className="font-bold text-lg sm:text-xl text-emerald-800 whitespace-nowrap">海亀兄弟</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
              onClick={handleLineClick}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              LINEで質問
            </Button>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6">
              <Link href="/book">今すぐ予約</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex-shrink-0 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="メニュー"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-xl rounded-lg mt-2 border border-emerald-100">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile CTA Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
                  onClick={handleLineClick}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  LINEで質問
                </Button>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  <Link href="/book">今すぐ予約</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export { Navbar }
