/** Builds a smooth SVG path `d` string through a sequence of (x%, y%)
 * points using quadratic midpoint smoothing — shared by every zone's trail
 * rendering so each meso/placeholder component doesn't hand-roll its own
 * curve math. Coordinates are percentages (0-100), matching the viewBox
 * convention every zone view uses. */
export function buildTrailPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY} T ${curr.x} ${curr.y}`
  }
  return d
}
