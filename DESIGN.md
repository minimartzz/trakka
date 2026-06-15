---
name: Trakka
description: A board game session tracker where the tribe is the unit and numbers are the hero.
colors:
  brand-blue: "oklch(41.12% 0.1454 262.39)"
  brand-blue-bright: "oklch(57.61% 0.1504 262.63)"
  ink-night: "oklch(18.26% 0.0196 265.9)"
  ink-card-night: "oklch(20.44% 0.0215 263.92)"
  ink-paper: "oklch(25.3% 0.0321 265.95)"
  page-day: "oklch(1 0 0)"
  page-day-muted: "oklch(98.46% 0.0017 247.84)"
  win-green: "oklch(86.09% 0.1035 156.53)"
  win-green-night: "oklch(88% 0.08 156.53)"
  tie-teal: "oklch(76.13% 0.0869 203.06)"
  tie-teal-night: "oklch(82% 0.06 203.06)"
  loss-red: "oklch(63.68% 0.2078 25.33)"
  loss-red-night: "oklch(56.27% 0.1974 26.33)"
  signal-violet: "oklch(57.59% 0.2098 276.65)"
  signal-violet-night: "oklch(68% 0.15 276.65)"
  muted-day: "oklch(53.41% 0.0386 264.97)"
  muted-night: "oklch(70.77% 0.0282 264.38)"
  border-day: "oklch(91.78% 0.0104 261.79)"
  border-night: "oklch(28.43% 0.03 262.75)"
typography:
  display:
    fontFamily: "Barlow Condensed, 'Arial Narrow', sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Barlow, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum'"
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.04em"
  brand-wordmark:
    fontFamily: "Asimovian, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.page-day}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-blue-bright}"
  button-outline:
    backgroundColor: "{colors.page-day}"
    textColor: "{colors.ink-paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  chip-filter:
    backgroundColor: "{colors.page-day}"
    textColor: "{colors.ink-paper}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  chip-filter-active:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.page-day}"
  card-night:
    backgroundColor: "{colors.ink-card-night}"
    textColor: "{colors.page-day-muted}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink-paper}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
---

# Design System: Trakka

## 1. Overview

**Creative North Star: "The Living Room Broadcast"**

Imagine the screen between innings on a sports broadcast. Standings update, scores stack, faces appear, the next matchup ticks down. The energy is focused, the typography is condensed and confident, the numbers are the message. Now place that screen on the coffee table where four people just finished a game of Catan: same energy, smaller stakes, more intimate. That is Trakka's surface.

The system runs dark-first because game nights happen in living rooms at 9pm. Deep blue carries the brand, the page, and the chrome; saturated accents (green, teal, red) signal outcomes and never decorate. Barlow Condensed handles the broadcast-style headers (player names, scores, standings); Figtree carries the dense body content where players actually read their numbers. Density is a feature: tables run long, stats stack, leaderboards reward the player who scrolls.

This system explicitly rejects three families: the flat productivity look (Notion, Linear) that would make Trakka feel like project management instead of sport; the generic SaaS dashboard (icon + heading + text card grid, hero-metric template, gradient text headlines) that has nothing to do with games; and the casual mobile-game playfulness (rounded mascots, candy colors, cartoonish micro-interactions) that disrespects how seriously the user takes their stats.

**Key Characteristics:**
- Dark-first, with a real light mode for users who prefer it (not an afterthought).
- Tabular numerals globally; alignment is non-negotiable in a stats app.
- Display face (Barlow Condensed) used purposefully for scores and standings, not as eyebrow decoration.
- One brand blue, four semantic accents (green / teal / red / violet), no further hues.
- Motion lives in three places only: new sessions logged, standings shifting, async state resolving.

## 2. Colors

The palette is **Committed**: deep brand blue carries the surface in both modes (saturated in light, deeper in dark), with five named accents reserved for outcome and signal. Neutrals tint toward the same blue so every gray feels like part of the brand, never a default.

### Primary
- **Brand Blue** (`oklch(41.12% 0.1454 262.39)`): Primary actions, links, focus rings, brand surfaces in light mode. The single hue the user associates with Trakka.
- **Brand Blue Bright** (`oklch(57.61% 0.1504 262.63)`): Same role in dark mode. Lifted lightness so it reads on a `ink-night` background without losing saturation.

