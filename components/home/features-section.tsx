"use client"

import { motion } from "framer-motion"
import { Shield, Camera, Users, Heart } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "少人数制ツアー",
    description: "1グループ最大でも少人数。ウミガメとゆっくり過ごせる贅沢な時間をお約束。",
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
  {
    icon: Camera,
    title: "写真・動画無料",
    description: "水中カメラで撮影した高画質の写真と動画を、当日中に全てプレゼント。",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Shield,
    title: "安全第一",
    description: "安全講習の実施、保険加入済み。初心者やお子様も安心して楽しめます。",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Heart,
    title: "家族みんなで",
    description: "5歳から参加OK。お子様用の器材も完備で、家族の思い出作りに最適。",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-50 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-16"
        >
          <p className="text-emerald-600 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Why Choose Us</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            海亀兄弟が<span className="text-emerald-600">選ばれる理由</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">
            安心・誠実・やわらかな高揚感。すべてのお客様に最高の体験を。
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, rotate: i % 2 === 0 ? -5 : 5 }}
              whileInView={{ opacity: 1, x: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
              className="group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                transition={{ duration: 0.5 }}
                className={`inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl ${feature.bg} mb-3 sm:mb-6`}
              >
                <feature.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${feature.color}`} />
              </motion.div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-1.5 sm:mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed text-xs sm:text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
