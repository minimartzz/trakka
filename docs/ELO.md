# Elo

How Trakka calculates Elo. Terms (Elo, Calibration, Calibrated, Elo Change, Matchup, Rated Session, Elo King) are defined in [CONTEXT.md](../CONTEXT.md).

## Scope

- Each player has one Elo **per game**, shared across every Tribe, so values can be compared across Tribes.
- Only **Rated Sessions** affect Elo: competitive individual or team sessions marked as rated. Coop and solo sessions never do.
- Game complexity (weight, length) is **not** part of Elo. It is reserved for a future cross-game "overall skill" measure.
- Inactivity has no effect. Time between sessions changes neither Elo nor K.

## Shape

- Every player starts every game at **0**.
- Most established players are expected to sit between **100 and 500**. There is no upper limit, so strong players can go past 500.
- **The Calibration period (first 5 Rated Sessions):** Elo moves at full speed (highest K).
- **Below 100:** a player can't lose Elo, in or after the Calibration period. A bad session leaves them where they were, so a player who never wins stays at 0.
- **The floor (100):** once a player reaches 100, they can never drop below it.
- A player is **in Calibration** for exactly their first 5 Rated Sessions of the game, whatever their Elo. Their Elo is always shown, with an asterisk while they are in Calibration.

## Constants

| Name | Value | Meaning |
|---|---|---|
| `START` | 0 | Starting Elo for every player in every game |
| `FLOOR` | 100 | Below this, Elo can't go down. Once reached, Elo can't fall below it. |
| `CALIBRATION_SESSIONS` | 5 | Length of the Calibration period, in Rated Sessions |
| `K_CALIBRATION` | 70 | K for each session in the Calibration period |
| `K_START` | 70 | Where K starts tapering from after the Calibration period. It equals `K_CALIBRATION`, so the curve has no sudden drop. |
| `K_MIN` | 12 | K the curve settles towards |
| `TAU` | 30 | How slowly K tapers after the Calibration period, in sessions |
| `SCALE` | 400 | Elo gap at which the higher player is expected to win 10 to 1 |

The values were tuned with simulations of small groups (2–5 players, about 3.6 per session) with varied skill. The aim was for the median to land around **200** once players have about 10–15 sessions of a game.

| Sessions per player | Bottom 10% | Median | Top 10% | Highest |
|---|---|---|---|---|
| ~4 | 0 | ~100 | ~250 | ~410 |
| ~14 | 100 | ~205 | ~415 | ~615 |
| ~27 | 100 | ~260 | ~500 | ~735 |

The median keeps creeping up with play, because the floor keeps absorbing losses: about 305 at ~54 sessions each and 330 at ~108. Tribes where players join over time sit up to about 30 lower than Tribes whose players all start together.

## Calculation

Sessions of a game are processed in `(datePlayed, createdAt, sessionId)` order. Each session uses the values every player had before that session.

### Inputs per player *i*

- `Rᵢ`: current Elo for this game, starting at `START`
- `nᵢ`: number of Rated Sessions of this game already played
- Player *i* is **in Calibration** (the Calibration period) while `nᵢ < CALIBRATION_SESSIONS`

### 1. K: scaling factor

K sets how far one session can move a player. It is only applied to the final sum (step 4).

```
Kᵢ = K_CALIBRATION                                   if nᵢ < CALIBRATION_SESSIONS
   = K_MIN + (K_START − K_MIN) · e^(−(nᵢ − 5) / TAU)   otherwise
```

| n | 0–5 | 10 | 20 | 35 | 50 |
|---|---|---|---|---|---|
| K | 70 | ~61 | ~47 | ~33 | ~25 |

The first 5 sessions run at full K so new players find their level quickly. After that, K tapers off slowly, with no sudden drop. A slow taper keeps an overrated player's losses large enough to pull them back down quickly (see [Self-correction](#self-correction)).

### 2. Sides

- **Individual session:** each player is a side.
- **Team session:** each team is a side, with `R_side = mean(Rᵢ of members)`.
- A side's position is its shared `position`. A session with fewer than 2 sides is skipped.

