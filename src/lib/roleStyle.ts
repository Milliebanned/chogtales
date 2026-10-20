/** Colour for an AI-decided role, from its alignment (-100 villain .. +100 hero). */
export function roleColor(alignment: number) {
  if (alignment <= -50) return "#ef4444";
  if (alignment <= -15) return "#f97316";
  if (alignment < 15) return "#c084fc";
  if (alignment < 50) return "#38bdf8";
  return "#facc15";
}

export function roleLean(alignment: number) {
  if (alignment <= -50) return "villain";
  if (alignment <= -15) return "shady";
  if (alignment < 15) return "unpredictable";
  if (alignment < 50) return "good-hearted";
  return "heroic";
}
