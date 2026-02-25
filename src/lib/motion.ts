/**
 * Shared layout animation config. Uses duration + ease (no spring) so animations
 * feel smooth and intentional rather than bouncy.
 */
export const layoutTransition = {
  duration: 0.25,
  ease: 'easeOut' as const,
}
