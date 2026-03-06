/**
 * Returns an HSL color string that continuously maps a percentage to a hue.
 * 100% → green (145°), 90% → yellow-green, 80% → yellow/amber, <60% → red.
 * Uses a power curve so differences in the 80-100% range are more visible.
 */
export function scoreColor(pct) {
  // Clamp to 0-100
  const p = Math.max(0, Math.min(100, pct))
  // Normalize 0-100 to 0-1
  const t = p / 100
  // Power curve: t^2.5 makes the color drop off faster from green
  const curved = Math.pow(t, 2.5)
  // Map to hue: 0 (red) to 145 (green)
  const hue = curved * 145
  return `hsl(${hue}, 75%, 55%)`
}

/**
 * Discrete class for CSS fallback (low/mid/high).
 */
export function pctClass(pct) {
  if (pct >= 75) return 'high'
  if (pct >= 45) return 'mid'
  return 'low'
}
