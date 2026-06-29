# Mobile e2e tests (Detox)

Stub folder. Populated when the React Native app under `/mobile/` ships its first runnable build.

## When the first mobile build arrives

- Detox is the chosen runner (configured per-platform: iOS Simulator, Android Emulator).
- Match the structure of `tests/e2e/`: `pages/` (Screen Objects), `fixtures/`, `specs/`.
- A failing Detox test MUST be committed BEFORE the RN screen that makes it pass — see `tests/README.md` TDD section.

Until that lands, this folder exists so:

- Future agents know exactly where mobile e2e tests go.
- The directory survives in git via `.gitkeep`.
