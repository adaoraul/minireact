// @ts-nocheck
import MiniReact from '../src/index.js';

const { createElement, render, useState, useEffect, useReducer, useMemo, useCallback, Component } =
  MiniReact;

// ==================== Counter Component ====================
function Counter() {
  const [count, setCount] = useState(0);

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '⚡ Simple Counter'),
    createElement('p', null, 'Value: ', count),
    createElement(
      'div',
      { className: 'button-group' },
      createElement('button', { onClick: () => setCount(count + 1) }, 'Increment'),
      createElement('button', { onClick: () => setCount(count - 1) }, 'Decrement'),
      createElement('button', { onClick: () => setCount(0) }, 'Reset')
    )
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

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '📝 Todo List'),
    createElement(
      'div',
      { className: 'input-group' },
      createElement('input', {
        type: 'text',
        value: inputValue,
        onInput: (e) => setInputValue(e.target.value),
        placeholder: 'New task...',
      }),
      createElement('button', { onClick: addTodo }, 'Add')
    ),
    createElement(
      'ul',
      { className: 'todo-list' },
      ...todos.map((todo) =>
        createElement(
          'li',
          { key: todo.id, className: todo.done ? 'done' : '' },
          createElement('span', { onClick: () => toggleTodo(todo.id) }, todo.text),
          createElement('button', { onClick: () => removeTodo(todo.id) }, '❌')
        )
      )
    )
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

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '⏱️ Timer with useEffect'),
    createElement('div', { className: 'timer-display' }, formatTime(seconds)),
    createElement(
      'div',
      { className: 'button-group' },
      createElement('button', { onClick: toggle }, isRunning ? 'Pause' : 'Start'),
      createElement('button', { onClick: reset }, 'Reset')
    )
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

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '🔀 Dynamic List with Keys'),
    createElement(
      'div',
      { className: 'button-group' },
      createElement('button', { onClick: shuffle }, 'Shuffle'),
      createElement('button', { onClick: addItem }, 'Add Item')
    ),
    createElement(
      'ul',
      { className: 'dynamic-list' },
      ...items.map((item) =>
        createElement(
          'li',
          { key: item.id },
          item.name,
          ' (ID: ',
          item.id,
          ')',
          createElement('button', { onClick: () => removeItem(item.id) }, 'Remove')
        )
      )
    )
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

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '📊 Progress Bar'),
    createElement(
      'div',
      { className: 'progress-container' },
      createElement(
        'div',
        { className: 'progress-bar', style: `width: ${progress}%` },
        progress,
        '%'
      )
    ),
    createElement(
      'div',
      { className: 'button-group' },
      createElement('button', { onClick: start, disabled: isRunning && progress < 100 }, 'Start'),
      createElement(
        'button',
        { onClick: pause, disabled: !isRunning || progress >= 100 },
        isRunning ? 'Pause' : 'Continue'
      ),
      createElement('button', { onClick: reset }, 'Reset')
    )
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

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '📋 Controlled Form'),
    createElement(
      'form',
      { onSubmit: handleSubmit },
      createElement(
        'div',
        { className: 'form-group' },
        createElement('label', null, 'Name:'),
        createElement('input', {
          type: 'text',
          value: formData.name,
          onInput: handleChange('name'),
          required: true,
        })
      ),
      createElement(
        'div',
        { className: 'form-group' },
        createElement('label', null, 'Email:'),
        createElement('input', {
          type: 'email',
          value: formData.email,
          onInput: handleChange('email'),
          required: true,
        })
      ),
      createElement(
        'div',
        { className: 'form-group' },
        createElement('label', null, 'Message:'),
        createElement('textarea', {
          value: formData.message,
          onInput: handleChange('message'),
          rows: '4',
          required: true,
        })
      ),
      createElement('button', { type: 'submit' }, 'Submit')
    )
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

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '🔔 Notification System'),
    createElement(
      'div',
      { className: 'button-group' },
      createElement(
        'button',
        { onClick: () => addNotification('success'), className: 'btn-success' },
        'Success'
      ),
      createElement(
        'button',
        { onClick: () => addNotification('warning'), className: 'btn-warning' },
        'Warning'
      ),
      createElement(
        'button',
        { onClick: () => addNotification('error'), className: 'btn-error' },
        'Error'
      ),
      createElement(
        'button',
        { onClick: () => addNotification('info'), className: 'btn-info' },
        'Info'
      )
    ),
    createElement(
      'div',
      { className: 'notifications' },
      ...state.notifications.map((notification) =>
        createElement(
          'div',
          { key: notification.id, className: `notification ${notification.type}` },
          notification.message,
          createElement(
            'button',
            { onClick: () => dispatch({ type: 'REMOVE', id: notification.id }) },
            '×'
          )
        )
      )
    )
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
  const getItems = useCallback(() => [number, number + 1, number + 2], [number]);

  return createElement(
    'div',
    { className: 'demo-card' },
    createElement('h2', null, '🧮 useMemo & useCallback'),
    createElement(
      'div',
      { className: 'form-group' },
      createElement('input', {
        type: 'number',
        value: number,
        onInput: (e) => setNumber(parseInt(e.target.value, 10) || 0),
        min: '0',
        max: '100',
      })
    ),
    createElement('p', null, 'Calculated value: ', expensiveValue),
    createElement('p', null, 'Items: ', getItems().join(', '))
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
    return createElement(
      'div',
      { className: 'demo-card' },
      createElement('h2', null, '🎯 Class Component'),
      createElement('p', null, 'Counter: ', this.state.count),
      createElement(
        'div',
        { className: 'button-group' },
        createElement('button', { onClick: this.increment }, '+1'),
        createElement('button', { onClick: this.decrement }, '-1')
      )
    );
  }
}

// ==================== Main App Component ====================
function App() {
  return createElement(
    'div',
    { className: 'container' },
    createElement(
      'header',
      null,
      createElement('h1', null, '🚀 MiniReact - Demos'),
      createElement('p', null, 'Practical examples using the createElement API directly')
    ),
    createElement(
      'main',
      { className: 'demos-grid' },
      createElement(Counter, null),
      createElement(TodoList, null),
      createElement(Timer, null),
      createElement(DynamicList, null),
      createElement(ProgressBar, null),
      createElement(ControlledForm, null),
      createElement(NotificationSystem, null),
      createElement(ExpensiveCalculation, null),
      createElement(ClassCounter, null)
    ),
    createElement(
      'footer',
      null,
      createElement('p', null, 'MiniReact v2.0 - Educational framework inspired by React'),
      createElement('p', null, 'Using the createElement API directly (without JSX)')
    )
  );
}

// Render the app
render(createElement(App, null), document.getElementById('root'));
