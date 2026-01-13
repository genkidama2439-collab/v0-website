"use client"

import { useState, useEffect } from "react"
import { TurtleLogo } from "./TurtleLogo"

export function WelcomeAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Check if user has already seen the animation in this session
    const hasSeenAnimation = sessionStorage.getItem("welcomeAnimationSeen")

    if (!hasSeenAnimation) {
      setShouldRender(true)
      // Show animation after a brief delay
      setTimeout(() => setIsVisible(true), 100)

      // Hide animation after 2.5 seconds
      setTimeout(() => setIsVisible(false), 2500)

      // Remove from DOM after fade out completes
      setTimeout(() => {
        setShouldRender(false)
        sessionStorage.setItem("welcomeAnimationSeen", "true")
      }, 3000)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-[100] bg-gradient-to-b from-emerald-50 to-sky-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
        {/* Turtle Logo with animation */}
        <div className="animate-bounce">
          <TurtleLogo size={80} className="text-emerald-600" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-800 animate-in slide-in-from-bottom-4 duration-700 delay-200">
            海亀兄弟
          </h1>
          <p className="text-emerald-600 text-sm sm:text-base animate-in slide-in-from-bottom-4 duration-700 delay-300">
            宮古島の海へようこそ
          </p>
        </div>

        {/* Wave animation effect */}
        <div className="flex space-x-1 animate-in fade-in duration-700 delay-500">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-400"
              style={{
                animation: `wave 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%,
          60%,
          100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}
