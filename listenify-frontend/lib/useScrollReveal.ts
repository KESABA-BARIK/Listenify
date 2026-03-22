'use client'
import { useEffect, useRef } from 'react'

interface ScrollRevealOptions {
  threshold?: number   // 0–1, how much of element must be visible (default 0.12)
  delay?: number       // ms delay before animation starts (default 0)
  once?: boolean       // only animate once (default true)
}

/**
 * Returns a ref to attach to any element.
 * When the element enters the viewport, the class `revealed` is added.
 * Pair with the `.reveal` + `.revealed` CSS classes in globals.css.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.12, delay = 0, once = true } = options
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Set initial delay as CSS var so the stylesheet can use it
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('revealed')
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, delay, once])

  return ref
}
