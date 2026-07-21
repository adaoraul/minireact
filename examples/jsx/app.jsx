// @ts-nocheck
import MiniReact from '../../src/index.js';

const { render, useState, useEffect, useReducer, useMemo, useCallback, Component } = MiniReact;

// ==================== Counter Component ====================
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="demo-card">
      <h2>⚡ Simple Counter</h2>
      <p>Value: {count}</p>
      <div className="button-group">
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(count - 1)}>Decrement</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}

// ==================== Todo List Component ====================
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn MiniReact', done: false },
    { id: 2, text: 'Build an app', done: false },
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
      <h2>📝 Todo List</h2>
      <div className="input-group">
        <input
          type="text"
          value={inputValue}
          onInput={(e) => setInputValue(e.target.value)}
          placeholder="New task..."
        />
        <button onClick={addTodo}>Add</button>
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
      <h2>⏱️ Timer with useEffect</h2>
      <div className="timer-display">{formatTime(seconds)}</div>
      <div className="button-group">
        <button onClick={toggle}>{isRunning ? 'Pause' : 'Start'}</button>
        <button onClick={reset}>Reset</button>
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
      <h2>🔀 Dynamic List with Keys</h2>
      <div className="button-group">
        <button onClick={shuffle}>Shuffle</button>
        <button onClick={addItem}>Add Item</button>
      </div>
      <ul className="dynamic-list">
        {items.map((item) => (
          <li key={item.id}>
            {item.name} (ID: {item.id})
            <button onClick={() => removeItem(item.id)}>Remove</button>
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
      <h2>📊 Progress Bar</h2>
      <div className="progress-container">
        <div className="progress-bar" style={`width: ${progress}%`}>
          {progress}%
        </div>
      </div>
      <div className="button-group">
        <button onClick={start} disabled={isRunning && progress < 100}>
          Start
        </button>
        <button onClick={pause} disabled={!isRunning || progress >= 100}>
          {isRunning ? 'Pause' : 'Continue'}
        </button>
        <button onClick={reset}>Reset</button>
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
    window.alert(`Form submitted:\n${JSON.stringify(formData, null, 2)}`);
  };

  return (
    <div className="demo-card">
      <h2>📋 Controlled Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" value={formData.name} onInput={handleChange('name')} required />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={formData.email} onInput={handleChange('email')} required />
        </div>
        <div className="form-group">
          <label>Message:</label>
          <textarea value={formData.message} onInput={handleChange('message')} rows="4" required />
        </div>
        <button type="submit">Submit</button>
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
      success: 'Operation completed successfully!',
      warning: 'Warning: Check the data.',
      error: 'Error: Something went wrong!',
      info: 'Info: New feature available.',
    };
    dispatch({ type: 'ADD', message: messages[type], notificationType: type });

    // Auto-remove after 3 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE', id: state.nextId });
    }, 3000);
  };

  return (
    <div className="demo-card">
      <h2>🔔 Notification System</h2>
      <div className="button-group">
        <button onClick={() => addNotification('success')} className="btn-success">
          Success
        </button>
        <button onClick={() => addNotification('warning')} className="btn-warning">
          Warning
        </button>
        <button onClick={() => addNotification('error')} className="btn-error">
          Error
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

  // Memoizes the expensive calculation
  const expensiveValue = useMemo(() => {
    console.log('Calculating expensive value...');
    let result = 0;
    for (let i = 0; i <= number * 1000000; i++) {
      result += i;
    }
    return result;
  }, [number]);

  // Memoizes the callback
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
      <p>Calculated value: {expensiveValue}</p>
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
        <h2>🎯 Class Component</h2>
        <p>Counter: {this.state.count}</p>
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
        <h1>🚀 MiniReact with JSX - Demos</h1>
        <p>Practical examples using JSX syntax with MiniReact</p>
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
        <p>MiniReact v2.0 - Educational framework inspired by React</p>
        <p>Using JSX with Babel for transpilation</p>
      </footer>
    </div>
  );
}

// Render the app
render(<App />, document.getElementById('root'));