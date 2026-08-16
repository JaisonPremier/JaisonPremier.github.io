# 死局 | SǏ JÚ | DEADLOCK

A local pass-device bluffing game for two to four players. Every living player chooses a hidden action, all actions reveal together, and the last survivor wins.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## Character artwork

The supplied character artwork is integrated at these stable paths:

```text
public/characters/ling/full.png
public/characters/lie/full.png
public/characters/ying/full.png
public/characters/gang/full.png
public/characters/group.png
```

HUD portraits and navigation thumbnails reuse the full artwork with responsive crops, avoiding duplicate downloads. The interface still retains its monochrome fallback if an image is removed.

## Architecture

- `src/game/engine.ts`: deterministic game rules with no animation dependency
- `src/game/types.ts`: match, player, action, and resolution contracts
- `src/data/characters.ts`: structured fighter definitions and artwork paths
- `src/components/SetupScreens.tsx`: title, setup, character select, tutorial, archive, and settings
- `src/components/MatchScreens.tsx`: private action selection, targeting, reveal, resolution, and winner flow
- `src/components/GameUI.tsx`: shared HUD and game UI primitives
- `src/styles/index.css`: full-viewport visual system and responsive compositions

The round escalation thresholds and ammunition cap are configurable through `defaultConfig` in `src/game/engine.ts`.
