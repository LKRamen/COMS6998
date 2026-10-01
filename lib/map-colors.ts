export function visitOpacity(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return 0.28 + 0.72 * Math.min(1, Math.sqrt(count / max));
}
