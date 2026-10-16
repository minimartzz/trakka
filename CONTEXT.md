# Trakka

Trakka tracks board game sessions played within Tribes and turns them into player statistics and skill measures.

## Language

### Skill measures

**Elo**:
A player's skill number for one specific game, shared across every Tribe they play in. Every player starts each game at 0. While below 100, a player can't lose Elo. Once a player reaches 100, they can never drop below it.
_Avoid_: rating, game rating, skill rating

**Calibration**:
A player's first 10 Rated Sessions of a game, also called the Calibration period. Elo moves fastest here, and slows a little with each session. Their Elo is always shown, with an asterisk.
_Avoid_: provisional, placement, hidden

**Calibrated**:
A player who has played 10 or more Rated Sessions of a game, whatever their Elo.

**Elo Change**:
How far one Rated Session moved a player's Elo. It belongs to that session.
_Avoid_: delta, gain

**Matchup**:
A head-to-head comparison between two players, or two teams, within one Rated Session. A player's Elo Change for a session is the sum of all their Matchups, scaled by K.
_Avoid_: duel, pairing

**Elo King**:
The Tribe badge held by the member with the highest Calibrated Elo in any single game.
_Avoid_: ELO King (old WPA-based meaning)

**WPA**:
The existing complexity-weighted per-session score, totalled per Tribe. It is separate from Elo.
_Avoid_: Elo, score

### Sessions

**Rated Session**:
A competitive session, played individually or in teams and marked as rated. Only Rated Sessions affect Elo. Coop and solo sessions never do.
_Avoid_: VP session, ranked session

**Session Rating**:
The 0–5 star score a player gives a session.
_Avoid_: rating (on its own)
