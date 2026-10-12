# Elo

How Trakka calculates Elo. Terms (Elo, Calibration, Calibrated, Elo Change, Matchup, Rated Session, Elo King) are defined in [CONTEXT.md](./CONTEXT.md).

## Scope

- Each player has one Elo **per game**, shared across every Tribe, so values can be compared across Tribes.
- Only **Rated Sessions** affect Elo: competitive individual or team sessions marked as rated. Coop and solo sessions never do.
- Game complexity (weight, length) is **not** part of Elo. It is reserved for a future cross-game "overall skill" measure.
- Inactivity has no effect. Time between sessions changes neither Elo nor K.

## Constants

| Name | Value | Meaning |
|---|---|---|
| `BASE` | 1500 | Starting Elo for every player in every game |
| `CALIBRATION_SESSIONS` | 5 | Rated Sessions of a game before Elo is shown |
| `K_MAX` | 80 | K-factor for a player's first session of a game |
| `K_MIN` | 16 | K-factor the curve settles towards |
| `TAU` | 10 | How quickly K decays, measured in sessions |
| `CALIBRATION_DAMPING` | 0.5 | Largest reduction applied to a Calibrated player's Matchup against a side in Calibration |
| `SCALE` | 400 | Standard Elo logistic scale |

## Calculation

Sessions of a game are processed in `(datePlayed, createdAt, sessionId)` order. Each session uses the values every player had before that session.

### Inputs per player *i*

- `Rᵢ`: current Elo for this game, starting at `BASE`
- `nᵢ`: number of Rated Sessions of this game already played
- Player *i* is **in Calibration** while `nᵢ < CALIBRATION_SESSIONS`

### 1. K-factor

```
Kᵢ = K_MIN + (K_MAX − K_MIN) · e^(−nᵢ / TAU)
```

| n | 0 | 5 | 10 | 20 | 40 |
|---|---|---|---|---|---|
| K | 80 | ~55 | ~40 | ~25 | ~17 |

### 2. Sides

- **Individual session:** each player is a side.
- **Team session:** each team is a side, with `R_side = mean(Rᵢ of members)`.
- A side's position is its shared `position`. `N` is the number of sides. A session with fewer than 2 sides is skipped.

### 3. Matchups

For every pair of sides A and B:

```
E_AB = 1 / (1 + 10^((R_B − R_A) / SCALE))

S_AB = 1    if pos_A < pos_B
     = 0.5  if pos_A = pos_B   (tie)
     = 0    if pos_A > pos_B
```

### 4. Elo Change

For player *i* on side A:

```
ΔRᵢ = Σ over every other side B of:   (Kᵢ / (N − 1)) · wᵢB · (S_AB − E_AB)
```

- `Kᵢ / (N − 1)`: player-count scaling. One session moves a player by at most about `Kᵢ`.
- `wᵢB`: Calibration damping.
  - `wᵢB = 1` if player *i* is in Calibration.
  - Otherwise `wᵢB = 1 − CALIBRATION_DAMPING · (share of B's members in Calibration)`.
- Teammates share their side's `E` and `S` but each uses their own `Kᵢ`.

### 5. Update

```
Rᵢ' = Rᵢ + ΔRᵢ
nᵢ' = nᵢ + 1
```

Values are stored unrounded. The displayed Elo Change is `round(Rᵢ') − round(Rᵢ)`.

Elo is not zero-sum. Different K values and Calibration damping mean the gains and losses in a session do not cancel out.

## Worked example

A 4-player individual session, so `N − 1 = 3`.

| Player | Elo | n | K | Finish |
|---|---|---|---|---|
| Alice | 1600 | 30 | 19.2 | 2nd |
| Bob | 1500 | 2 (in Calibration) | 68.4 | 1st |
| Cara | 1550 | 10 | 39.5 | 3rd |
| Dan | 1450 | 50 | 16.4 | 4th |

**Alice:** each Matchup is worth 19.2 / 3 = 6.40.

| Opponent | E | S | w | Contribution |
|---|---|---|---|---|
| Bob | 0.640 | 0 | 0.5 | −2.05 |
| Cara | 0.571 | 1 | 1 | +2.74 |
| Dan | 0.703 | 1 | 1 | +1.90 |

Alice's Elo Change is **+2.6**, giving 1602.6.

**Bob:** each Matchup is worth 68.4 / 3 = 22.8. Bob is in Calibration, so w is always 1.

| Opponent | E | S | Contribution |
|---|---|---|---|
| Alice | 0.360 | 1 | +14.6 |
| Cara | 0.429 | 1 | +13.0 |
| Dan | 0.571 | 1 | +9.8 |

Bob's Elo Change is **+37.4**, giving 1537.4. He has 3 games left in Calibration.

## Recalculation

Elo depends on session order, so it is always recalculated by **replaying** a game's Rated Sessions forwards from a given date.

- **New session:** replay its game from its `datePlayed`. A session logged with a past date rewrites every later Elo for that game.
- **Edited session:** replay from the earlier of the old and new dates. If the edit changes the game, replay both games. The edit keeps the session's original `createdAt`.
- **Deleted session:** replay from its date, through the same replay entry point.
- **Anonymous player claimed:** replay every game the merged profile has played.
- **Launch:** backfill by replaying every game from its first session.

A replay runs inside the same transaction as the write, under a lock per game.

## Display

### Session card, per player row

| State after this session | Shown |
|---|---|
| Still in Calibration | Games left, e.g. "3 games left" |
| This session completed Calibration | Elo as one number with a title, e.g. "ELO 1563" |
| Already Calibrated before this session | Elo Change only, e.g. "+18" |

These are visible to everyone who can see the session.

### Badges

- **Elo King:** one per Tribe. It goes to the eligible member with the highest Calibrated Elo in any single game, using their global Elo. A tie goes to the player with more Rated Sessions of that game. Only the badge is shown, with no value.
- **Underdog:** an upset is winning against a player whose `elo_before` for that session was higher than the winner's. It only counts if both players were Calibrated at the time of the session.
