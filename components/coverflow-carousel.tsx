"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Star, Clock, Users, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatPriceWithTilde, BLUR_DATA_URLS } from "@/lib/data"

type PlanItem = {
  id: string
  name: string
  rating: number
  reviewCount: number
  image: string
  price: number
  childPrice?: number
  rank?: number
  durationHours: number
  features: string[]
  description: string
}

interface CoverflowCarouselProps {
  items: PlanItem[]
}

export default function CoverflowCarousel({ items }: CoverflowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()

  const formatRating = (rating: number) => {
    return rating === 4.9 ? 5.0 : rating
  }

  // Calculate 3D transforms based on position
  const getTransform = (index: number) => {
    const diff = index - currentIndex
    const absDistance = Math.abs(diff)

    if (absDistance > 2) return { transform: "translateX(200%) scale(0.7) rotateY(45deg)", opacity: 0 }

    const rotateY = diff * 25
    const translateZ = Math.max(0, 60 - absDistance * 30)
    const scale = Math.max(0.8, 1 - absDistance * 0.1)
    const opacity = Math.max(0.3, 1 - absDistance * 0.3)
    const translateX = diff * 15

    return {
      transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex: 10 - absDistance,
    }
  }

  // Inertial scrolling animation
  const animateInertia = useCallback(() => {
    if (Math.abs(velocity) > 0.1) {
      setVelocity((v) => v * 0.94)
      setCurrentIndex((prev) => {
        const newIndex = prev + velocity * 0.02
        return Math.max(0, Math.min(items.length - 1, newIndex))
      })
      animationRef.current = requestAnimationFrame(animateInertia)
    } else {
      // Snap to nearest item
      setCurrentIndex((prev) => Math.round(prev))
      setVelocity(0)
    }
  }, [velocity, items.length])

  // Handle pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setScrollLeft(currentIndex)
    setVelocity(0)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return

    const x = e.clientX
    const walk = (startX - x) * 0.005
    const newIndex = Math.max(0, Math.min(items.length - 1, scrollLeft + walk))
    setCurrentIndex(newIndex)
    setVelocity(walk * 0.5)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    if (Math.abs(velocity) > 0.1) {
      animationRef.current = requestAnimationFrame(animateInertia)
    } else {
      setCurrentIndex((prev) => Math.round(prev))
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1))
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [items.length])

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))
  }

  return (
    <div className="relative w-full py-8">
      {/* Navigation Arrows - Desktop only */}
      <button
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 text-emerald-600 hover:bg-white hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ArrowRight className="w-6 h-6 rotate-180" />
      </button>

      <button
        onClick={goToNext}
        disabled={currentIndex === items.length - 1}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 text-emerald-600 hover:bg-white hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ArrowRight className="w-6 h-6" />
      </button>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="relative h-[500px] md:h-[600px] overflow-hidden"
        style={{ perspective: "1000px" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="region"
        aria-roledescription="carousel"
      >
        {/* Edge fade mask */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        />

        {/* Carousel Items */}
        <div className="relative w-full h-full flex items-center justify-center">
          {items.map((item, index) => {
            const { transform, opacity, zIndex } = getTransform(index)
            const isActive = Math.round(currentIndex) === index
            const isNearCenter = Math.abs(index - currentIndex) <= 1

            return (
              <div
                key={item.id}
                className="absolute w-72 md:w-80 h-96 md:h-[480px] transition-all duration-500 ease-out cursor-pointer"
                style={{
                  transform,
                  opacity,
                  zIndex,
                  willChange: isNearCenter ? "transform, opacity" : "auto",
                }}
                aria-current={isActive ? "true" : "false"}
                onClick={() => setCurrentIndex(index)}
              >
                <div className="w-full h-full bg-white/90 backdrop-blur-xl rounded-2xl ring-1 ring-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Ranking Badge */}
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge
                      className={`text-white font-bold text-base px-3 py-1.5 rounded-full shadow-lg ${
                        item.rank === 1
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                          : item.rank === 2
                            ? "bg-gradient-to-r from-gray-300 to-gray-500"
                            : item.rank === 3
                              ? "bg-gradient-to-r from-amber-600 to-amber-800"
                              : "bg-gradient-to-r from-emerald-500 to-teal-600"
                      }`}
                    >
                      #{item.rank}
                    </Badge>
                  </div>

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={320}
                      height={192}
                      quality={isActive ? 70 : isNearCenter ? 60 : 50}
                      loading={isActive ? "eager" : "lazy"}
                      priority={isActive}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URLS.turtle}
                      sizes="(max-width: 640px) 288px, 320px"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 h-48 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-emerald-800 flex-1 pr-2 line-clamp-2">{item.name}</h3>
                      <div className="flex items-center flex-shrink-0">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-700 ml-1">{formatRating(item.rating)}</span>
                        <span className="text-xs text-gray-500 ml-1">({item.reviewCount})</span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{item.description}</p>

                    {/* Plan Details */}
                    <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {item.durationHours}時間
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        少人数制
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.features.slice(0, 2).map((feature, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-1"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Price and Button */}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xl font-bold text-emerald-800">{formatPriceWithTilde(item)}</span>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2"
                      >
                        <Link href={`/book?plan=${item.id}`}>
                          予約する
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                Math.round(currentIndex) === index ? "bg-emerald-600 w-8" : "bg-emerald-200 w-2 hover:bg-emerald-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}
