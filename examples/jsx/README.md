# MiniReact with JSX

This example demonstrates how to use JSX with MiniReact, using Babel to transpile JSX syntax into `createElement` calls.

## 🚀 How to Run

### 1. Install dependencies (if not already installed)

```bash
npm install
```

### 2. Compile the JSX

```bash
npm run build:jsx
```

### 3. Start the server

```bash
npm start
```

### 4. Open in the browser

Navigate to: http://localhost:3000/examples/jsx/

## 📝 Development

For development with manual hot-reload:

```bash
# In one terminal, run the Babel watcher
npm run watch:jsx

# In another terminal, run the server
npm run dev
```

## 🔧 How It Works

1. **JSX Code** (`app.jsx`): We write components using familiar JSX syntax
2. **Babel**: Transpiles JSX to plain JavaScript using `MiniReact.createElement`
3. **MiniReact**: Our implementation processes the elements and renders them to the DOM

### Babel Configuration

The `.babelrc` file configures Babel to use our `createElement`:

```json
{
  "presets": [
    [
      "@babel/preset-react",
      {
        "pragma": "MiniReact.createElement",
        "pragmaFrag": "MiniReact.Fragment"
      }
    ]
  ]
}
```

### Transpilation Example

**Original JSX:**

```jsx
<div className="container">
  <h1>Hello {name}</h1>
  <button onClick={handleClick}>Click me</button>
</div>
```

**Transpiled JavaScript:**

```javascript
MiniReact.createElement(
  'div',
  { className: 'container' },
  MiniReact.createElement('h1', null, 'Hello ', name),
  MiniReact.createElement('button', { onClick: handleClick }, 'Click me')
);
```

## 🎯 Components Demonstrated

The example includes all the same components as the non-JSX version:

- **Counter**: Simple state with useState
- **TodoList**: Dynamic list with CRUD
- **Timer**: useEffect and cleanup
- **DynamicList**: Reconciliation with keys
- **ProgressBar**: Animations and complex state
- **ControlledForm**: Controlled inputs
- **NotificationSystem**: useReducer for state management
- **ExpensiveCalculation**: useMemo and useCallback
- **ClassCounter**: Class component

## 📚 Differences from the Non-JSX Version

### JSX Version (cleaner and more readable):

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="demo-card">
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Non-JSX Version (more verbose):

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, 'Counter: ', count),
    createElement('button', { onClick: () => setCount(count + 1) }, 'Increment')
  );
}
```

## 🔍 Debugging

To see the transpiled code, open `app.js` after running `npm run build:jsx`.

## 📖 Additional Resources

- [MiniReact Documentation](../../docs/index.html)
- [Example without JSX](../index.html)
- [MiniReact Source Code](../../src/)
