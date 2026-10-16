# AGENTS.md

Project guidelines for coding agents live in `.claude/CLAUDE.md`. The sections below are the per-repo configuration for the engineering skills.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`minimartzz/trakka`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) plus a `priority:low|medium|high` label on every triaged issue. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
