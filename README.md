# MiniReact

A from-scratch reimplementation of React's core internals — Virtual DOM, Fiber-based rendering, reconciliation, and hooks — built to show how a framework like React actually works under the hood.

**Educational project. Not for production use.**

## Features

- Virtual DOM (`createElement`) with fiber-based, interruptible rendering via `requestIdleCallback`
- O(n) reconciliation, with key-based matching for lists
- Hooks: `useState`, `useEffect`, `useReducer`, `useMemo`, `useCallback`, `useRef`, `useContext`
- Legacy class components (`Component`)
- Fragments, controlled forms, conditional rendering

## Install

```bash
git clone https://github.com/adaoraul/minireact.git
cd minireact
npm install
npm start   # serves examples/ at http://localhost:3000
```

## Usage

```javascript
import { createElement, render, useState } from './src/index.js';

function Counter() {
  const [count, setCount] = useState(0);
  return createElement('button', { onClick: () => setCount(count + 1) }, `Count: ${count}`);
}

render(createElement(Counter), document.getElementById('root'));
```

More complete demos live in [`examples/`](examples/index.html), with a JSX version in [`examples/jsx/`](examples/jsx/).

## API

| | |
|---|---|
| `createElement(type, props, ...children)` | Creates a virtual element |
| `render(element, container)` | Renders into the DOM |
| `useState(initial)` | Local state → `[value, setValue]` |
| `useEffect(effect, deps?)` | Side effects with cleanup. No `deps` runs every render, `[]` runs once, `[a, b]` runs when `a`/`b` change |
| `useReducer(reducer, initialState, init?)` | Redux-style state → `[state, dispatch]` |
| `useMemo(compute, deps)` | Memoizes a computed value |
| `useCallback(fn, deps)` | Memoizes a function reference |
| `useRef(initial)` | Mutable `{ current }` box that persists across renders |
| `useContext(context)` / `createContext(default)` | Shared values without prop drilling |

Full JSDoc is generated with `npm run docs`.

## Project structure

```
src/
├── index.js       # public exports
├── core/          # fiber, work loop, reconciler, commit phase
├── vdom/          # createElement, DOM diffing/patching
├── hooks/         # useState, useEffect, useReducer, useMemo, useCallback, useRef, useContext
└── component.js   # legacy class component support
examples/          # runnable demos (plain JS and JSX)
tests/             # Jest unit + integration tests
```

## How it works

`createElement` builds a lightweight virtual DOM tree. `render` turns that into a **fiber tree** — a linked structure of work units — and processes it incrementally inside `requestIdleCallback` callbacks so long renders don't block the browser. Once a full pass finishes, the effect tags produced by reconciliation (`PLACEMENT` / `UPDATE` / `DELETION`) are applied to the real DOM in one synchronous commit, followed by running `useEffect` callbacks.

Hooks work by attaching their state to the fiber that owns them, keyed by call order — that's why hooks can't be called conditionally.

## Scripts

```bash
npm start         # serve examples/ at :3000
npm test          # run the Jest suite
npm run lint      # ESLint
npm run format    # Prettier
npm run docs      # generate JSDoc into ./docs
npm run build:jsx # transpile examples/jsx/app.jsx (needed to run that demo)
```

## Limitations

This is a learning project, not a React replacement:

- No SSR, Suspense, concurrent rendering, portals, or error boundaries
- No `forwardRef`, `useLayoutEffect`, `useImperativeHandle`
- Events are native DOM events bound directly per element — no synthetic event wrapper, delegation, or pooling
- Multiple `setState` calls in the same handler are coalesced into one re-render, but there's no cross-tick automatic batching like React 18
- Known rough edges: effect cleanup can leak in some edge cases, and very rapid updates can race

## Contributing

Issues and PRs are welcome — this project exists to be read, poked at, and learned from. Run `npm run lint` and `npm test` before submitting.

## Credits

Inspired by [React](https://react.dev), built following Rodrigo Pombo's [*Build your own React*](https://pomb.us/build-your-own-react/) and the [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture) notes.

## License

MIT
