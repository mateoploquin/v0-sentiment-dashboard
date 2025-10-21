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
    const size = 300
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 20

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw gauge arc background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = "oklch(0.22 0 0)"
    ctx.stroke()

    // Draw colored segments
    const segments = [
      { start: Math.PI, end: Math.PI + Math.PI / 3, color: "oklch(0.55 0.22 25)" }, // Red
      { start: Math.PI + Math.PI / 3, end: Math.PI + (2 * Math.PI) / 3, color: "oklch(0.70 0.15 60)" }, // Yellow
      { start: Math.PI + (2 * Math.PI) / 3, end: 2 * Math.PI, color: "oklch(0.65 0.18 140)" }, // Green
    ]

    segments.forEach((segment) => {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, segment.start, segment.end, false)
      ctx.lineWidth = 20
      ctx.strokeStyle = segment.color
      ctx.stroke()
    })

    // Calculate needle angle based on score (-100 to 100 maps to PI to 2*PI)
    const normalizedScore = Math.max(-100, Math.min(100, score))
    const angle = Math.PI + ((normalizedScore + 100) / 200) * Math.PI

    // Draw needle
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(angle)

    // Needle shape
    ctx.beginPath()
    ctx.moveTo(-8, 0)
    ctx.lineTo(0, -radius + 30)
    ctx.lineTo(8, 0)
    ctx.closePath()
    ctx.fillStyle = "oklch(0.95 0 0)"
    ctx.fill()

    // Needle center circle
    ctx.restore()
    ctx.beginPath()
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI)
    ctx.fillStyle = "oklch(0.55 0.20 250)"
    ctx.fill()

    // Draw score text
    ctx.font = "bold 32px Geist"
    ctx.fillStyle = "oklch(0.95 0 0)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(score.toFixed(1), centerX, centerY + 60)

    // Draw labels
    ctx.font = "14px Geist"
    ctx.fillStyle = "oklch(0.60 0 0)"
    ctx.textAlign = "left"
    ctx.fillText("Negative", 30, centerY + 10)
    ctx.textAlign = "right"
    ctx.fillText("Positive", size - 30, centerY + 10)
  }, [score])

  return (
    <div className="flex items-center justify-center">
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  )
}
