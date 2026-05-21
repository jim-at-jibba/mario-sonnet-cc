# Mushroom Kingdom Side-Scroller — Anthropic Sonnet 4.7

A browser-based Mario-style 2D platformer built in Phaser 3, produced as one run in
a multi-model benchmark. Every run implements the same spec (`prd.md`): a single
polished, procedurally-generated level with running, jumping, enemy stomps, coins
and power-ups.

> **Incomplete run.** This build does not contain a playable game. `src/index.js`
> only renders a placeholder `BootScene` (a "Mushroom Kingdom" title card) — the
> game scenes were never implemented.

## This run

| | |
|---|---|
| **Model** | Anthropic Sonnet 4.7 |
| **Harness** | Claude Code |
| **Notes** | Using superpowers |
| **Live demo** | Not deployed |

## Develop

```sh
npm install
npm run dev      # local dev server (Vite)
npm run build    # production build → dist/
```

## Layout

- `prd.md` — shared product spec every benchmark run is built against.
- `src/` — game source (placeholder boot scene only).
- `kenney_new-platformer-pack-1.1/` — CC0 art assets (Kenney).
- `run.json` — benchmark metadata consumed by the gallery site.
