"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function WelcomeAnimation() {
  const [phase, setPhase] = useState<"initial" | "reveal" | "fadeout" | "done">("initial")

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem("welcomeAnimationSeen")

    if (!hasSeenAnimation) {
      // Start reveal phase
      setTimeout(() => setPhase("reveal"), 100)

      // Start fadeout
      setTimeout(() => setPhase("fadeout"), 3000)

      // Complete
      setTimeout(() => {
        setPhase("done")
        sessionStorage.setItem("welcomeAnimationSeen", "true")
      }, 3800)
    } else {
      setPhase("done")
    }
  }, [])

  if (phase === "done") return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ease-out ${
        phase === "fadeout" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background with gradient and subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a2540] via-[#0d3a5c] to-[#0a4d68]">
        {/* Animated light rays */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full opacity-10"
              style={{
                left: `${15 + i * 18}%`,
                width: "2px",
                background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                animation: `lightRay ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo mark with glow effect */}
        <div
          className={`relative mb-8 transition-all duration-1000 ease-out ${
            phase === "reveal" ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-90"
          }`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl bg-emerald-400/30 rounded-full scale-150" />

          {/* Sea turtle image */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <Image
              src="/images/gemini-generated-image-rq969urq969urq96.jpeg"
              alt="Sea Turtles"
              fill
              className="object-cover rounded-full border-4 border-white/20 shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Brand name with elegant typography */}
        <div
          className={`text-center transition-all duration-1000 delay-300 ease-out ${
            phase === "reveal" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-[0.2em] text-white mb-3">海亀兄弟</h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/50" />
            <span className="text-white/60 text-xs sm:text-sm tracking-[0.3em] uppercase">Life in the Blue</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/50" />
          </div>
        </div>

        {/* Tagline */}
        <p
          className={`text-white/70 text-sm sm:text-base tracking-wider mt-2 transition-all duration-1000 delay-500 ease-out ${
            phase === "reveal" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          宮古島で、特別な海の体験を
        </p>

        {/* Loading indicator */}
        <div
          className={`mt-12 transition-all duration-700 delay-700 ${phase === "reveal" ? "opacity-100" : "opacity-0"}`}
        >
          <div className="relative w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
              style={{
                animation: "loadingBar 2.5s ease-in-out forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes lightRay {
          0%, 100% {
            opacity: 0.05;
            transform: translateY(-100%);
          }
          50% {
            opacity: 0.15;
            transform: translateY(100%);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }
        @keyframes loadingBar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
