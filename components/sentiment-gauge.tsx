"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface SentimentGaugeProps {
  score: number // -100 to 100
}

export function SentimentGauge({ score }: SentimentGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Animate score changes
  useEffect(() => {
    const duration = 1500 // 1.5 seconds
    const steps = 60
    const increment = (score - animatedScore) / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setAnimatedScore((prev) => {
        const next = prev + increment
        if (currentStep >= steps) {
          clearInterval(timer)
          return score
        }
        return next
      })
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 360
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 40

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Calculate normalized score and angle
    const normalizedScore = Math.max(-100, Math.min(100, animatedScore))
    const targetAngle = Math.PI + ((normalizedScore + 100) / 200) * Math.PI

    // Draw multiple arc layers for depth
    const arcLayers = [
      { radius: radius + 8, width: 3, opacity: 0.1 },
      { radius: radius + 4, width: 2, opacity: 0.15 },
      { radius: radius, width: 28, opacity: 0.2 }
    ]

    arcLayers.forEach((layer) => {
      ctx.beginPath()
      ctx.arc(centerX, centerY, layer.radius, Math.PI, 2 * Math.PI, false)
      ctx.lineWidth = layer.width
      ctx.strokeStyle = `rgba(255, 255, 255, ${layer.opacity})`
      ctx.stroke()
    })

    // Draw colored segments with smoother gradients
    const segments = [
      {
        start: Math.PI,
        end: Math.PI + Math.PI / 3,
        colors: ["oklch(0.65 0.25 25)", "oklch(0.6 0.22 35)"],
        label: "Negative"
      },
      {
        start: Math.PI + Math.PI / 3,
        end: Math.PI + (2 * Math.PI) / 3,
        colors: ["oklch(0.75 0.18 50)", "oklch(0.78 0.15 70)"],
        label: "Neutral"
      },
      {
        start: Math.PI + (2 * Math.PI) / 3,
        end: 2 * Math.PI,
        colors: ["oklch(0.7 0.2 130)", "oklch(0.72 0.18 150)"],
        label: "Positive"
      }
    ]

    segments.forEach((segment, index) => {
      const gradient = ctx.createLinearGradient(
        centerX + Math.cos(segment.start) * radius,
        centerY + Math.sin(segment.start) * radius,
        centerX + Math.cos(segment.end) * radius,
        centerY + Math.sin(segment.end) * radius
      )
      gradient.addColorStop(0, segment.colors[0])
      gradient.addColorStop(1, segment.colors[1])

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, segment.start, segment.end, false)
      ctx.lineWidth = 26
      ctx.lineCap = "round"
      ctx.strokeStyle = gradient

      // Add glow effect when hovered
      if (isHovered) {
        ctx.shadowColor = segment.colors[0]
        ctx.shadowBlur = 20
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Draw progress fill based on score
      if (targetAngle > segment.start && targetAngle < segment.end) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, segment.start, targetAngle, false)
        ctx.lineWidth = 28
        ctx.lineCap = "round"
        ctx.strokeStyle = gradient
        ctx.shadowColor = segment.colors[0]
        ctx.shadowBlur = 25
        ctx.stroke()
        ctx.shadowBlur = 0
      } else if (targetAngle >= segment.end) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, segment.start, segment.end, false)
        ctx.lineWidth = 28
        ctx.lineCap = "round"
        ctx.strokeStyle = gradient
        ctx.shadowColor = segment.colors[0]
        ctx.shadowBlur = 25
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })

    // Draw animated indicator dot at current position
    const dotX = centerX + Math.cos(targetAngle) * radius
    const dotY = centerY + Math.sin(targetAngle) * radius

    // Outer glow
    ctx.beginPath()
    ctx.arc(dotX, dotY, isHovered ? 12 : 10, 0, 2 * Math.PI)
    const glowGradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 12)
    glowGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)")
    glowGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)")
    glowGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = glowGradient
    ctx.shadowColor = "white"
    ctx.shadowBlur = 20
    ctx.fill()
    ctx.shadowBlur = 0

    // Inner dot
    ctx.beginPath()
    ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw center circle with glass effect
    const centerSize = isHovered ? 50 : 45
    const centerGradient = ctx.createRadialGradient(
      centerX,
      centerY - 5,
      0,
      centerX,
      centerY,
      centerSize
    )
    centerGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
    centerGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.15)")
    centerGradient.addColorStop(1, "rgba(255, 255, 255, 0.05)")

    ctx.beginPath()
    ctx.arc(centerX, centerY, centerSize, 0, 2 * Math.PI)
    ctx.fillStyle = centerGradient
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, centerSize, 0, 2 * Math.PI)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw score text
    ctx.font = "bold 42px Geist"
    ctx.fillStyle = "oklch(0.95 0 0)"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = 8
    ctx.fillText(animatedScore.toFixed(1), centerX, centerY - 5)
    ctx.shadowBlur = 0

    // Draw scale markers
    const markers = [-100, -50, 0, 50, 100]
    markers.forEach((value) => {
      const angle = Math.PI + ((value + 100) / 200) * Math.PI
      const innerR = radius - 18
      const outerR = radius - 8
      const x1 = centerX + Math.cos(angle) * innerR
      const y1 = centerY + Math.sin(angle) * innerR
      const x2 = centerX + Math.cos(angle) * outerR
      const y2 = centerY + Math.sin(angle) * outerR

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw value labels
      const labelR = radius + 25
      const labelX = centerX + Math.cos(angle) * labelR
      const labelY = centerY + Math.sin(angle) * labelR
      ctx.font = "11px Geist"
      ctx.fillStyle = "oklch(0.55 0 0)"
      ctx.textAlign = "center"
      ctx.fillText(value.toString(), labelX, labelY)
    })
  }, [animatedScore, isHovered])

  const getSentimentIcon = () => {
    if (animatedScore > 20) return <TrendingUp className="h-5 w-5" />
    if (animatedScore < -20) return <TrendingDown className="h-5 w-5" />
    return <Minus className="h-5 w-5" />
  }

  const getSentimentLabel = () => {
    if (animatedScore > 60) return "Very Positive"
    if (animatedScore > 20) return "Positive"
    if (animatedScore > -20) return "Neutral"
    if (animatedScore > -60) return "Negative"
    return "Very Negative"
  }

  const getSentimentColor = () => {
    if (animatedScore > 20) return "text-chart-3"
    if (animatedScore < -20) return "text-destructive"
    return "text-muted-foreground"
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative transition-transform duration-300 hover:scale-105"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <canvas ref={canvasRef} className="max-w-full drop-shadow-2xl" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className={`flex items-center gap-2 font-semibold ${getSentimentColor()} transition-colors`}>
          {getSentimentIcon()}
          <span className="text-lg">{getSentimentLabel()}</span>
        </div>
        <p className="text-xs text-muted-foreground/70">Score updates in real-time</p>
      </div>
    </div>
  )
}
