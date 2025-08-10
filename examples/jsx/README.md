# MiniReact com JSX

Este exemplo demonstra como usar JSX com o MiniReact, usando Babel para transpilar a sintaxe JSX para chamadas `createElement`.

## 🚀 Como Executar

### 1. Instalar dependências (se ainda não instaladas)

```bash
npm install
```

### 2. Compilar o JSX

```bash
npm run build:jsx
```

### 3. Iniciar o servidor

```bash
npm start
```

### 4. Abrir no navegador

Navegue para: http://localhost:3000/examples/jsx/

## 📝 Desenvolvimento

Para desenvolvimento com hot-reload manual:

```bash
# Em um terminal, execute o watcher do Babel
npm run watch:jsx

# Em outro terminal, execute o servidor
npm run dev
```

## 🔧 Como Funciona

1. **Código JSX** (`app.jsx`): Escrevemos componentes usando sintaxe JSX familiar
2. **Babel**: Transpila JSX para JavaScript puro usando `MiniReact.createElement`
3. **MiniReact**: Nossa implementação processa os elementos e renderiza no DOM

### Configuração do Babel

O arquivo `.babelrc` configura o Babel para usar nosso `createElement`:

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

### Exemplo de Transpilação

**JSX Original:**

```jsx
<div className="container">
  <h1>Hello {name}</h1>
  <button onClick={handleClick}>Click me</button>
</div>
```

**JavaScript Transpilado:**

```javascript
MiniReact.createElement(
  'div',
  { className: 'container' },
  MiniReact.createElement('h1', null, 'Hello ', name),
  MiniReact.createElement('button', { onClick: handleClick }, 'Click me')
);
```

## 🎯 Componentes Demonstrados

O exemplo inclui todos os mesmos componentes da versão sem JSX:

- **Counter**: Estado simples com useState
- **TodoList**: Lista dinâmica com CRUD
- **Timer**: useEffect e cleanup
- **DynamicList**: Reconciliação com keys
- **ProgressBar**: Animações e estado complexo
- **ControlledForm**: Inputs controlados
- **NotificationSystem**: useReducer para gerenciamento de estado
- **ExpensiveCalculation**: useMemo e useCallback
- **ClassCounter**: Componente de classe

## 📚 Diferenças da Versão sem JSX

### Versão com JSX (mais limpa e legível):

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

### Versão sem JSX (mais verbosa):

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

Para ver o código transpilado, abra `app.js` após executar `npm run build:jsx`.

## 📖 Recursos Adicionais

- [Documentação do MiniReact](../../docs/index.html)
- [Exemplo sem JSX](../index.html)
- [Código fonte do MiniReact](../../src/)
