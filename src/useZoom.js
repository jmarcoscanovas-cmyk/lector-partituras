import { useRef, useEffect } from 'react'

export function useZoom(containerRef) {
  const scaleRef     = useRef(1)
  const lastDistRef  = useRef(null)
  const offsetRef    = useRef({ x: 0, y: 0 })
  const lastTouchRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function getDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    function getMidpoint(touches) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      }
    }

    function applyTransform() {
      el.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${scaleRef.current})`
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        lastDistRef.current = getDistance(e.touches)
      } else if (e.touches.length === 1) {
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    function onTouchMove(e) {
      e.preventDefault()

      if (e.touches.length === 2) {
        const dist = getDistance(e.touches)
        if (lastDistRef.current) {
          const delta = dist / lastDistRef.current
          scaleRef.current = Math.min(Math.max(scaleRef.current * delta, 1), 4)
        }
        lastDistRef.current = dist

        if (scaleRef.current <= 1) {
          offsetRef.current = { x: 0, y: 0 }
        }

        applyTransform()
      } else if (e.touches.length === 1 && scaleRef.current > 1) {
        const touch = e.touches[0]
        if (lastTouchRef.current) {
          offsetRef.current.x += touch.clientX - lastTouchRef.current.x
          offsetRef.current.y += touch.clientY - lastTouchRef.current.y
        }
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
        applyTransform()
      }
    }

    function onTouchEnd(e) {
      if (e.touches.length < 2) lastDistRef.current = null
      if (e.touches.length < 1) lastTouchRef.current = null

      if (scaleRef.current <= 1) {
        scaleRef.current = 1
        offsetRef.current = { x: 0, y: 0 }
        applyTransform()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])
}