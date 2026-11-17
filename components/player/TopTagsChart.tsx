"use client";

// Top Mechanics / Top Categories card on the public player page: one ring per
// label, #1 outermost. #1 sweeps three quarters of a turn and the rest scale
// against it, leaving the top-left quarter free for the labels.
import { useContainerSize } from "@/hooks/useContainerSize";
import type { topTags } from "@/utils/playerProfile";
import { type LabelProps, PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

type Tag = ReturnType<typeof topTags>[number];

// One hue family per card, stepping by rank (#1 first)
const PALETTES = {
  // cyan → blue → indigo → purple → violet
  cool: [
    "oklch(72% 0.13 200)",
    "oklch(65% 0.15 235)",
    "oklch(60% 0.18 265)",
    "oklch(58% 0.2 290)",
    "oklch(62% 0.2 315)",
  ],
  // red → orange → amber → yellow
  warm: [
    "oklch(62% 0.21 25)",
    "oklch(68% 0.19 45)",
    "oklch(74% 0.17 65)",
    "oklch(80% 0.16 85)",
    "oklch(85% 0.15 100)",
  ],
};

const MAX_HEIGHT = 300;
// Each ring's share of the radius, and the bar's share of its ring
const RING = 0.15;
const BAR = 0.65;
// shortcut: label width estimated per character, not measured; swap for
// HTML labels over the chart if long names still crowd the rings
const CHAR_WIDTH = 6.5;

const percent = (share: number) => `${Math.round(share * 100)}%`;

const TopTagsChart: React.FC<{
  title: string;
  tags: Tag[];
  tone: keyof typeof PALETTES;
  empty: string;
}> = ({ title, tags, tone, empty }) => {
  const [ref, { width }] = useContainerSize();
  const height = Math.min(width, MAX_HEIGHT);
  const outerRadius = height / 2 - 2;
  const ring = outerRadius * RING;
  const barSize = ring * BAR;

  // Recharts draws the first item innermost, so #1 goes last
  const data = tags
    .map((tag, i) => ({ ...tag, fill: PALETTES[tone][i] }))
    .reverse();

  const renderLabel = (props: LabelProps) => {
    // RadialBar labels always get a polar view box
    const { cx = 0, cy = 0, innerRadius = 0, outerRadius: outer = 0 } =
      (props.viewBox ?? {}) as { cx?: number; cy?: number; innerRadius?: number; outerRadius?: number };
    const tag = data[props.index ?? 0];
    if (!tag) return <g />;
    const share = percent(tag.share);
    // Room left of the ring start, minus the percentage and a space
    const maxChars = Math.floor((cx - barSize) / CHAR_WIDTH) - share.length - 1;
    const name =
      tag.label.length > maxChars ? `${tag.label.slice(0, Math.max(1, maxChars - 1))}…` : tag.label;

    return (
      <text
        x={cx - barSize / 2 - 6}
        y={cy - (innerRadius + outer) / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={12}
      >
        <title>{`${tag.label} · ${share} of sessions`}</title>
        <tspan fill="var(--foreground)" fontWeight={600}>
          {name}
        </tspan>
        <tspan fill="var(--muted-foreground)"> {share}</tspan>
      </text>
    );
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6">
      <h2 className="text-lg">{title}</h2>
      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div
          ref={ref}
          role="img"
          aria-label={`${title}: ${tags.map((t) => `${t.label} ${percent(t.share)} of sessions`).join(", ")}`}
          className="mt-4 w-full"
          style={{ height: height || MAX_HEIGHT }}
        >
          {width > 0 && (
            <RadialBarChart
              width={width}
              height={height}
              data={data}
              startAngle={90}
              endAngle={-180}
              // Fixed ring width, so fewer rings keep #1 at the outside
              innerRadius={outerRadius - ring * tags.length}
              outerRadius={outerRadius}
              barSize={barSize}
            >
              <PolarAngleAxis type="number" domain={[0, tags[0].share]} tick={false} />
              <RadialBar
                dataKey="share"
                cornerRadius={barSize / 2}
                label={{ content: renderLabel }}
                isAnimationActive
              />
            </RadialBarChart>
          )}
        </div>
      )}
    </section>
  );
};

export default TopTagsChart;
