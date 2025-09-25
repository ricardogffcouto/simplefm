export function displayRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  const rounded = Math.round(value);
  if (rounded < 1) {
    return 1;
  }
  if (rounded > 20) {
    return 20;
  }
  return rounded;
}
