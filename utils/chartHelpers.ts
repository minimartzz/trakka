// Shared chart helper utilities
// Extracted from AllGamesPieChart.tsx and HistoricalSessionsChart.tsx to avoid duplication

export const COMPLEXITY_COLORS = {
  light: "#22c55e", // green-500
  medium: "#f59e0b", // amber-500
  heavy: "#ef4444", // red-500
};

export const getCssVar = (varName: string): string => {
  if (typeof window === "undefined") return "#888";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

export const getComplexityBin = (
  weight: number | null,
): "light" | "medium" | "heavy" => {
  if (weight === null) return "medium";
  if (weight <= 2.5) return "light";
  if (weight <= 3.5) return "medium";
  return "heavy";
};

export const getPlayerCountBin = (
  playerCount: number,
): "p1" | "p2" | "p3" | "p4" | "p5plus" => {
  if (playerCount === 1) return "p1";
  if (playerCount === 2) return "p2";
  if (playerCount === 3) return "p3";
  if (playerCount === 4) return "p4";
  return "p5plus";
};