### Secondary (semantic accent vocabulary)
- **Win Green** (`oklch(86.09% 0.1035 156.53)` light / `oklch(88% 0.08 156.53)` dark): Reserved for win outcomes. Trophy badges, the "Won" chip dot, leaderboard winner highlight. **Never decorative.**
- **Tie Teal** (`oklch(76.13% 0.0869 203.06)` light / `oklch(82% 0.06 203.06)` dark): Reserved for ties and performance markers. The "Tie" chip dot, handshake icon, tied-position indicators.
- **Loss Red** (`oklch(63.68% 0.2078 25.33)` light / `oklch(56.27% 0.1974 26.33)` dark): Reserved for losses and destructive actions (request rejection, delete). Used as a chip dot for "Lost" and as the destructive-action color, never to flag a warning.
- **Signal Violet** (`oklch(57.59% 0.2098 276.65)` light / `oklch(68% 0.15 276.65)` dark): Reserved for notifications and badges that demand attention without being celebratory. Inbox indicators, badge counts, the share button.

### Neutral
- **Ink Night** (`oklch(18.26% 0.0196 265.9)`): The dark-mode page. Deep blue-tinted, never pure black.
- **Ink Card Night** (`oklch(20.44% 0.0215 263.92)`): The dark-mode card surface, one perceptual step above the page so cards feel lifted without a shadow.
- **Ink Paper** (`oklch(25.3% 0.0321 265.95)`): The light-mode body text and dark-mode equivalent for high-contrast labels.
- **Page Day** (`oklch(1 0 0)`): Light-mode page and card. Pure white in this system, not a cream-warmed off-white.
- **Muted** (`oklch(53.41% 0.0386 264.97)` light / `oklch(70.77% 0.0282 264.38)` dark): Secondary copy, helper text, axis labels. Never used as primary body text.
- **Border** (`oklch(91.78% 0.0104 261.79)` light / `oklch(28.43% 0.03 262.75)` dark): Hairline borders, dividers, input strokes. Tinted toward brand blue.

### Named Rules

**The Outcome-Or-Nothing Rule.** Green, teal, red, and violet exist to communicate outcome or status. They never decorate. A green icon on a non-win element is a bug; a red border on a non-destructive surface is a bug; a violet badge on a non-actionable surface is a bug.

**The One Blue Rule.** Trakka has one brand color. New blues are not introduced for "variety"; the existing `brand-blue` carries primary actions, focus rings, the wordmark, the sidebar, and link affordances. Adding a second blue dilutes the recognition.

**The Color-Vision Safe Rule.** Green / red outcomes always travel with a non-color indicator: a `Trophy` icon, a position number, an explicit "W" / "L" label, or the chip's textual label. Never rely on hue alone to distinguish win from loss.

## 3. Typography

**Display Font:** Barlow Condensed (with `'Arial Narrow', sans-serif` fallback)
**Heading Font:** Barlow (applied automatically to every `<h1>` - `<h6>`)
**Body Font:** Figtree (with `system-ui, sans-serif` fallback)
**Brand Font:** Asimovian (reserved exclusively for the TRAKKA wordmark; never used in UI)
**Mono Font:** Geist Mono (data tables and stat groups where digit alignment matters even more than `tabular-nums` already provides)

**Character:** Barlow Condensed is the broadcast scoreboard. Tall, condensed, confident at large sizes; the wordmark of every sports overlay since the 1990s. Figtree is the player on the couch: humanist, warm, readable at small sizes. The pairing carries the brand's competitive-but-not-cold energy without either face trying too hard.

### Hierarchy

- **Display** (Barlow Condensed, 700, `clamp(2.25rem, 4.5vw, 3.5rem)`, line-height 1.1, letter-spacing -0.01em): Page titles where the page is about a number ("My Recent Games", scoreboard headers). Triggered explicitly via the `.font-display` utility, not by default heading semantics.
- **Headline** (Barlow, 600, 1.5rem, line-height 1.25): Section titles inside a page. The default `<h2>`.
- **Title** (Barlow, 600, 1.125rem, line-height 1.3): Card titles, popover titles. The default `<h3>`.
- **Body** (Figtree, 400, 1rem, line-height 1.6, `font-variant-numeric: tabular-nums`): All paragraph and label copy. Capped at 65-75ch for prose; data tables run wider.
- **Label** (Figtree, 600, 0.75rem, letter-spacing 0.04em): Short uppercase chips and badges only (≤4 words). Never used on paragraphs.

