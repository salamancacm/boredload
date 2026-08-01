# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0]

- New minigame: `orbit-dodger` — dodge falling obstacles by moving left/right (Arrow keys/WASD)
  or by dragging/holding a pointer or finger, which the ship follows directly.
- `InputState` gains optional `heldDirection` and `pointerX` fields for directional/pointer-based
  games (purely additive, `dino-runner` is unaffected).
- Internal: `mulberry32` and the generic AABB collision check moved to `src/games/shared/` for
  reuse across games.

## [0.1.0]

- Initial MVP: core engine, dino-runner minigame, `mount()` vanilla helper, React wrapper
  (`useLoadingGame`, `LoadingGame`) and Angular wrapper (`BoredloadGameDirective`), configurable
  `threshold`/`minPlayMs`/`maxPlayMs`, player-controlled exit, persisted high score, CSS-var
  auto-theming, `prefers-reduced-motion` support, adaptive threshold on slow connections, bundle-
  size gate, CI/release workflows.
