# Product

## Register

product

## Users

Board game enthusiasts across three modes of use:

- **At the table (mobile)**: logging scores mid-session or immediately after; quick inputs, glanceable results, forgiving of ambient lighting in a 9pm living room.
- **Post-session (desktop)**: digging into stats, comparing performance, reviewing tribe history; comfortable with data density.
- **Group organizers (any device)**: managing tribes, tracking standings, overseeing community health, handling join requests.

The product spans casual friend groups to serious competitive circles. Design must work for both: not too casual for the numbers people, not too intimidating for newcomers.

## Product Purpose

Trakka tracks board game sessions and surfaces who's winning what across a tribe (group). A cross-game ranking gives players a single number to compare themselves on, even across games with different scoring systems.

Success is a **game-night habit**: tribes log every session, return weekly, and check the leaderboard between sessions. Engagement is per-tribe, not solo. The at-the-table mobile flow has to be fast enough that nobody resents pulling out their phone after the last move. The post-session stats dive has to reward the player who comes back hours later wanting to know how they're trending.

## Brand Personality

Three words: **Community, Nerdy, Interactive**.

- **Community** — Not a solo stats tracker. The tribe is the unit. Who won game night, where everyone stands, what the rivalry looks like. Faces, names, and relative standings should appear earlier and more often than raw counts.
- **Nerdy** — Users love numbers. Don't bury stats behind progressive disclosure; reward the data-hungry. Information density is a feature, not a problem to flatten away.
- **Interactive** — The app should feel alive. Standings change. Streaks are threatened. Comparisons should feel like challenges. The interface has stakes.

## Anti-references

- **Notion / Linear** — too flat, too pastel, too "productivity tool". Trakka should feel more like a sports platform than a workspace.
- **Generic SaaS dashboards** — icon + heading + text card grids, hero-metric templates, gradient text headlines. Already present in the codebase and being phased out.
- **Mobile games (candy / casual)** — not playful or cartoonish. The nerdy user base takes their stats seriously.

## Design Principles

1. **Numbers first, chrome second.** Stats, scores, and rankings are the most visually prominent elements on any screen. Don't bury them in card padding or muted text. If a number matters, it should look like it matters.
2. **The tribe is the product.** Every screen reminds users they're part of a group. "You vs. the tribe" is the core emotional hook; surface player avatars, names, and relative standings earlier than generic labels.
3. **Competitive energy without aggression.** The interface feels like the moment before a game starts: focused, a little tense, fun. Not cold, not sterile. Use color purposefully to signal outcomes without over-dramatizing.
4. **Density is a feature.** Yahoo Finance is intentional as a reference. Users who want to dig can dig. Tables can have many rows. Stats can stack. Use hierarchy (size, weight, contrast) to make density navigable instead of flattening it away.
5. **Motion signals state, not decoration.** A new session logged, a position changed in standings, a request accepted: motion exists to make those state changes felt. Not as default page-load choreography.

## Accessibility & Inclusion

- **WCAG 2.2 AA** for contrast across all text and interactive controls.
- **Color-vision safe outcome vocabulary.** Wins and losses use the green / destructive palette AND a non-color indicator (trophy icon, position number, explicit label). Never rely on hue alone to distinguish W/L/T; deuteranopia and protanopia together affect roughly 5% of male users.
- **Respect `prefers-reduced-motion`** across the app. Motion is meaningful, not load-bearing for the experience; the reduced-motion path is a clean crossfade or instant transition, never a content-blocked fallback.
- **Touch targets ≥44×44 px** on mobile, especially relevant for the at-the-table logging flow.