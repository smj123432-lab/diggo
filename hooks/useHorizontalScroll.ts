'use client'

import { useRef, useState, useEffect } from 'react'

interface HorizontalScrollState {
  ref: React.RefObject<HTMLDivElement | null>
  canLeft: boolean
  canRight: boolean
  handleScroll: () => void
}

export function useHorizontalScroll(): HorizontalScrollState {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  function handleScroll() {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 0)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    requestAnimationFrame(handleScroll)
  }, [])

  return { ref, canLeft, canRight, handleScroll }
}
