"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function WelcomeAnimation() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 99>(0)
  const isHomePage = pathname === "/"

  useEffect(() => {
    if (!isHomePage) { setPhase(99); return }
    // Only play once per session
    if (typeof window !== "undefined" && sessionStorage.getItem("welcome-seen")) {
      setPhase(99)
      return
    }
    const t = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3200),
      setTimeout(() => setPhase(4), 4800),
      setTimeout(() => setPhase(5), 5800),
      setTimeout(() => setPhase(6), 6400),
      setTimeout(() => {
        setPhase(99)
        sessionStorage.setItem("welcome-seen", "1")
      }, 7200),
    ]
    return () => t.forEach(clearTimeout)
  }, [isHomePage])

  if (!isHomePage || phase === 99) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-[#020a06]"
        animate={{ opacity: phase >= 6 ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* ===== Deep ocean ambient ===== */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Slow morphing underwater light caustics */}
          <motion.div
            className="absolute inset-[-50%]"
            style={{
              background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(16,185,129,0.06) 60deg, transparent 120deg, rgba(6,182,212,0.04) 180deg, transparent 240deg, rgba(52,211,153,0.05) 300deg, transparent 360deg)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Breathing light pulse */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "60vmax",
              height: "60vmax",
              background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* ===== Phase 1: Depth counter / sonar ping ===== */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
          {/* Sonar rings */}
          <AnimatePresence>
            {phase >= 1 && phase < 5 && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={`ring-${i}`}
                    className="absolute rounded-full border border-emerald-400/20"
                    initial={{ width: 0, height: 0, opacity: 0.4 }}
                    animate={{
                      width: [0, 300 + i * 100],
                      height: [0, 300 + i * 100],
                      opacity: [0.3, 0],
                    }}
                    transition={{
                      duration: 3,
                      delay: i * 0.8,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Center dot */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-emerald-400"
            initial={{ scale: 0 }}
            animate={{
              scale: phase >= 1 && phase < 4 ? [1, 1.5, 1] : 0,
              opacity: phase >= 1 && phase < 4 ? [0.8, 1, 0.8] : 0,
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.3 },
            }}
            style={{ boxShadow: "0 0 20px rgba(16,185,129,0.6), 0 0 60px rgba(16,185,129,0.2)" }}
          />
        </div>

        {/* ===== Phase 1: Location coordinates ===== */}
        <motion.div
          className="absolute top-8 left-6 sm:top-12 sm:left-12"
          style={{ zIndex: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 && phase < 5 ? 0.4 : 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-emerald-400/70 font-mono text-[10px] sm:text-xs tracking-wider">
            24°47&apos;N 125°17&apos;E
          </p>
          <motion.p
            className="text-white/30 font-mono text-[9px] sm:text-[10px] mt-1"
            animate={{
              opacity: phase >= 1 ? [0.2, 0.5, 0.2] : 0,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ▸ SIGNAL FOUND
          </motion.p>
        </motion.div>

        {/* ===== Phase 1: Depth indicator (right side) ===== */}
        <motion.div
          className="absolute top-8 right-6 sm:top-12 sm:right-12 text-right"
          style={{ zIndex: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 && phase < 5 ? 0.4 : 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <p className="text-white/30 font-mono text-[9px] sm:text-[10px] tracking-wider">DEPTH</p>
          <motion.p
            className="text-emerald-400/70 font-mono text-[10px] sm:text-xs"
            animate={phase >= 1 ? { opacity: [0.4, 0.8, 0.4] } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            -3.2m
          </motion.p>
        </motion.div>

        {/* ===== Phase 2: The encounter text ===== */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8" style={{ zIndex: 30 }}>
          {/* First message */}
          <div className="overflow-hidden">
            <motion.p
              className="text-emerald-400/80 text-center"
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "clamp(13px, 3vw, 18px)",
                letterSpacing: "0.3em",
                fontWeight: 300,
              }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{
                y: phase >= 2 ? "0%" : "100%",
                opacity: phase >= 2 && phase < 5 ? 1 : 0,
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              その日、海が呼んでいた。
            </motion.p>
          </div>

          {/* Main title - big dramatic reveal */}
          <motion.div
            className="mt-6 sm:mt-10 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
          >
            {/* Glow behind text */}
            <motion.div
              className="absolute inset-0 blur-3xl"
              style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative overflow-hidden">
              <motion.h1
                className="text-white text-center leading-[1.1]"
                style={{
                  fontFamily: "'Noto Serif JP', serif",
                  fontSize: "clamp(40px, 12vw, 100px)",
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                }}
                initial={{ y: "100%", filter: "blur(20px)" }}
                animate={{
                  y: phase >= 3 ? "0%" : "100%",
                  filter: phase >= 3 ? "blur(0px)" : "blur(20px)",
                }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                海亀兄弟
              </motion.h1>
            </div>

            {/* Underline accent */}
            <motion.div
              className="mt-3 sm:mt-4 mx-auto h-[2px] rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, #34d399, transparent)" }}
              initial={{ width: 0 }}
              animate={{ width: phase >= 3 ? "clamp(80px, 20vw, 200px)" : 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>

          {/* Phase 4: Invitation text */}
          <motion.div
            className="mt-8 sm:mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: phase >= 4 && phase < 6 ? 1 : 0,
              y: phase >= 4 ? 0 : 20,
            }}
            transition={{ duration: 0.8 }}
          >
            <p
              className="text-white/60 text-center leading-relaxed"
              style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: "clamp(12px, 2.5vw, 16px)",
                letterSpacing: "0.15em",
                fontWeight: 300,
              }}
            >
              宮古島の海の底で、<br className="sm:hidden" />
              彼らは静かに待っている。
            </p>
          </motion.div>
        </div>

        {/* ===== Phase 5: Wipe transition - water surface rising ===== */}
        <motion.div
          className="absolute inset-x-0 bottom-0"
          style={{
            zIndex: 40,
            background: "linear-gradient(to top, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.05) 40%, transparent 100%)",
          }}
          initial={{ height: "0%" }}
          animate={{ height: phase >= 5 ? "100%" : "0%" }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        />

        {/* ===== Bottom data bar ===== */}
        <motion.div
          className="absolute bottom-8 left-6 right-6 sm:bottom-12 sm:left-12 sm:right-12 flex justify-between items-end"
          style={{ zIndex: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 && phase < 5 ? 0.3 : 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <div>
            <p className="text-white/30 font-mono text-[8px] sm:text-[9px] tracking-wider">TEMP 26.4°C</p>
            <p className="text-white/20 font-mono text-[8px] sm:text-[9px]">VISIBILITY 30m+</p>
          </div>
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
            <p className="text-emerald-400/50 font-mono text-[8px] sm:text-[9px]">LIVE</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
