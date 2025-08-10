import { Component } from '../../src/component.js';
import { render } from '../../src/core/fiber.js';
import { createElement } from '../../src/vdom/createElement.js';
import { createContainer, cleanupContainer, act } from '../testUtils.js';

describe('Component', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  test('creates component instance with props', () => {
    const props = { name: 'Test', value: 42 };
    const component = new Component(props);
    
    expect(component.props).toBe(props);
    expect(component.state).toEqual({});
  });

  test('renders class component', async () => {
    class TestComponent extends Component {
      render() {
        return createElement('div', null, `Hello ${this.props.name}`);
      }
    }

    await act(() => {
      render(createElement(TestComponent, { name: 'World' }), container);
    });

    expect(container.textContent).toBe('Hello World');
  });

  test('setState updates component state', async () => {
    let componentInstance;
    
    class TestComponent extends Component {
      constructor(props) {
        super(props);
        this.state = { count: 0 };
        componentInstance = this;
      }
      
      render() {
        return createElement('div', null, `Count: ${this.state.count}`);
      }
    }

    await act(() => {
      render(createElement(TestComponent, null), container);
    });

    expect(container.textContent).toBe('Count: 0');

    await act(() => {
      componentInstance.setState({ count: 1 });
    });

    expect(container.textContent).toBe('Count: 1');
  });

  test('setState with function updater', async () => {
    let componentInstance;
    
    class TestComponent extends Component {
      constructor(props) {
        super(props);
        this.state = { count: 10 };
        componentInstance = this;
      }
      
      render() {
        return createElement('div', null, `Count: ${this.state.count}`);
      }
    }

    await act(() => {
      render(createElement(TestComponent, null), container);
    });

    expect(container.textContent).toBe('Count: 10');

    await act(() => {
      componentInstance.setState(prevState => ({ count: prevState.count + 5 }));
    });

    expect(container.textContent).toBe('Count: 15');

    await act(() => {
      componentInstance.setState(prevState => ({ count: prevState.count * 2 }));
    });

    expect(container.textContent).toBe('Count: 30');
  });

  test('setState merges state updates', async () => {
    let componentInstance;
    
    class TestComponent extends Component {
      constructor(props) {
        super(props);
        this.state = { 
          name: 'John',
          age: 25,
          city: 'New York'
        };
        componentInstance = this;
      }
      
      render() {
        const { name, age, city } = this.state;
        return createElement('div', null, `${name}, ${age}, ${city}`);
      }
    }

    await act(() => {
      render(createElement(TestComponent, null), container);
    });

    expect(container.textContent).toBe('John, 25, New York');

    await act(() => {
      componentInstance.setState({ age: 26 });
    });

    expect(container.textContent).toBe('John, 26, New York');
    expect(componentInstance.state.name).toBe('John');
    expect(componentInstance.state.city).toBe('New York');

    await act(() => {
      componentInstance.setState({ name: 'Jane', city: 'Boston' });
    });

    expect(container.textContent).toBe('Jane, 26, Boston');
  });

  test('multiple setState calls are batched', async () => {
    let componentInstance;
    let renderCount = 0;
    
    class TestComponent extends Component {
      constructor(props) {
        super(props);
        this.state = { count: 0 };
        componentInstance = this;
      }
      
      render() {
        renderCount++;
        return createElement('div', null, `Count: ${this.state.count}`);
      }
    }

    await act(() => {
      render(createElement(TestComponent, null), container);
    });

    const initialRenderCount = renderCount;

    await act(() => {
      componentInstance.setState({ count: 1 });
      componentInstance.setState({ count: 2 });
      componentInstance.setState({ count: 3 });
    });

    expect(container.textContent).toBe('Count: 3');
    expect(renderCount).toBe(initialRenderCount + 1);
  });

  test('component methods have correct this binding', async () => {
    class TestComponent extends Component {
      constructor(props) {
        super(props);
        this.state = { clicked: false };
        this.handleClick = this.handleClick.bind(this);
      }
      
      handleClick() {
        this.setState({ clicked: true });
      }
      
      render() {
        return createElement(
          'button',
          { onClick: this.handleClick },
          this.state.clicked ? 'Clicked' : 'Click me'
        );
      }
    }

    await act(() => {
      render(createElement(TestComponent, null), container);
    });

    expect(container.textContent).toBe('Click me');

    const button = container.querySelector('button');
    
    await act(() => {
      button.click();
    });

    expect(container.textContent).toBe('Clicked');
  });

  test('props are accessible in render', async () => {
    class TestComponent extends Component {
      render() {
        return createElement('div', null, 
          `${this.props.greeting} ${this.props.name}!`
        );
      }
    }

    await act(() => {
      render(
        createElement(TestComponent, { greeting: 'Hello', name: 'World' }), 
        container
      );
    });

    expect(container.textContent).toBe('Hello World!');
  });

  test('component updates when props change', async () => {
    class TestComponent extends Component {
      render() {
        return createElement('div', null, `Value: ${this.props.value}`);
      }
    }

    await act(() => {
      render(createElement(TestComponent, { value: 1 }), container);
    });

    expect(container.textContent).toBe('Value: 1');

    await act(() => {
      render(createElement(TestComponent, { value: 2 }), container);
    });

    expect(container.textContent).toBe('Value: 2');
  });

  test('nested class components', async () => {
    class Child extends Component {
      render() {
        return createElement('span', null, this.props.text);
      }
    }

    class Parent extends Component {
      render() {
        return createElement('div', null,
          createElement(Child, { text: 'Child 1' }),
          ' - ',
          createElement(Child, { text: 'Child 2' })
        );
      }
    }

    await act(() => {
      render(createElement(Parent, null), container);
    });

    expect(container.textContent).toBe('Child 1 - Child 2');
  });

  test('component with children prop', async () => {
    class Wrapper extends Component {
      render() {
        return createElement('div', { className: 'wrapper' }, 
          this.props.children
        );
      }
    }

    await act(() => {
      render(
        createElement(Wrapper, null,
          createElement('span', null, 'Child 1'),
          createElement('span', null, 'Child 2')
        ),
        container
      );
    });

    const wrapper = container.querySelector('.wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper.children).toHaveLength(2);
    expect(container.textContent).toBe('Child 1Child 2');
  });

  test('component instance persists across renders', async () => {
    const instances = [];
    
    class TestComponent extends Component {
      constructor(props) {
        super(props);
        this.id = Math.random();
        instances.push(this);
      }
      
      render() {
        return createElement('div', null, this.props.text);
      }
    }

    await act(() => {
      render(createElement(TestComponent, { text: 'First' }), container);
    });

    await act(() => {
      render(createElement(TestComponent, { text: 'Second' }), container);
    });

    expect(instances).toHaveLength(1);
    expect(instances[0].props.text).toBe('Second');
  });

  test('component with complex state management', async () => {
    let componentInstance;
    
    class TodoList extends Component {
      constructor(props) {
        super(props);
        this.state = { todos: [], input: '' };
        componentInstance = this;
      }
      
      addTodo(text) {
        this.setState(prev => ({
          todos: [...prev.todos, { id: Date.now(), text }],
          input: ''
        }));
      }
      
      removeTodo(id) {
        this.setState(prev => ({
          todos: prev.todos.filter(todo => todo.id !== id)
        }));
      }
      
      render() {
        return createElement('div', null,
          ...this.state.todos.map(todo =>
            createElement('div', { key: todo.id }, todo.text)
          )
        );
      }
    }

    await act(() => {
      render(createElement(TodoList, null), container);
    });

    expect(container.children[0].children).toHaveLength(0);

    await act(() => {
      componentInstance.addTodo('First todo');
    });

    expect(container.textContent).toBe('First todo');

    await act(() => {
      componentInstance.addTodo('Second todo');
    });

    expect(container.textContent).toBe('First todoSecond todo');

    const firstTodoId = componentInstance.state.todos[0].id;
    
    await act(() => {
      componentInstance.removeTodo(firstTodoId);
    });

    // Debug the state after removal
    expect(componentInstance.state.todos).toHaveLength(1);
    expect(componentInstance.state.todos[0].text).toBe('Second todo');
    expect(container.textContent).toBe('Second todo');
  });
});