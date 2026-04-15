// ─── Player snapshot ──────────────────────────────────────────────────────────

export interface PlayerSnapshot {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
}

// ─── Score stats ──────────────────────────────────────────────────────────────

export const SCORE_CARD_KEYS = [
  "highest",
  "avgWinning",
  "tribeAverage",
  "lowestWinning",
  "highestLosing",
  "lowest",
] as const;

export type ScoreCardKey = (typeof SCORE_CARD_KEYS)[number];

export interface ScoreStatData {
  value: number;
  player?: PlayerSnapshot;
  datePlayed?: string;
  sessionPlayerCount?: number;
  dominance?: number | null;
  count?: number;
  goldenThreshold?: number | null;
  spread?: number | null;
  efficiency?: number | null;
  spoiler?: number | null;
  gapped?: number | null;
}

// ─── Score card configuration ─────────────────────────────────────────────────

export const scoreColorMap = {
  emerald: {
    dot: "bg-emerald-500",
    topBorder: "border-t-emerald-500",
    cardBorder: "border-emerald-500/25",
    scoreBorder: "border-emerald-500/30",
    gradient: "from-emerald-500/20 to-transparent",
    highlightBg: "bg-emerald-500/15",
  },
  primary: {
    dot: "bg-primary",
    topBorder: "border-t-primary",
    cardBorder: "border-primary/25",
    scoreBorder: "border-primary/30",
    gradient: "from-primary/20 to-transparent",
    highlightBg: "bg-primary/15",
  },
  slate: {
    dot: "bg-slate-500",
    topBorder: "border-t-slate-500",
    cardBorder: "border-slate-500/25",
    scoreBorder: "border-slate-500/30",
    gradient: "from-slate-500/20 to-transparent",
    highlightBg: "bg-slate-500/15",
  },
  amber: {
    dot: "bg-amber-500",
    topBorder: "border-t-amber-500",
    cardBorder: "border-amber-500/25",
    scoreBorder: "border-amber-500/30",
    gradient: "from-amber-500/20 to-transparent",
    highlightBg: "bg-amber-500/15",
  },
  violet: {
    dot: "bg-[var(--accent-5)]",
    topBorder: "border-t-[var(--accent-5)]",
    cardBorder: "border-[var(--accent-5)]/25",
    scoreBorder: "border-[var(--accent-5)]/30",
    gradient: "from-[var(--accent-5)]/20 to-transparent",
    highlightBg: "bg-[var(--accent-5)]/15",
  },
  rose: {
    dot: "bg-rose-500",
    topBorder: "border-t-rose-500",
    cardBorder: "border-rose-500/25",
    scoreBorder: "border-rose-500/30",
    gradient: "from-rose-500/20 to-transparent",
    highlightBg: "bg-rose-500/15",
  },
};

export const SCORE_CARD_DEFS: Record<
  ScoreCardKey,
  { label: string; accentColor: keyof typeof scoreColorMap }
> = {
  highest: { label: "Highest Score", accentColor: "emerald" },
  avgWinning: { label: "Avg Winning Score", accentColor: "primary" },
  tribeAverage: { label: "Tribe Average", accentColor: "slate" },
  lowestWinning: { label: "Lowest Winning Score", accentColor: "amber" },
  highestLosing: { label: "Highest Losing Score", accentColor: "violet" },
  lowest: { label: "Lowest Score Ever", accentColor: "rose" },
};

// ─── Player card accent map ───────────────────────────────────────────────────

export const accentMap = {
  primary: {
    headerBg: "bg-primary",
    headerText: "text-primary-foreground",
    bodyTint: "bg-primary/5",
    border: "border-primary/20",
    ring: "ring-primary",
    numberText: "text-primary",
    statBg: "bg-primary/10",
  },
  rose: {
    headerBg: "bg-rose-600",
    headerText: "text-white",
    bodyTint: "bg-rose-500/5",
    border: "border-rose-500/20",
    ring: "ring-rose-500",
    numberText: "text-rose-600",
    statBg: "bg-rose-500/10",
  },
  violet: {
    headerBg: "bg-[var(--accent-5)]",
    headerText: "text-white",
    bodyTint: "bg-[var(--accent-5)]/5",
    border: "border-[var(--accent-5)]/20",
    ring: "ring-[var(--accent-5)]",
    numberText: "text-[var(--accent-5)]",
    statBg: "bg-[var(--accent-5)]/10",
  },
};
