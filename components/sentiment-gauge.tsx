"use client"

import { useEffect, useRef } from "react"

interface SentimentGaugeProps {
  score: number // -100 to 100
}

export function SentimentGauge({ score }: SentimentGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const size = 320
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 30

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw outer glow ring
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 10, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 2
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.stroke()

    // Draw gauge arc background with glass effect
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 24
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.stroke()

    // Draw colored segments with gradient
    const segments = [
      { start: Math.PI, end: Math.PI + Math.PI / 3, color: "oklch(0.6 0.22 25)" }, // Red
      { start: Math.PI + Math.PI / 3, end: Math.PI + (2 * Math.PI) / 3, color: "oklch(0.75 0.15 60)" }, // Yellow
      { start: Math.PI + (2 * Math.PI) / 3, end: 2 * Math.PI, color: "oklch(0.7 0.18 140)" }, // Green
    ]

    segments.forEach((segment) => {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, segment.start, segment.end, false)
      ctx.lineWidth = 22
      ctx.lineCap = "round"
      ctx.strokeStyle = segment.color
      ctx.shadowColor = segment.color
      ctx.shadowBlur = 15
      ctx.stroke()
      ctx.shadowBlur = 0
    })

    // Calculate needle angle based on score (-100 to 100 maps to PI to 2*PI)
    const normalizedScore = Math.max(-100, Math.min(100, score))
    const angle = Math.PI + ((normalizedScore + 100) / 200) * Math.PI

    // Draw needle with glass effect
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(angle)

    // Needle shape
    ctx.beginPath()
    ctx.moveTo(-6, 0)
    ctx.lineTo(0, -radius + 35)
    ctx.lineTo(6, 0)
    ctx.closePath()

    // Gradient for needle
    const needleGradient = ctx.createLinearGradient(0, -radius + 35, 0, 0)
    needleGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)")
    needleGradient.addColorStop(1, "rgba(255, 255, 255, 0.6)")
    ctx.fillStyle = needleGradient
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0

    // Needle center circle with gradient
    ctx.restore()
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15)
    centerGradient.addColorStop(0, "oklch(0.6 0.2 250)")
    centerGradient.addColorStop(1, "oklch(0.5 0.2 250)")
    ctx.beginPath()
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI)
    ctx.fillStyle = centerGradient
    ctx.shadowColor = "oklch(0.5 0.2 250)"
    ctx.shadowBlur = 20
    ctx.fill()
    ctx.shadowBlur = 0

    // Inner circle border
    ctx.beginPath()
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw score text with shadow
    ctx.font = "bold 36px Geist"
    ctx.fillStyle = "oklch(0.95 0 0)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
    ctx.shadowBlur = 4
    ctx.fillText(score.toFixed(1), centerX, centerY + 65)
    ctx.shadowBlur = 0

    // Draw labels
    ctx.font = "13px Geist"
    ctx.fillStyle = "oklch(0.6 0 0)"
    ctx.textAlign = "left"
    ctx.fillText("Negative", 35, centerY + 15)
    ctx.textAlign = "right"
    ctx.fillText("Positive", size - 35, centerY + 15)
  }, [score])

  return (
    <div className="flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="max-w-full drop-shadow-xl" />
    </div>
  )
}
