// @ts-nocheck
import MiniReact from '../../src/index.js';

const { render, useState, useEffect, useReducer, useMemo, useCallback, Component } = MiniReact;

// ==================== Counter Component ====================
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="demo-card">
      <h2>⚡ Contador Simples</h2>
      <p>Valor: {count}</p>
      <div className="button-group">
        <button onClick={() => setCount(count + 1)}>Incrementar</button>
        <button onClick={() => setCount(count - 1)}>Decrementar</button>
        <button onClick={() => setCount(0)}>Resetar</button>
      </div>
    </div>
  );
}

// ==================== Todo List Component ====================
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Aprender MiniReact', done: false },
    { id: 2, text: 'Construir um app', done: false },
  ]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { id: Date.now(), text: inputValue, done: false }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  const removeTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="demo-card">
      <h2>📝 Lista de Tarefas</h2>
      <div className="input-group">
        <input
          type="text"
          value={inputValue}
          onInput={(e) => setInputValue(e.target.value)}
          placeholder="Nova tarefa..."
        />
        <button onClick={addTodo}>Adicionar</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? 'done' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==================== Timer Component ====================
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const toggle = () => setIsRunning(!isRunning);
  const reset = () => {
    setSeconds(0);
    setIsRunning(false);
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="demo-card">
      <h2>⏱️ Timer com useEffect</h2>
      <div className="timer-display">{formatTime(seconds)}</div>
      <div className="button-group">
        <button onClick={toggle}>{isRunning ? 'Pausar' : 'Iniciar'}</button>
        <button onClick={reset}>Resetar</button>
      </div>
    </div>
  );
}

// ==================== Dynamic List with Keys ====================
function DynamicList() {
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ]);

  const shuffle = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setItems(shuffled);
  };

  const addItem = () => {
    const newId = Math.max(...items.map((item) => item.id), 0) + 1;
    setItems([...items, { id: newId, name: `Item ${newId}` }]);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="demo-card">
      <h2>🔀 Lista Dinâmica com Keys</h2>
      <div className="button-group">
        <button onClick={shuffle}>Embaralhar</button>
        <button onClick={addItem}>Adicionar Item</button>
      </div>
      <ul className="dynamic-list">
        {items.map((item) => (
          <li key={item.id}>
            {item.name} (ID: {item.id})
            <button onClick={() => removeItem(item.id)}>Remover</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==================== Progress Bar Component ====================
function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || progress >= 100) {
      if (progress >= 100) {
        setIsRunning(false);
      }
      return undefined;
    }

    const timer = setTimeout(() => {
      setProgress((p) => Math.min(p + 1, 100));
    }, 50);

    return () => clearTimeout(timer);
  }, [progress, isRunning]);

  const start = () => {
    setProgress(0);
    setIsRunning(true);
  };

  const pause = () => setIsRunning(!isRunning);
  const reset = () => {
    setProgress(0);
    setIsRunning(false);
  };

  return (
    <div className="demo-card">
      <h2>📊 Barra de Progresso</h2>
      <div className="progress-container">
        <div className="progress-bar" style={`width: ${progress}%`}>
          {progress}%
        </div>
      </div>
      <div className="button-group">
        <button onClick={start} disabled={isRunning && progress < 100}>
          Iniciar
        </button>
        <button onClick={pause} disabled={!isRunning || progress >= 100}>
          {isRunning ? 'Pausar' : 'Continuar'}
        </button>
        <button onClick={reset}>Resetar</button>
      </div>
    </div>
  );
}

