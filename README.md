# Mushroom Kingdom Side-Scroller — Anthropic Sonnet 4.7

A browser-based Mario-style 2D platformer built in Phaser 3, produced as one run in
a multi-model benchmark. Every run implements the same spec (`prd.md`): a single
polished, procedurally-generated level with running, jumping, enemy stomps, coins
and power-ups.

## This run

| | |
|---|---|
| **Model** | Anthropic Sonnet 4.7 |
| **Harness** | Claude Code |
| **Notes** | Using superpowers |
| **Live demo** | https://mario-sonnet-cc.netlify.app/ |

## Develop

```sh
npm install
npm run dev      # local dev server (Vite)
npm run build    # production build → dist/
```

## Layout

- `prd.md` — shared product spec every benchmark run is built against.
- `src/` — game source: Phaser 3 scenes, entities, level config.
- `kenney_new-platformer-pack-1.1/` — CC0 art assets (Kenney).
- `run.json` — benchmark metadata consumed by the gallery site.
