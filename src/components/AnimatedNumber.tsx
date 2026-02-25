import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'motion/react'

/**
 *
 * @param root0
 * @param root0.value
 */

type Props = {
  value: number
  direction?: 'up' | 'down'
  className?: string
}

export function AnimatedNumber({ value = 0, direction = 'up', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === 'down' ? value : 0)
  const springValue = useSpring(motionValue, {
    damping: 50, // Lower damping for faster response
    stiffness: 200, // Higher stiffness for snappier animation
  })
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Ensure we always show a number (avoids empty state when not in view or before first spring tick)
  useEffect(() => {
    if (!ref.current) return
    if (isInView && direction === 'up') {
      ref.current.textContent = Intl.NumberFormat('en-US').format(0)
    } else {
      ref.current.textContent = Intl.NumberFormat('en-US').format(value)
    }
  }, [value, isInView, direction])

  useEffect(() => {
    if (isInView) {
      motionValue.set(direction === 'down' ? 0 : value)
    }
  }, [motionValue, isInView, value, direction])

  useEffect(
    () =>
      springValue.on('change', (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat('en-US').format(Number(latest.toFixed(0)))
        }
      }),
    [springValue],
  )

  return <span className={className} ref={ref} />
}
