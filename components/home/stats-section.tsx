"use client"

import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion"
import { useEffect, useRef } from "react"
import { Star, MessageCircle, Heart, Award } from "lucide-react"

function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
  )

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionValue, value, { duration: 2.5, ease: [0.16, 1, 0.3, 1] })
    return controls.stop
  }, [isInView, motionValue, value])

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v + suffix
    })
  }, [rounded, suffix])

  return (
    <span ref={ref} className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-600 tabular-nums">
      0{suffix}
    </span>
  )
}

const stats = [
  { icon: Star, value: 4.9, suffix: "", label: "平均評価", iconColor: "text-yellow-500", fillIcon: true, decimals: 1 },
  { icon: MessageCircle, value: 10136, suffix: "+", label: "口コミ件数", iconColor: "text-blue-500", fillIcon: false, decimals: 0 },
  { icon: Heart, value: 100, suffix: "%", label: "子連れ歓迎", iconColor: "text-pink-500", fillIcon: true, decimals: 0 },
  { icon: Award, value: 5000, suffix: "+", label: "年間実績", iconColor: "text-emerald-500", fillIcon: false, decimals: 0 },
]

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-white to-emerald-50/50 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <p className="text-emerald-600 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Trust & Results</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900">
            数字が証明する<span className="text-emerald-600">信頼</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.12 }}
              className="text-center"
            >
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                whileInView={{ rotate: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: "spring", stiffness: 150, damping: 15, delay: i * 0.12 + 0.2 }}
              >
                <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.iconColor} mx-auto mb-2 sm:mb-4 ${stat.fillIcon ? "fill-current" : ""}`} />
              </motion.div>
              <AnimatedNumber value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
              <p className="text-gray-500 font-medium mt-1 sm:mt-2 text-xs sm:text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