// ==================== Controlled Form Component ====================
function ControlledForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (field) => (e) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    window.alert(`Formulário enviado:\n${JSON.stringify(formData, null, 2)}`);
  };

  return (
    <div className="demo-card">
      <h2>📋 Formulário Controlado</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome:</label>
          <input type="text" value={formData.name} onInput={handleChange('name')} required />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={formData.email} onInput={handleChange('email')} required />
        </div>
        <div className="form-group">
          <label>Mensagem:</label>
          <textarea value={formData.message} onInput={handleChange('message')} rows="4" required />
        </div>
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

// ==================== Notification System Component ====================
function NotificationSystem() {
  const initialState = {
    notifications: [],
    nextId: 1,
  };

  const notificationReducer = (state, action) => {
    switch (action.type) {
      case 'ADD':
        return {
          notifications: [
            ...state.notifications,
            {
              id: state.nextId,
              message: action.message,
              type: action.notificationType,
            },
          ],
          nextId: state.nextId + 1,
        };
      case 'REMOVE':
        return {
          ...state,
          notifications: state.notifications.filter((n) => n.id !== action.id),
        };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (type) => {
    const messages = {
      success: 'Operação realizada com sucesso!',
      warning: 'Atenção: Verifique os dados.',
      error: 'Erro: Algo deu errado!',
      info: 'Informação: Novo recurso disponível.',
    };
    dispatch({ type: 'ADD', message: messages[type], notificationType: type });

    // Auto-remove após 3 segundos
    setTimeout(() => {
      dispatch({ type: 'REMOVE', id: state.nextId });
    }, 3000);
  };

  return (
    <div className="demo-card">
      <h2>🔔 Sistema de Notificações</h2>
      <div className="button-group">
        <button onClick={() => addNotification('success')} className="btn-success">
          Sucesso
        </button>
        <button onClick={() => addNotification('warning')} className="btn-warning">
          Aviso
        </button>
        <button onClick={() => addNotification('error')} className="btn-error">
          Erro
        </button>
        <button onClick={() => addNotification('info')} className="btn-info">
          Info
        </button>
      </div>
      <div className="notifications">
        {state.notifications.map((notification) => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            {notification.message}
            <button onClick={() => dispatch({ type: 'REMOVE', id: notification.id })}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Expensive Calculation Component ====================
function ExpensiveCalculation() {
  const [number, setNumber] = useState(0);

  // Memoriza o cálculo caro
  const expensiveValue = useMemo(() => {
    console.log('Calculando valor caro...');
    let result = 0;
    for (let i = 0; i <= number * 1000000; i++) {
      result += i;
    }
    return result;
  }, [number]);

  // Memoriza o callback
  const getItems = useCallback(() => {
    return [number, number + 1, number + 2];
  }, [number]);

  return (
    <div className="demo-card">
      <h2>🧮 useMemo & useCallback</h2>
      <div className="form-group">
        <input
          type="number"
          value={number}
          onInput={(e) => setNumber(parseInt(e.target.value, 10) || 0)}
          min="0"
          max="100"
        />
      </div>
      <p>Valor calculado: {expensiveValue}</p>
      <p>Items: {getItems().join(', ')}</p>
    </div>
  );
}

// ==================== Class Component Example ====================
class ClassCounter extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  decrement = () => {
    this.setState({ count: this.state.count - 1 });
  };

  render() {
    return (
      <div className="demo-card">
        <h2>🎯 Componente de Classe</h2>
        <p>Contador: {this.state.count}</p>
        <div className="button-group">
          <button onClick={this.increment}>+1</button>
          <button onClick={this.decrement}>-1</button>
        </div>
      </div>
    );
  }
}

// ==================== Main App Component ====================
function App() {
  return (
    <div className="container">
      <header>
        <h1>🚀 MiniReact com JSX - Demonstrações</h1>
        <p>Exemplos práticos usando sintaxe JSX com MiniReact</p>
      </header>

      <main className="demos-grid">
        <Counter />
        <TodoList />
        <Timer />
        <DynamicList />
        <ProgressBar />
        <ControlledForm />
        <NotificationSystem />
        <ExpensiveCalculation />
        <ClassCounter />
      </main>

      <footer>
        <p>MiniReact v2.0 - Framework educacional inspirado no React</p>
        <p>Usando JSX com Babel para transpilação</p>
      </footer>
    </div>
  );
}

// Render the app
render(<App />, document.getElementById('root'));