### Named Rules

**The Tabular-Nums-Always Rule.** Every number in Trakka aligns. `font-variant-numeric: tabular-nums` is set on `body` and inherits down; never override with `lining-nums` or `proportional-nums` even in display contexts. A leaderboard where "12" and "127" don't line up is broken.

**The Asimovian-For-Brand-Only Rule.** Asimovian appears on the TRAKKA wordmark and nowhere else. It is not for hero headings, not for callouts, not for badges. Other display energy goes to Barlow Condensed.

## 4. Elevation

The system is **flat-by-default with tonal layering** for surface depth. Dark mode lifts `card` and `popover` one perceptual step above `page` (`ink-card-night` vs `ink-night`); light mode uses borders instead of shadow because shadows on pure-white surfaces read as smudges. Drop shadows exist but are scoped to two specific moments: a soft elegant elevation on featured cards and a subtle glow on focused brand surfaces.

### Shadow Vocabulary

- **Elegant** (`box-shadow: 0 10px 30px -10px oklch(41.12% 0.1454 262.39 / 0.1)` light, `/ 0.2` dark): Reserved for hero CTAs and featured cards on landing surfaces. Tinted toward brand blue, never neutral gray.
- **Glow** (`box-shadow: 0 0 40px oklch(41.12% 0.1454 262.39 / 0.2)` light, `oklch(67.71% 0.0942 263.35 / 0.3)` dark): Used sparingly on focused brand elements (sign-up CTA, primary marketing surfaces). Never on standard product UI controls.

### Named Rules

**The Flat-Until-Hovered Rule.** Cards in the product UI are flat at rest. Hover may add a 1px border-shift or a background tint; full shadow elevation is reserved for marketing and signature CTAs only. A drop shadow on every card is dashboard-cliché.

**The Dark-Lifts-Light-Borders Rule.** In dark mode, surfaces lift via a brighter tonal step (`ink-card-night` over `ink-night`). In light mode, surfaces separate via the `border-day` hairline (no shadow). Never apply both simultaneously.

## 5. Components

### Buttons
- **Shape:** Lightly rounded (`0.5rem` / `rounded.md`). Never pill-shaped except on icon-only floating actions.
- **Primary:** `brand-blue` background, white text. Hover lifts toward `brand-blue-bright`. The de-facto "the main thing on this screen" affordance.
- **Outline:** Transparent background, `border-day`/`border-night` stroke, `ink-paper` text. The default for secondary actions and filter chips.
- **Ghost:** No background, no border, hover gets a `muted/30` tint. For inline actions in cards and table rows.
- **Hover / Focus:** Focus rings use `--ring` (matches `brand-blue` in both modes), 2px offset, `outline-none` is forbidden without a replacement.
- **Sizes:** Default 36px height; `size="sm"` 32px; `size="icon"` square. Touch targets ≥44×44 are guaranteed via padding even on the small sizes when used on mobile sheets.

### Chips
- **Shape:** Same `rounded.md` as buttons; chips are styled buttons, not a separate primitive.
- **Filter chip:** Outline variant at rest; primary variant when active. Each chip carries a **semantic dot** (`.size-1.5 .rounded-full`) before its label, colored by what it filters: `win-green` for Won, `tie-teal` for Tie, `loss-red` for Lost, `brand-blue` for All.
- **Count slot:** Numerical counts inside chips use the mono fallback (`font-mono tabular-nums text-xs opacity-70`) so they read as data, not part of the label.
- **State announcement:** Chip filter groups carry `role="group"` and each chip carries `aria-pressed`.

### Cards / Containers
- **Corner Style:** `rounded.lg` (`0.75rem`) for content cards; `rounded.md` for compact controls.
- **Background:** `card` token in both modes (white in light, `ink-card-night` in dark).
- **Border:** 1px `border-day`/`border-night` hairline. Borders carry weight; shadows do not.
- **Internal Padding:** `lg` (24px) for content cards, `md` (16px) for compact ones. Avoid `sm` padding on cards; under that, lose the card entirely.
- **Don't nest.** A card inside a card is always wrong.

