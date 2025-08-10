# Repository Guidelines

## Project Structure & Module Organization
- `src/`: framework source code (ES modules).
  - `core/`: scheduler, fiber, reconciliation, commit logic.
  - `vdom/`: `createElement`, DOM sync helpers.
  - `hooks/`: `useState`, `useEffect`, `useReducer`, `useMemo`, `useCallback` and utils.
  - `index.js`: public API exports; `component.js`: legacy class component.
- `examples/`: runnable demos (`index.html`, `app.js`, `jsx/` with `app.jsx`).
- `docs/`: generated JSDoc site.
- Config: `eslint.config.js`, `.prettierrc.json`, `.babelrc`, `package.json`.

## Build, Test, and Development Commands
- `npm start`: serve repo at `http://localhost:3000` and open `examples/`.
- `npm run dev`: serve with no-cache (useful while iterating examples).
- `npm run serve`: serve without auto-opening a page.
- `npm run build:jsx`: transpile `examples/jsx/app.jsx` → `examples/jsx/app.js`.
- `npm run watch:jsx`: watch and transpile JSX on change.
- `npm run docs`: build JSDoc into `./docs` (use `docs:serve` to preview at 3001).
- `npm run lint` | `lint:fix`: lint codebase and optionally fix.
- `npm run format` | `format:check`: format or verify formatting.

## Coding Style & Naming Conventions
- Language: modern JS (ES2024), ESM only.
- Formatting: Prettier (2-space indent, semicolons, single quotes, width 100).
- Linting: ESLint flat config; Prettier-compatible; strict on unused vars (prefix `_` to ignore).
- File/dir naming: lowercase dirs; JS modules use lowerCamelCase (e.g., `createElement.js`).
- Avoid implicit coercion; prefer `const`; keep pure helpers in `vdom/` or `hooks/` as appropriate.

## Testing Guidelines
- No formal test runner is configured yet. Validate changes via:
  - Running examples in `examples/` and `examples/jsx/` (use `watch:jsx`).
  - Adding minimal demo pages under `examples/feature-name/` when introducing features.
- If adding tests, prefer lightweight browser-based demos or propose Jest/Vitest in a separate PR.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `chore:`.
- Keep PRs focused; include:
  - Summary, motivation, and scope.
  - Before/after notes or screenshots for example updates.
  - Linked issues and breaking-change callouts.
- Pre-submit checklist: run `lint`, `format:check`, `build:jsx` (if JSX changed), and `docs` when touching JSDoc.

## Security & Configuration Tips
- This is browser-focused; avoid introducing Node-only globals into `src/`.
- Do not commit generated files in `docs/` or transpiled `examples/jsx/app.js` unless required for hosting.
