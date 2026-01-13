"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function WelcomeAnimation() {
  const [phase, setPhase] = useState<"initial" | "text" | "reveal" | "complete" | "done">("initial")

  const completeAnimation = useCallback(() => {
    console.log("[v0] Animation complete, setting phase to done")
    setPhase("done")
  }, [])

  useEffect(() => {
    // Phase 1: Text appears (after 800ms of silence)
    const textTimer = setTimeout(() => {
      console.log("[v0] Phase: text")
      setPhase("text")
    }, 800)

    // Phase 2: Background reveal (1.5s after text)
    const revealTimer = setTimeout(() => {
      console.log("[v0] Phase: reveal")
      setPhase("reveal")
    }, 3500)

    // Phase 3: Complete (transition to site)
    const completeTimer = setTimeout(() => {
      console.log("[v0] Phase: complete")
      setPhase("complete")
    }, 5500)

    // Phase 4: Done (remove overlay)
    const doneTimer = setTimeout(completeAnimation, 6500)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(revealTimer)
      clearTimeout(completeTimer)
      clearTimeout(doneTimer)
    }
  }, [completeAnimation])

  console.log("[v0] Current phase:", phase)

  if (phase === "done") return null

  // キャッチコピーの文字を分割
  const catchphrase = "宮古島の海を、独り占めする。"
  const characters = catchphrase.split("")

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "complete" ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        {/* Layer 1: Deep navy background (initial state) */}
        <motion.div
          className="absolute inset-0 bg-[#001a1a]"
          initial={{ opacity: 1 }}
          animate={{
            opacity: phase === "reveal" || phase === "complete" ? 0 : 1,
          }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ zIndex: 30 }}
        />

        {/* Layer 2: Curtain effect - Top */}
        <motion.div
          className="absolute inset-x-0 top-0 h-1/2 bg-[#001a1a] origin-top"
          initial={{ scaleY: 1 }}
          animate={{
            scaleY: phase === "reveal" || phase === "complete" ? 0 : 1,
          }}
          transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          style={{ zIndex: 25 }}
        />

        {/* Layer 2: Curtain effect - Bottom */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[#001a1a] origin-bottom"
          initial={{ scaleY: 1 }}
          animate={{
            scaleY: phase === "reveal" || phase === "complete" ? 0 : 1,
          }}
          transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          style={{ zIndex: 25 }}
        />

        {/* Layer 3: Background image with zoom effect */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{
            scale: phase === "reveal" || phase === "complete" ? 1 : 1.3,
            opacity: phase === "reveal" || phase === "complete" ? 1 : 0,
          }}
          transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ zIndex: 10 }}
        >
          <Image
            src="/images/gemini-generated-image-rq969urq969urq96.jpeg"
            alt="宮古島の海"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Subtle overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
        </motion.div>

        {/* Layer 4: Centered text content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 40 }}>
          {/* Main catchphrase with character-by-character animation */}
          <div className="overflow-hidden px-4">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-light tracking-[0.15em] text-white text-center leading-relaxed"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              {characters.map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
                  animate={{
                    opacity: phase !== "initial" ? 1 : 0,
                    filter: phase !== "initial" ? "blur(0px)" : "blur(12px)",
                    y: phase !== "initial" ? 0 : 20,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="inline-block"
                  style={{
                    textShadow: phase === "reveal" || phase === "complete" ? "0 2px 20px rgba(0,0,0,0.5)" : "none",
                  }}
                >
                  {char === "、" || char === "。" ? char : char}
                </motion.span>
              ))}
            </motion.h1>
          </div>

          {/* Subtle decorative line */}
          <motion.div
            className="mt-8 sm:mt-12 flex items-center gap-4"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: phase !== "initial" ? 0.6 : 0,
              scaleX: phase !== "initial" ? 1 : 0,
            }}
            transition={{ duration: 1.2, delay: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="h-px w-16 sm:w-24 bg-white/60" />
            <span className="text-white/60 text-[10px] sm:text-xs tracking-[0.4em] uppercase font-light">
              Miyakojima
            </span>
            <span className="h-px w-16 sm:w-24 bg-white/60" />
          </motion.div>

          {/* Brand name - appears after reveal */}
          <motion.div
            className="mt-6 sm:mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: phase === "reveal" || phase === "complete" ? 1 : 0,
              y: phase === "reveal" || phase === "complete" ? 0 : 30,
            }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-white/80 text-lg sm:text-xl md:text-2xl tracking-[0.3em] font-light">海亀兄弟</p>
          </motion.div>
        </div>

        {/* Layer 5: Scroll indicator - appears last */}
        <motion.div
          className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ zIndex: 50 }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === "complete" ? 1 : 0,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-3">Scroll</span>
          <motion.div
            className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