### 3. Matchups: winning probability W

Each side is compared with every other side. For a pair of sides A and B:

```
W_AB = 1 / (1 + 10^((R_B − R_A) / SCALE))

S_AB = 1    if pos_A < pos_B   (A finished ahead)
     = 0.5  if pos_A = pos_B   (tie)
     = 0    if pos_A > pos_B
```

`W_AB` is how likely A was to beat B given their Elo before the session. A Matchup's preliminary change is `S_AB − W_AB`. W is what does most of the work:

- Beating someone you were expected to beat (high W) earns little.
- An upset (low W) earns a lot.
- Losing to someone you were expected to beat costs a lot.

| Elo gap | 0 | 50 | 100 | 200 | 300 | 400 |
|---|---|---|---|---|---|---|
| W for the higher player | 0.50 | 0.57 | 0.64 | 0.76 | 0.85 | 0.91 |

### 4. Elo Change

For player *i* on side A, the preliminary changes from every Matchup are summed and then scaled by K:

```
ΔRᵢ = Kᵢ · Σ over every other side B of (S_AB − W_AB)
```

- This is a sum, not an average, so a session with more opponents can move a player further. For example, a newcomer who wins a 5-player session against equal opponents gets `70 × 4 × 0.5 = +140`.
- Teammates share their side's `W` and `S`, but each uses their own `Kᵢ`.

### 5. Update: climb and floor

```
Rᵢ' = max(Rᵢ + ΔRᵢ, min(Rᵢ, FLOOR))
nᵢ' = nᵢ + 1
```

| Before the session | ΔR | After |
|---|---|---|
| Below 100 | loss | unchanged |
| Below 100 | gain | `Rᵢ + ΔRᵢ` |
| 100 or more | gain | `Rᵢ + ΔRᵢ` |
| 100 or more | loss | `Rᵢ + ΔRᵢ`, but never below 100 |

Any gain from below 100 can cross 100.

Values are stored unrounded. The displayed Elo Change is `round(Rᵢ') − round(Rᵢ)`. So a loss below 100 shows as ±0, and so does a loss that stops at the floor when the player was already at 100.

Elo is not zero-sum. Gains and losses in a session don't cancel out, for three reasons:

- K differs between players.
- Players below 100 can't lose.
- The floor absorbs losses.

The last two add Elo to the system over time, which is what lifts players into the 100–500 range.

## Worked example

A 4-player individual session.

| Player | Elo | n | K | Finish |
|---|---|---|---|---|
| Alice | 320 | 20 | 47.2 | 2nd |
| Bob | 60 | 2 (Calibration period) | 70 | 1st |
| Cara | 250 | 10 | 61.1 | 4th |
| Dan | 110 | 40 | 30.1 | 3rd |

**Alice** (K = 47.2)

| Opponent | W | S | S − W |
|---|---|---|---|
| Bob | 0.817 | 0 | −0.817 |
| Cara | 0.599 | 1 | +0.401 |
| Dan | 0.770 | 1 | +0.230 |
| **Sum** | | | **−0.187** |

ΔR = 47.2 × −0.187 = **−8.8**, giving 311.2. Losing to the lowest-rated player costs her more than her two expected wins earn.

**Bob** (K = 70, Calibration period)

| Opponent | W | S | S − W |
|---|---|---|---|
| Alice | 0.183 | 1 | +0.817 |
| Cara | 0.251 | 1 | +0.749 |
| Dan | 0.429 | 1 | +0.571 |
| **Sum** | | | **+2.138** |

ΔR = 70 × 2.138 = **+149.6**, giving 209.6. He is past 100 but has played only 3 sessions, so he is still in Calibration.

**Cara** (K = 61.1)

| Opponent | W | S | S − W |
|---|---|---|---|
| Alice | 0.401 | 0 | −0.401 |
| Bob | 0.749 | 0 | −0.749 |
| Dan | 0.691 | 0 | −0.691 |
| **Sum** | | | **−1.841** |

