# Elo is global per game, not per Tribe

Every other player stat in Trakka is scoped per Tribe, but each player has a single Elo per game shared across all Tribes. Profiles are already global. A per-Tribe Elo would leave small Tribes with too few Rated Sessions for Elo to settle, and it would make Elo impossible to compare across Tribes. Game complexity is deliberately left out of per-game Elo: a game's weight and length are almost constant across its sessions, so they are reserved for a future cross-game "overall skill" measure.

## Considered Options

- **Per (player, game, Tribe):** rejected. Too little data per Tribe, and the same player would have several Elos for one game.
- **Complexity as a K multiplier:** rejected. It only changes how volatile a game is and adds nothing to a single game's Elo.
