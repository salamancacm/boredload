# Contributing to boredload

Thanks for considering a contribution!

## Setup

```bash
git clone https://github.com/salamancacm/boredload.git
cd boredload
npm install
```

## Development

- `npm run dev` — build in watch mode
- `npm test` — run the Vitest suite
- `npm run test:coverage` — run tests with coverage
- `npm run lint` — lint the source
- `npm run build` — production build (tsup)
- `npm run size` — check the core bundle's gzip size against the 15kb budget

## Guidelines

- Keep the core (`src/core`, `src/games`) free of runtime dependencies.
- New games should implement the `Game` interface in `src/core/types.ts` and register via
  `src/games/registry.ts`.
- Cover new logic with unit tests; we don't test canvas pixel output, just state/logic.
- Run `npm run lint && npm test && npm run build && npm run size` before opening a PR.

## Pull Requests

1. Fork the repo and create a branch from `main`.
2. Make your changes with tests.
3. Ensure CI would pass (lint, test, build, size).
4. Open a PR describing the change and why it's needed.

## Reporting Issues

Please include a minimal reproduction, the browser/Node version, and expected vs. actual
behavior.