### Inputs / Fields
- **Style:** Transparent background (so embedded inputs inherit their parent's surface), `border-day`/`border-night` stroke, `rounded.md` corners.
- **Focus:** 1px `--ring` outline with 2px offset. No glow.
- **Embedded variant:** When an input is nested inside an already-bordered container (search-in-card), pass `bg-transparent dark:bg-transparent border-0 shadow-none focus-visible:ring-0` so it inherits the parent's surface instead of stacking a second tinted rectangle on top. (Fixed regression: shadcn's default `dark:bg-input/30` does not blend with `bg-card` and creates a visible inner rectangle.)
- **Mobile autofocus:** Conditional on `(pointer: fine)`. On touch devices, opening a dropdown should not pop the soft keyboard; users tap into the input themselves.

### Navigation
- **Sidebar:** Dedicated tokenset (`sidebar`, `sidebar-foreground`, etc.). One persistent rail in the authenticated app, collapsible on mobile via shadcn's Sidebar primitive.
- **Top header:** Light, sticky, hosts the share button, new-session CTA, and global search.
- **Active state:** Background tint via `bg-slate-700` in dark mode (or `bg-accent` in light), never an underline.

### Signature: The Session Filter Strip
The chip row above any session list (Recent Games, Tribe history, Player view) is a signature component. Four chips, each carrying a semantic color dot and a tabular-nums count, expose the partition of the user's record (All = Won + Lost) at a glance. The strip doubles as both a filter input and a stats summary. Pattern:
```
[● All  N]  [● Won  N]  [● Lost  N]  [● Tie  N]
```
The dot color encodes the semantic role (green / red / teal / blue), the label is human, the count is data. Selected state inverts to `brand-blue` background. The strip is the single most repeated pattern across the product; treat it as canonical.

### Signature: The Status Strip
Below the filter row, a context-aware count line: "Showing N of M sessions" when filtered, "M sessions" when not. Combined with an inline "Clear filters" link that appears only when filters are non-default. This is how Trakka tells the user what their filter narrowed without a separate badge or counter.

## 6. Do's and Don'ts

### Do:
- **Do** use `.font-display` (Barlow Condensed) for page titles where the page is about a number ("My Recent Games", scoreboard headers, leaderboard pages).
- **Do** carry semantic color dots on every filter chip group; the dot encodes the role, the label encodes the human meaning.
- **Do** ship every chart, list, and stat with tabular numerals. `font-variant-numeric: tabular-nums` is set on `body` and inherits; do not override.
- **Do** treat dark mode as the design target. Light mode is supported but the dark composition is what the brand looks like.
- **Do** pair every win/loss color signal with a non-color indicator (trophy icon, position number, explicit label). The Color-Vision Safe Rule is non-negotiable.
- **Do** use the existing accent vocabulary (`accent-1` through `accent-5`, `destructive`) for outcome signaling; do not introduce new accent colors for variety.
- **Do** keep filter chip groups announced as `role="group"` with `aria-pressed` per chip.

### Don't:
- **Don't** add a tiny uppercase tracked eyebrow ("ABOUT", "STATS", "FILTER BY:") above each section. The chips already say "Filter"; visual labels duplicating the affordance are AI scaffolding.
- **Don't** use border-left or border-right greater than 1px as a colored accent on cards, list items, callouts, or alerts. Ever.
- **Don't** put `background-clip: text` over a gradient to color a heading. Solid colors only for text; emphasis via weight or size.
- **Don't** reach for a glassmorphism blur to mark a surface as special. Glass effects are not part of this system.
- **Don't** ship a card grid of identical icon + heading + text cards. The Notion / generic-SaaS look is in the PRODUCT.md anti-references list for a reason.
- **Don't** use the hero-metric template (big number, small label, supporting stats, gradient accent). Numbers are the hero everywhere; that specific layout is a SaaS marketing tell.
- **Don't** use Asimovian outside the TRAKKA wordmark. Other display moments belong to Barlow Condensed.
- **Don't** rely on hue alone for win/loss signaling. The Color-Vision Safe Rule says no.
- **Don't** apply Tailwind's default `dark:bg-input/30` background on inputs embedded inside `bg-card` containers; they create a visible inner rectangle. Pass `bg-transparent dark:bg-transparent` on those inputs.
- **Don't** animate page-load choreography. Motion is for state changes (new session, standing shift, async resolved), not for "the page is now visible."
- **Don't** introduce a second brand blue, a "warm gray" neutral, or a hue not already named in the palette. The system is intentionally narrow.