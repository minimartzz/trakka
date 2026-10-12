# Elo is stored on session rows and recalculated by replay

Elo depends on the order sessions were played in, but sessions can be backdated, edited, merged by an anonymous-player claim, and in future deleted. Rather than applying Elo Changes incrementally, Elo is always derived by replaying a game's Rated Sessions forwards from the earliest affected date. The result is written to `elo_before` / `elo_after` on each `comp_game_log` row, so every Elo Change stays attached to the session that earned it. A separate per-(player, game) table caches each player's current Elo. Because of this, any write to a session can rewrite every later Elo for that game. The replay runs inside the write's transaction, under a lock per game.

## Consequences

- The session edit flow must run in a transaction and keep the original `createdAt`, otherwise an edited session moves within its day and replay order changes.
- Changing any constant in `ELO.md` requires a full replay. Nothing needs migrating.
