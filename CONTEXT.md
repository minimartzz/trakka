# Trakka

Trakka tracks board game sessions played within Tribes and turns them into player statistics and skill measures.

## Language

### Skill measures

**Elo**:
A player's skill number for one specific game, shared across every Tribe they play in. Every player starts each game at 1500.
_Avoid_: rating, game rating, skill rating

**Calibration**:
The period covering a player's first 5 Rated Sessions of a game. During it their Elo changes but is never shown.
_Avoid_: provisional, placement

**Calibrated**:
A player who has finished Calibration for a game, so their Elo for that game is visible.

**Elo Change**:
How far one Rated Session moved a player's Elo. It belongs to that session.
_Avoid_: delta, gain

**Matchup**:
A head-to-head comparison between two players, or two teams, within one Rated Session. A session's Elo Changes come from all of its Matchups.
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