ΔR = 61.1 × −1.841 = **−112.5**, giving 137.5.

**Dan** (K = 30.1)

| Opponent | W | S | S − W |
|---|---|---|---|
| Alice | 0.230 | 0 | −0.230 |
| Bob | 0.571 | 0 | −0.571 |
| Cara | 0.309 | 1 | +0.691 |
| **Sum** | | | **−0.110** |

ΔR = 30.1 × −0.110 = **−3.3**, giving 106.7.

**What if, instead:**

- **Below 100:** had Bob finished last, his sum would be −0.862 and ΔR = −60.4. He is below 100, so he would stay at 60, shown as "±0*". The same applies after the Calibration period, when he would be Calibrated even though he is below 100.
- **The floor:** had Dan finished last, his sum would be −1.110 and ΔR = −33.4. 110 − 33.4 = 76.6 is below the floor, so he would stop at 100.

## Self-correction

W pulls an overrated player back down: they gain little from expected wins and lose a lot from unexpected losses. K tapers slowly after the Calibration period, so that pull stays strong.

Simulated case: a Tribe with A at 350 (n=20), B at 250 (n=15) and C at 150 (n=10). A newcomer wins five 4-player sessions in a row, then finishes last in the 6th.

| After session | 1 | 2 | 3 | 4 | 5 | 6 (last) |
|---|---|---|---|---|---|---|
| Newcomer | 168 | 286 | 367 | 427 | 474 | 303 |
| A | 337 | 327 | 325 | 328 | 333 | 382 |
| B | 207 | 179 | 166 | 160 | 158 | 206 |
| C | 100 | 100 | 100 | 100 | 100 | 115 |

The single loss costs the newcomer 171, about a third of the 474 they gained. The veterans pay for the newcomer's streak, because their K is still fairly high: B loses 92 over the five sessions.

If the newcomer is really only as good as B, they settle quickly. Their median Elo over 2,000 simulated runs:

| Sessions played | 7 | 11 | 16 | 26 | 36 |
|---|---|---|---|---|---|
| Median Elo | ~250 | ~265 | ~265 | ~270 | ~275 |

## Recalculation

Elo depends on session order, so it is always recalculated by **replaying** a game's Rated Sessions forwards from a given date.

- **New session:** replay its game from its `datePlayed`. A session logged with a past date rewrites every later Elo for that game.
- **Edited session:** replay from the earlier of the old and new dates. If the edit changes the game, replay both games. The edit keeps the session's original `createdAt`.
- **Deleted session:** replay from its date, through the same replay entry point.
- **Anonymous player claimed:** replay every game the merged profile has played.
- **Launch:** backfill by replaying every game from its first session.

A replay runs inside the same transaction as the write, under a lock per game.

## Display

Elo is never hidden.

### Session card, per player row

Each player in a Rated Session shows their Elo Change for that session:

- an up arrow in green for a gain, e.g. "↑18"
- a down arrow in red for a loss
- "±0" for no change

If the player is still in Calibration after the session, the number has an asterisk, e.g. "↑10*".

These are visible to everyone who can see the session.

### Session card, current user

The viewer's Elo after the session appears in a box under the result badge, e.g. "ELO 263". The box is coloured by tier:

| Elo | 0–99 | 100–199 | 200–299 | 300–399 | 400–499 | 500+ |
|---|---|---|---|---|---|---|
| Tier | Iron | Bronze | Silver | Gold | Emerald | Purple |

The tier uses the Elo as displayed (rounded).

If they are still in Calibration after the session, the number has an asterisk, e.g. "ELO 10*".

### Badges

- **Elo King:** one per Tribe. It goes to the eligible member with the highest Elo in any single game where they are Calibrated, using their global Elo. A tie goes to the player with more Rated Sessions of that game. Only the badge is shown, with no value.
- **Underdog:** an upset is winning against a player whose `elo_before` for that session was higher than the winner's. It only counts if both players were Calibrated going into the session (`elo_sessions_before ≥ 5`).
