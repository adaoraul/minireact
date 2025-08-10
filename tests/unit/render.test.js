/**
 * Unit tests for render functionality
 */
import MiniReact from '../../src/index.js';
import { createContainer, cleanupContainer, act } from '../testUtils.js';

const { createElement, render, useState, useEffect, Fragment, Component } = MiniReact;

describe('Unit - Render', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  test('renders simple element', async () => {
    await act(() => {
      render(
        createElement('div', null, 'Hello World'),
        container
      );
    });

    expect(container.textContent).toBe('Hello World');
    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('renders nested elements', async () => {
    await act(() => {
      render(
        createElement('div', null,
          createElement('h1', null, 'Title'),
          createElement('p', null, 'Paragraph')
        ),
        container
      );
    });

    expect(container.querySelector('h1').textContent).toBe('Title');
    expect(container.querySelector('p').textContent).toBe('Paragraph');
  });

  test('renders with props', async () => {
    await act(() => {
      render(
        createElement('div', {
          id: 'main',
          className: 'container',
          'data-testid': 'test-div'
        }, 'Content'),
        container
      );
    });

    const div = container.firstChild;
    expect(div.id).toBe('main');
    expect(div.className).toBe('container');
    expect(div.getAttribute('data-testid')).toBe('test-div');
  });

  test('renders text nodes', async () => {
    await act(() => {
      render(
        createElement('div', null, 'Just text'),
        container
      );
    });

    expect(container.textContent).toBe('Just text');
  });

  test('handles re-renders', async () => {
    let setTextFunc;
    
    const TestComponent = () => {
      const [text, setText] = useState('Initial');
      setTextFunc = setText;
      
      return createElement('div', null, text);
    };

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(container.textContent).toBe('Initial');

    await act(() => {
      setTextFunc('Updated');
    });

    expect(container.textContent).toBe('Updated');
  });

  test('handles null and undefined', async () => {
    const TestComponent = ({ value }) => {
      if (value === 'null') return null;
      if (value === 'undefined') return undefined;
      return createElement('div', null, 'Rendered');
    };

    await act(() => {
      render(createElement(TestComponent, { value: 'null' }), container);
    });
    expect(container.textContent).toBe('');

    await act(() => {
      render(createElement(TestComponent, { value: 'undefined' }), container);
    });
    expect(container.textContent).toBe('');

    await act(() => {
      render(createElement(TestComponent, { value: 'render' }), container);
    });
    expect(container.textContent).toBe('Rendered');
  });

  test('renders arrays of elements', async () => {
    const items = ['Apple', 'Banana', 'Cherry'];
    
    await act(() => {
      render(
        createElement('ul', null,
          ...items.map((item, index) => 
            createElement('li', { key: index }, item)
          )
        ),
        container
      );
    });

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(listItems[0].textContent).toBe('Apple');
    expect(listItems[1].textContent).toBe('Banana');
    expect(listItems[2].textContent).toBe('Cherry');
  });

  test('handles useEffect state updates', async () => {
    const TestComponent = () => {
      const [text, setText] = useState('Initial');
      
      useEffect(() => {
        setText('Updated');
      }, []);
      
      return createElement('div', null, text);
    };

    await act(() => {
      render(createElement(TestComponent), container);
    });

    expect(container.textContent).toBe('Updated');
  });

  test('switches component types dynamically', async () => {
    let setTypeFunc;
    
    const ComponentA = () => createElement('div', null, 'Component A');
    const ComponentB = () => createElement('span', null, 'Component B');
    
    const DynamicComponent = () => {
      const [type, setType] = useState('A');
      setTypeFunc = setType;
      
      const Component = type === 'A' ? ComponentA : ComponentB;
      return createElement(Component, null);
    };

    await act(() => {
      render(createElement(DynamicComponent, null), container);
    });

    expect(container.firstChild.tagName).toBe('DIV');
    expect(container.textContent).toBe('Component A');

    await act(() => {
      setTypeFunc('B');
    });

    expect(container.firstChild.tagName).toBe('SPAN');
    expect(container.textContent).toBe('Component B');
  });

  test('deeply nested mixed components with useEffect', async () => {
    const Level3 = ({ text }) => createElement('p', null, text);
    
    class Level2 extends Component {
      render() {
        return createElement('div', { className: 'level2' },
          createElement(Level3, { text: this.props.text })
        );
      }
    }
    
    const Level1 = () => {
      const [text, setText] = useState('Initial');
      
      useEffect(() => {
        setText('Updated');
      }, []);
      
      return createElement(Level2, { text });
    };

    await act(() => {
      render(createElement(Level1, null), container);
    });

    expect(container.querySelector('p').textContent).toBe('Updated');
    expect(container.querySelector('.level2')).toBeTruthy();
  });
});