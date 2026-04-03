"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function WelcomeAnimation() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<"initial" | "text" | "reveal" | "complete" | "done">("initial")
  
  // Only show animation on home page
  const isHomePage = pathname === "/"

  const completeAnimation = useCallback(() => {
    setPhase("done")
  }, [])

  useEffect(() => {
    const textTimer = setTimeout(() => {
      setPhase("text")
    }, 800)

    const revealTimer = setTimeout(() => {
      setPhase("reveal")
    }, 3500)

    const completeTimer = setTimeout(() => {
      setPhase("complete")
    }, 5500)

    const doneTimer = setTimeout(completeAnimation, 6500)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(revealTimer)
      clearTimeout(completeTimer)
      clearTimeout(doneTimer)
    }
  }, [completeAnimation])

  // Don't show animation on non-home pages or when done
  if (!isHomePage || phase === "done") return null

  const phrase1 = "海を敬い、"
  const phrase2 = "海と遊ぶ。"
  const allCharacters = (phrase1 + phrase2).split("")

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
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
        </motion.div>

        {/* Layer 4: Centered text content with premium typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-[10%]" style={{ zIndex: 40 }}>
          <div className="overflow-hidden text-center">
            <motion.h1
              className="font-serif font-light text-[#f5f5f5] leading-relaxed"
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "clamp(32px, 8vw, 64px)",
                letterSpacing: "0.15em",
                textWrap: "balance",
              }}
            >
              {allCharacters.map((char, index) => {
                // Determine which phrase this character belongs to
                const isPhrase1 = index < phrase1.length
                const charDelay = index * 0.08

                return (
                  <motion.span
                    key={`char-${index}-${char}`}
                    initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
                    animate={{
                      opacity: phase !== "initial" ? 1 : 0,
                      filter: phase !== "initial" ? "blur(0px)" : "blur(12px)",
                      y: phase !== "initial" ? 0 : 20,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: charDelay,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="inline-block"
                    style={{
                      whiteSpace: char === "、" || char === "。" ? "normal" : "nowrap",
                      textShadow: phase === "reveal" || phase === "complete" ? "0 2px 20px rgba(0,0,0,0.5)" : "none",
                    }}
                  >
                    {char}
                  </motion.span>
                )
              })}
            </motion.h1>
          </div>

          <motion.div
            className="mt-[clamp(24px,6vw,48px)] flex items-center gap-4 sm:gap-6"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: phase !== "initial" ? 0.6 : 0,
              scaleX: phase !== "initial" ? 1 : 0,
            }}
            transition={{ duration: 1.2, delay: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="h-px w-[clamp(48px,12vw,96px)] bg-white/60" />
            <span
              className="text-white/60 tracking-[0.4em] uppercase font-light"
              style={{
                fontSize: "clamp(8px, 2vw, 14px)",
              }}
            >
              Miyakojima
            </span>
            <span className="h-px w-[clamp(48px,12vw,96px)] bg-white/60" />
          </motion.div>

          {/* Brand name - appears after reveal */}
          <motion.div
            className="mt-[clamp(16px,4vw,32px)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: phase === "reveal" || phase === "complete" ? 1 : 0,
              y: phase === "reveal" || phase === "complete" ? 0 : 30,
            }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p
              className="text-white/80 tracking-[0.3em] font-light"
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "clamp(16px, 4vw, 28px)",
              }}
            >
              海亀兄弟
            </p>
          </motion.div>
        </div>

        {/* Layer 5: Scroll indicator - appears last */}
        <motion.div
          className="absolute bottom-[clamp(24px,6vw,48px)] left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ zIndex: 50 }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === "complete" ? 1 : 0,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span
            className="text-white/40 tracking-[0.3em] uppercase mb-2"
            style={{
              fontSize: "clamp(10px, 1.5vw, 11px)",
            }}
          >
            Scroll
          </span>
          <motion.div
            className="w-px bg-gradient-to-b from-white/40 to-transparent"
            style={{
              height: "clamp(20px, 5vw, 40px)",
            }}
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
