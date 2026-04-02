"use client"

import { useEffect, useState } from "react"

const BUBBLE_CONFIG = {
  count: 6,
  minSize: 20,
  maxSize: 80,
  minDuration: 15,
  maxDuration: 25,
  maxDelay: 10,
} as const

interface Bubble {
  id: number
  size: number
  left: number
  duration: number
  delay: number
}

export function BubbleBackground() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = Array.from({ length: BUBBLE_CONFIG.count }, (_, i) => ({
        id: i,
        size: Math.random() * (BUBBLE_CONFIG.maxSize - BUBBLE_CONFIG.minSize) + BUBBLE_CONFIG.minSize,
        left: Math.random() * 100,
        duration: Math.random() * (BUBBLE_CONFIG.maxDuration - BUBBLE_CONFIG.minDuration) + BUBBLE_CONFIG.minDuration,
        delay: Math.random() * BUBBLE_CONFIG.maxDelay,
      }))
      setBubbles(newBubbles)
    }

    generateBubbles()
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
