"use client"

import { useEffect, useRef, ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { cn } from "@/lib/utils"

/**
 * Utility function to split text into spans for letter-by-letter animation
 */
export function splitText(text: string) {
  if (typeof text !== "string") return text
  return text.split("").map((char, index) => {
    if (char === " ") return " "
    return (
      <span key={index} className="inline-block headline-char opacity-0 translate-y-[20px]">
        {char}
      </span>
    )
  })
}

interface SectionHeadingProps {
  /**
   * The main title text. Use \n for line breaks.
   */
  title?: string
  /**
   * Text that should be highlighted with the primary green color.
   */
  highlight?: string
  /**
   * Text that comes after the highlight.
   */
  subtitle?: string
  /**
   * Optional custom children if the title/highlight/subtitle props aren't enough.
   * If provided, title/highlight/subtitle props are ignored.
   */
  children?: ReactNode
  /**
   * Additional CSS classes.
   */
  className?: string
  /**
   * Text alignment.
   */
  align?: "left" | "center" | "right"
  /**
   * Animation delay in seconds.
   */
  delay?: number
  /**
   * The HTML tag to use.
   */
  as?: "h1" | "h2" | "h3"
  /**
   * Preset sizes.
   */
  size?: "hero" | "section"
}

export function SectionHeading({
  title,
  highlight,
  subtitle,
  children,
  className,
  align = "center",
  delay = 0,
  as: Component = "h2",
  size = "section",
}: SectionHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const chars = headingRef.current?.querySelectorAll(".headline-char")
    if (chars && chars.length > 0) {
      gsap.to(chars, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: delay,
        stagger: 0.03,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 95%",
        },
      })
    }
  }, [delay])

  const alignmentClass = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  }[align]

  const sizeClass = {
    hero: "text-4xl sm:text-6xl md:text-7xl tracking-[-0.04em] leading-[1.05]",
    section: "text-3xl md:text-[44px] tracking-[-0.03em] leading-[1.1]",
  }[size]

  const renderTitle = (t: string) => {
    return t.split('\n').map((line, i, arr) => (
      <span key={i}>
        {splitText(line)}
        {i < arr.length - 1 && <br />}
      </span>
    ))
  }

  return (
    <Component
      ref={headingRef}
      className={cn(
        "font-bold text-white mb-4 md:mb-6",
        sizeClass,
        alignmentClass,
        className
      )}
    >
      {children ? children : (
        <>
          {title && renderTitle(title)}
          {highlight && (
            <>
              {" "}
              <span className="text-[#85FF3F]">{splitText(highlight)}</span>
            </>
          )}
          {subtitle && (
            <>
              {" "}
              {splitText(subtitle)}
            </>
          )}
        </>
      )}
    </Component>
  )
}
