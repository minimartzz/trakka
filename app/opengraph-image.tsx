import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — board game tracker and stats for your group`;

// DESIGN.md tokens, converted from oklch(). Satori has no oklch support, so
// these are the hex equivalents of the documented palette — no new colors.
const BRAND_BLUE = "#1b4498"; // brand-blue
const INK_NIGHT = "#0e121b"; // ink-night
const CARD_NIGHT = "#121721"; // ink-card-night
const PAPER = "#f0f1f5"; // page-day-muted
const MUTED_NIGHT = "#a2a9ba"; // muted-night
const BORDER_NIGHT = "#2b3446"; // border-night
const WIN_GREEN = "#97e6b6"; // win-green
const LOSS_RED = "#e06666"; // loss-red-night

/**
 * A standings ladder, not a stat card. Per DESIGN.md the tribe is the unit and
 * numbers are the hero — so the card leads with real rows and live deltas
 * rather than the hero-metric template listed in PRODUCT.md's anti-references.
 */
const ROWS = [
  { pos: 1, name: "Jed", wpa: "3.57", delta: "+0.21", up: true },
  { pos: 2, name: "Charmaine", wpa: "3.46", delta: "+0.10", up: true },
  { pos: 3, name: "John", wpa: "3.24", delta: "−0.08", up: false },
  { pos: 4, name: "Rachel", wpa: "3.16", delta: "+0.12", up: true },
];

export default async function Image() {
  // Satori cannot resolve relative URLs; the logo is inlined as a data URI.
  const logo = await readFile(
    join(process.cwd(), "public", "trakka_full_dark.png"),
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: INK_NIGHT,
          // Brand-blue wash from the top-left, echoing the app's hero gradient.
          backgroundImage: `radial-gradient(ellipse 90% 70% at 8% -10%, ${BRAND_BLUE}88, transparent 70%)`,
          fontFamily: "sans-serif",
          padding: "54px 64px 60px",
          justifyContent: "space-between",
        }}
      >
        {/* Header: real logo, and the one line that says what this is */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} height={54} alt={SITE_NAME} />
          <div
            style={{
              display: "flex",
              fontSize: 21,
              color: MUTED_NIGHT,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            trakka.co
          </div>
        </div>

        {/* The claim — the focal point, sized to lead */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 800,
              color: PAPER,
              lineHeight: 1.02,
              letterSpacing: -2.6,
            }}
          >
            Settle who&apos;s actually best.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              color: MUTED_NIGHT,
              marginTop: 16,
              lineHeight: 1.35,
            }}
          >
            Track every session. One rating across every game.
          </div>
        </div>

        {/* Evidence: the standings ladder, edge-to-edge. Density is a feature. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: CARD_NIGHT,
            border: `1px solid ${BORDER_NIGHT}`,
            borderRadius: 14,
            padding: "8px 26px",
          }}
        >
          {ROWS.map((r, i) => (
            <div
              key={r.name}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 0",
                borderTop: i === 0 ? "none" : `1px solid ${BORDER_NIGHT}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 800,
                  // Leader marked with the win token, not brand blue — the
                  // position number itself is the non-colour indicator.
                  color: r.pos === 1 ? WIN_GREEN : MUTED_NIGHT,
                  width: 40,
                }}
              >
                {r.pos}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 27,
                  color: PAPER,
                  fontWeight: r.pos === 1 ? 700 : 500,
                  flex: 1,
                }}
              >
                {r.name}
              </div>
              {/* Arrow + sign, so direction never relies on hue alone. */}
              <div
                style={{
                  display: "flex",
                  fontSize: 20,
                  fontWeight: 700,
                  color: r.up ? WIN_GREEN : LOSS_RED,
                  width: 96,
                  justifyContent: "flex-end",
                }}
              >
                {r.up ? "▲" : "▼"} {r.delta}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 29,
                  fontWeight: 700,
                  color: PAPER,
                  width: 92,
                  justifyContent: "flex-end",
                }}
              >
                {r.wpa}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
