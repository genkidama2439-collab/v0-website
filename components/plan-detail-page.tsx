"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import {
  Star, Clock, Users, Camera, Shield, Check, ChevronDown,
  MapPin, CreditCard, Backpack, AlertTriangle, Gift, Crown,
  Bug, Compass, Heart, Sun, Baby, LifeBuoy, Sparkles, ArrowRight
} from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"
import type { PlanDetail } from "@/lib/plan-details"
import { PLAN_DETAILS } from "@/lib/plan-details"

const iconMap: Record<string, any> = {
  turtle: Sparkles, camera: Camera, users: Users, shield: Shield,
  crown: Crown, gift: Gift, clock: Clock, baby: Baby,
  bug: Bug, stars: Sparkles, compass: Compass, sunset: Sun,
  lifebuoy: LifeBuoy, heart: Heart,
}

// --- Hero ---
function PlanHero({ plan }: { plan: PlanDetail }) {
  return (
    <section className="relative min-h-[60svh] sm:min-h-[70svh] md:min-h-[80svh] flex items-end overflow-hidden">
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <Image
          src={plan.image}
          alt={plan.name}
          fill
          priority
          quality={90}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.turtle}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
      </motion.div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pb-8 sm:pb-12 md:pb-16 pt-24 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-white font-bold text-sm sm:text-base">{plan.rating}</span>
            <span className="text-white/70 text-xs sm:text-sm">({plan.reviews.toLocaleString()}件)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 sm:mb-3 drop-shadow-2xl">
            {plan.name}
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-emerald-300 font-semibold mb-2 sm:mb-4">{plan.tagline}</p>
          <p className="text-white/80 text-xs sm:text-base md:text-lg max-w-2xl leading-relaxed">{plan.heroDescription}</p>
        </motion.div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 mt-5 sm:mt-8"
        >
          {[
            { label: plan.price, sub: plan.priceNote, icon: CreditCard },
            { label: plan.duration, sub: "所要時間", icon: Clock },
            { label: plan.age, sub: "対象年齢", icon: Users },
          ].map((s) => (
            <div key={s.sub} className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-5 sm:py-3 border border-white/20 text-center sm:text-left">
              <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 hidden sm:block" />
              <div>
                <p className="text-white font-bold text-sm sm:text-lg leading-tight">{s.label}</p>
                <p className="text-white/60 text-[10px] sm:text-xs">{s.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// --- Highlights ---
function Highlights({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-12"
        >
          このプランの<span className="text-emerald-600">魅力</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plan.highlights.map((h, i) => {
            const Icon = iconMap[h.icon] || Sparkles
            return (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.1 }}
                className="flex gap-5 p-6 rounded-2xl bg-gray-50 hover:bg-emerald-50/50 transition-colors duration-300 border border-gray-100"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{h.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{h.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// --- Flow ---
function FlowSection({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-4"
        >
          体験の<span className="text-emerald-600">流れ</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-gray-500 text-center mb-12"
        >
          当日の流れをステップごとにご紹介
        </motion.p>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-emerald-200" />

          <div className="flex flex-col gap-8">
            {plan.flow.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.12 }}
                className="relative flex gap-6 md:gap-8"
              >
                {/* Step number */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.12 + 0.1 }}
                  className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl md:text-2xl font-black z-10 shadow-lg"
                >
                  {step.step}
                </motion.div>

                {/* Content */}
                <div className="flex-1 pb-2 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">{step.title}</h3>
                    {step.time && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                        {step.time}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Price & Included ---
function PriceSection({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-12"
        >
          料金・<span className="text-emerald-600">含まれるもの</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Price card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl"
          >
            <p className="text-emerald-100 text-sm font-medium mb-2">料金</p>
            <p className="text-5xl font-black mb-2">{plan.price}</p>
            <p className="text-emerald-100 text-sm mb-1">{plan.priceNote}</p>
            {plan.childPrice && <p className="text-emerald-100 text-sm">子供: {plan.childPrice}</p>}

            <div className="mt-6 pt-6 border-t border-white/20 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-emerald-200" />
                <div>
                  <p className="font-semibold text-sm">所要時間</p>
                  <p className="text-emerald-100 text-sm">{plan.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-200" />
                <div>
                  <p className="font-semibold text-sm">対象年齢</p>
                  <p className="text-emerald-100 text-sm">{plan.age}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-emerald-200" />
                <div>
                  <p className="font-semibold text-sm">お支払い</p>
                  <p className="text-emerald-100 text-sm">{plan.paymentMethod}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Included */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                料金に含まれるもの
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {plan.included.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {plan.options && plan.options.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-500" />
                  オプション（有料）
                </h3>
                <div className="space-y-3">
                  {plan.options.map((opt) => (
                    <div key={opt.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{opt.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">{opt.price}</span>
                        {opt.note && <p className="text-xs text-emerald-600">{opt.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// --- Locations Table ---
function LocationsSection({ plan }: { plan: PlanDetail }) {
  if (!plan.locations || plan.locations.length === 0) return null

  return (
    <section className="py-10 sm:py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-4"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            開催<span className="text-emerald-600">ビーチ</span>ガイド
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-gray-500 text-center mb-4 text-sm"
        >
          当日の風向き・海況によりガイドが最適なビーチを選定します。前日にLINEでご案内。
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-emerald-600 font-semibold text-center mb-12 text-sm"
        >
          新城海岸がメインポイント（遭遇率95%！）
        </motion.p>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="hidden md:block overflow-hidden rounded-2xl border border-gray-200"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-emerald-50">
                <th className="text-left py-4 px-6 text-sm font-bold text-emerald-800">ビーチ名</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-emerald-800">ウミガメ遭遇率</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-emerald-800">駐車場</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-emerald-800">トイレ</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-emerald-800">シャワー</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-emerald-800">備考</th>
              </tr>
            </thead>
            <tbody>
              {plan.locations.map((loc, i) => (
                <tr key={loc.name} className={`border-t border-gray-100 ${i === 0 ? "bg-emerald-50/30" : ""}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{loc.name}</span>
                      {i === 0 && (
                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                          おすすめ
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${loc.encounterRate}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${loc.encounterRate >= 90 ? "bg-emerald-500" : "bg-cyan-500"}`}
                        />
                      </div>
                      <span className={`text-sm font-bold ${loc.encounterRate >= 90 ? "text-emerald-600" : "text-cyan-600"}`}>
                        {loc.encounterRate}%
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4 text-sm text-gray-700">{loc.parking}</td>
                  <td className="text-center py-4 px-4">
                    {loc.toilet
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600"><Check className="w-4 h-4" /></span>
                      : <span className="text-gray-300 text-lg">—</span>}
                  </td>
                  <td className="text-center py-4 px-4">
                    {loc.shower
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600"><Check className="w-4 h-4" /></span>
                      : <span className="text-gray-300 text-lg">—</span>}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500 max-w-[200px]">{loc.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-4">
          {plan.locations.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.08 }}
              className={`rounded-2xl p-5 border ${i === 0 ? "border-emerald-200 bg-emerald-50/50" : "border-gray-100 bg-white"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{loc.name}</h3>
                  {i === 0 && (
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                      おすすめ
                    </span>
                  )}
                </div>
                <span className={`text-lg font-black ${loc.encounterRate >= 90 ? "text-emerald-600" : "text-cyan-600"}`}>
                  {loc.encounterRate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${loc.encounterRate}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${loc.encounterRate >= 90 ? "bg-emerald-500" : "bg-cyan-500"}`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-xl p-2.5 border border-gray-50">
                  <p className="text-[10px] text-gray-400 mb-0.5">駐車場</p>
                  <p className="text-xs font-semibold text-gray-900">{loc.parking}</p>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-gray-50">
                  <p className="text-[10px] text-gray-400 mb-0.5">トイレ</p>
                  <p className="text-xs font-semibold">{loc.toilet ? <span className="text-emerald-600">あり</span> : <span className="text-gray-400">なし</span>}</p>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-gray-50">
                  <p className="text-[10px] text-gray-400 mb-0.5">シャワー</p>
                  <p className="text-xs font-semibold">{loc.shower ? <span className="text-emerald-600">あり</span> : <span className="text-gray-400">なし</span>}</p>
                </div>
              </div>

              {loc.note && (
                <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {loc.note}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Info section (location, what to bring, precautions) ---
function InfoSection({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">集合場所</h3>
            </div>
            <p className="text-sm text-gray-700 mb-2">{plan.location}</p>
            {plan.locationNote && <p className="text-xs text-gray-500">{plan.locationNote}</p>}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">集合時間:</span> {plan.meetingTime}
              </p>
            </div>
          </motion.div>

          {/* What to bring */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <Backpack className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900">持ち物</h3>
            </div>
            <ul className="space-y-2">
              {plan.whatToBring.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Precautions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">注意事項</h3>
            </div>
            <ul className="space-y-2">
              {plan.precautions.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// --- FAQ ---
function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="border-b border-gray-100 last:border-0"
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-gray-900 font-semibold text-sm md:text-base pr-4 group-hover:text-emerald-600 transition-colors">
          {faq.q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-gray-600 text-sm leading-relaxed pb-5">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PlanFAQ({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-12"
        >
          よくある<span className="text-emerald-600">質問</span>
        </motion.h2>
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          {plan.faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Reviews ---
function PlanReviews({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            お客様の<span className="text-emerald-600">声</span>
          </h2>
          <p className="text-gray-500">{plan.reviews.toLocaleString()}件の口コミから抜粋</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plan.reviews_data.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{review.text}</p>
              <div className="pt-3 border-t border-gray-50">
                <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                <p className="text-gray-400 text-xs">{review.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- CTA ---
function PlanCTA({ plan }: { plan: PlanDetail }) {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-br from-emerald-600 to-cyan-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            {plan.name}を予約する
          </h2>
          <p className="text-emerald-100 text-sm sm:text-lg mb-2">{plan.price}〜 / {plan.duration}</p>
          <p className="text-emerald-100 text-xs sm:text-base mb-6 sm:mb-8">前日までキャンセル無料 ・ 天候不良の場合は全額返金</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={`/book?plan=${plan.id}`}
                className="block bg-white text-emerald-700 font-bold text-base px-8 py-3.5 rounded-full shadow-xl transition-colors hover:bg-emerald-50"
              >
                日付を選んで予約する
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <a
                href="https://lin.ee/jfp4laz"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#06C755] text-white font-bold text-base px-8 py-3.5 rounded-full shadow-xl transition-colors hover:bg-[#05b34d]"
              >
                LINEで質問・相談する
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// --- Other Plans ---
const otherPlansMeta: Record<string, { name: string; tagline: string; image: string; price: string; badge: string; badgeColor: string }> = {
  S1: { name: "ウミガメシュノーケル", tagline: "遭遇率100%の感動体験", image: "/images/s1-sea-turtle-snorkeling.jpg", price: "¥6,000〜", badge: "一番人気", badgeColor: "bg-yellow-400 text-yellow-900" },
  S2: { name: "VIP貸切ツアー", tagline: "プライベートな特別な時間", image: "/images/s2-sea-turtle-closeup.jpg", price: "¥9,000", badge: "特別プラン", badgeColor: "bg-purple-500 text-white" },
  S3: { name: "本格ナイトツアー", tagline: "夜の大冒険へ出かけよう", image: "/images/night-hunter-crab.jpg", price: "¥4,000", badge: "家族人気No.1", badgeColor: "bg-emerald-500 text-white" },
  S4: { name: "サンセットSUP", tagline: "黄金の海に浮かぶひととき", image: "/images/sunset-sup-silhouettes.jpg", price: "¥6,000〜", badge: "映え度No.1", badgeColor: "bg-orange-500 text-white" },
}

function OtherPlans({ currentId }: { currentId: string }) {
  const others = Object.keys(otherPlansMeta).filter((id) => id !== currentId)

  return (
    <section className="py-10 sm:py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-4"
        >
          他の<span className="text-emerald-600">プラン</span>も見る
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-gray-500 text-center mb-12"
        >
          宮古島をもっと楽しむプランをチェック
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {others.map((id, i) => {
            const p = otherPlansMeta[id]
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.1 }}
              >
                <Link href={`/plans/${id}`} className="group block">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      quality={75}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URLS.turtle}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className={`absolute top-3 left-3 ${p.badgeColor} text-xs font-bold px-3 py-1 rounded-full`}>
                      {p.badge}
                    </span>
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-sm font-bold text-red-600">{p.price}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-1">
                    {p.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    {p.tagline}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </p>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// --- Floating Plan Nav ---
function FloatingPlanNav({ currentId }: { currentId: string }) {
  const [visible, setVisible] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 600)
  })

  const allIds = ["S1", "S2", "S3", "S4"]
  const shortNames: Record<string, string> = {
    S1: "シュノーケル",
    S2: "VIP貸切",
    S3: "ナイト",
    S4: "SUP",
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 shadow-sm"
        >
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
            {/* Plan tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {allIds.map((id) => (
                <Link
                  key={id}
                  href={`/plans/${id}`}
                  className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                    id === currentId
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {shortNames[id]}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/book?plan=${currentId}`}
              className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2 rounded-full transition-colors ml-3"
            >
              予約する
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- Main ---
export function PlanDetailPage({ plan }: { plan: PlanDetail }) {
  return (
    <>
      <FloatingPlanNav currentId={plan.id} />
      <main>
        <PlanHero plan={plan} />
        <Highlights plan={plan} />
        <FlowSection plan={plan} />
        <LocationsSection plan={plan} />
        <PriceSection plan={plan} />
        <InfoSection plan={plan} />
        <PlanReviews plan={plan} />
        <PlanFAQ plan={plan} />
        <PlanCTA plan={plan} />
        <OtherPlans currentId={plan.id} />
      </main>
    </>
  )
}
