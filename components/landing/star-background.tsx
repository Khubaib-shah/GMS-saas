"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface StarBackgroundProps {
  className?: string
  includeGradient?: boolean
}

export function StarBackground({ className, includeGradient = false }: StarBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let isVisible = true

    // Resize canvas to match display size
    const resizeCanvas = () => {
      const { clientWidth, clientHeight } = canvas
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = clientWidth * dpr
      canvas.height = clientHeight * dpr
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()

    const clientWidth = canvas.clientWidth || 800
    const clientHeight = canvas.clientHeight || 600

    // Generate lightweight stars
    const starCount = Math.min(80, Math.floor((clientWidth * clientHeight) / 12000))
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * clientWidth,
      y: Math.random() * clientHeight,
      radius: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.015 + 0.005,
      delta: Math.random() * Math.PI * 2,
    }))

    // Render loop
    const render = () => {
      if (!isVisible) return

      const width = canvas.clientWidth
      const height = canvas.clientHeight

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        star.delta += star.speed
        const currentAlpha = Math.max(0.1, star.alpha + Math.sin(star.delta) * 0.25)

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // Pause rendering when section is scrolled out of view to save 100% CPU/GPU
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true
              animationFrameId = requestAnimationFrame(render)
            }
          } else {
            isVisible = false
            cancelAnimationFrame(animationFrameId)
          }
        })
      },
      { threshold: 0.05 }
    )

    observer.observe(canvas)
    window.addEventListener("resize", resizeCanvas)

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      observer.disconnect()
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div
      className={cn(
        "absolute inset-0 -z-10 overflow-hidden pointer-events-none",
        includeGradient && "bg-[radial-gradient(ellipse_at_bottom,_#1B2735_0%,_#090A0F_100%)]",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-70"
      />
    </div>
  )
}
