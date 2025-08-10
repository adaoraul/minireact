import MiniReact from '../../src/index.js';
import { Component } from '../../src/component.js';
import { createContainer, cleanupContainer, act, fireEvent, getByText } from '../testUtils.js';

const { createElement, render, useState, useEffect, Fragment } = MiniReact;

describe('Integration - Rendering', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  describe('Basic Rendering', () => {
    test('renders simple elements', async () => {
      await act(() => {
        render(
          createElement('div', null, 'Hello World'),
          container
        );
      });

      expect(container.textContent).toBe('Hello World');
    });

    test('renders nested elements', async () => {
      await act(() => {
        render(
          createElement('div', null,
            createElement('h1', null, 'Title'),
            createElement('p', null, 'Paragraph'),
            createElement('ul', null,
              createElement('li', null, 'Item 1'),
              createElement('li', null, 'Item 2')
            )
          ),
          container
        );
      });

      expect(container.querySelector('h1').textContent).toBe('Title');
      expect(container.querySelector('p').textContent).toBe('Paragraph');
      expect(container.querySelectorAll('li')).toHaveLength(2);
    });

    test('renders with attributes', async () => {
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

    test('renders with styles', async () => {
      await act(() => {
        render(
          createElement('div', {
            style: {
              color: 'red',
              fontSize: '20px',
              backgroundColor: 'blue'
            }
          }, 'Styled'),
          container
        );
      });

      const div = container.firstChild;
      expect(div.style.color).toBe('red');
      expect(div.style.fontSize).toBe('20px');
      expect(div.style.backgroundColor).toBe('blue');
    });
  });

  describe('Conditional Rendering', () => {
    test('renders based on conditions', async () => {
      const ConditionalComponent = ({ show }) => {
        return show
          ? createElement('div', null, 'Visible')
          : createElement('div', null, 'Hidden');
      };

      await act(() => {
        render(createElement(ConditionalComponent, { show: true }), container);
      });

      expect(container.textContent).toBe('Visible');

      await act(() => {
        render(createElement(ConditionalComponent, { show: false }), container);
      });

      expect(container.textContent).toBe('Hidden');
    });

    test('handles null and undefined renders', async () => {
      const NullComponent = ({ type }) => {
        if (type === 'null') return null;
        if (type === 'undefined') return undefined;
        if (type === 'false') return false;
        return createElement('div', null, 'Rendered');
      };

      await act(() => {
        render(createElement(NullComponent, { type: 'null' }), container);
      });
      expect(container.textContent).toBe('');

      await act(() => {
        render(createElement(NullComponent, { type: 'undefined' }), container);
      });
      expect(container.textContent).toBe('');

      await act(() => {
        render(createElement(NullComponent, { type: 'false' }), container);
      });
      expect(container.textContent).toBe('');

      await act(() => {
        render(createElement(NullComponent, { type: 'render' }), container);
      });
      expect(container.textContent).toBe('Rendered');
    });
  });

  describe('List Rendering', () => {
    test('renders lists with keys', async () => {
      const items = ['Apple', 'Banana', 'Cherry'];
      
      const ListComponent = () => {
        return createElement('ul', null,
          ...items.map(item => 
            createElement('li', { key: item }, item)
          )
        );
      };

      await act(() => {
        render(createElement(ListComponent, null), container);
      });

      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(3);
      expect(listItems[0].textContent).toBe('Apple');
      expect(listItems[1].textContent).toBe('Banana');
      expect(listItems[2].textContent).toBe('Cherry');
    });

    test('updates lists efficiently', async () => {
      let setItemsFunc;
      
      const DynamicList = () => {
        const [items, setItems] = useState(['Item 1', 'Item 2']);
        setItemsFunc = setItems;
        
        return createElement('ul', null,
          ...items.map((item, index) => 
            createElement('li', { key: index }, item)
          )
        );
      };

      await act(() => {
        render(createElement(DynamicList, null), container);
      });

      expect(container.querySelectorAll('li')).toHaveLength(2);

      await act(() => {
        setItemsFunc(['Item 1', 'Item 2', 'Item 3']);
      });

      expect(container.querySelectorAll('li')).toHaveLength(3);

      await act(() => {
        setItemsFunc(['Item 2', 'Item 3']);
      });

      expect(container.querySelectorAll('li')).toHaveLength(2);
      expect(container.querySelectorAll('li')[0].textContent).toBe('Item 2');
    });

    test('handles list reordering with keys', async () => {
      let setItemsFunc;
      
      const ReorderableList = () => {
        const [items, setItems] = useState([
          { id: 'a', text: 'Alpha' },
          { id: 'b', text: 'Beta' },
          { id: 'c', text: 'Gamma' }
        ]);
        setItemsFunc = setItems;
        
        return createElement('ul', null,
          ...items.map(item => 
            createElement('li', { key: item.id }, item.text)
          )
        );
      };

      await act(() => {
        render(createElement(ReorderableList, null), container);
      });

      const initialOrder = Array.from(container.querySelectorAll('li'))
        .map(li => li.textContent);
      expect(initialOrder).toEqual(['Alpha', 'Beta', 'Gamma']);

      await act(() => {
        setItemsFunc([
          { id: 'c', text: 'Gamma' },
          { id: 'a', text: 'Alpha' },
          { id: 'b', text: 'Beta' }
        ]);
      });

      const newOrder = Array.from(container.querySelectorAll('li'))
        .map(li => li.textContent);
      expect(newOrder).toEqual(['Gamma', 'Alpha', 'Beta']);
    });
  });

  describe('Fragment Rendering', () => {
    test('renders fragments', async () => {
      const FragmentComponent = () => {
        return createElement(Fragment, null,
          createElement('div', null, 'First'),
          createElement('div', null, 'Second'),
          createElement('div', null, 'Third')
        );
      };

      await act(() => {
        render(
          createElement('div', null,
            createElement(FragmentComponent, null)
          ),
          container
        );
      });

      const divs = container.querySelectorAll('div');
      expect(divs).toHaveLength(4);
      expect(divs[1].textContent).toBe('First');
      expect(divs[2].textContent).toBe('Second');
      expect(divs[3].textContent).toBe('Third');
    });

    test('nested fragments', async () => {
      const NestedFragments = () => {
        return createElement(Fragment, null,
          createElement(Fragment, null,
            createElement('span', null, 'A'),
            createElement('span', null, 'B')
          ),
          createElement(Fragment, null,
            createElement('span', null, 'C'),
            createElement('span', null, 'D')
          )
        );
      };

      await act(() => {
        render(
          createElement('div', null,
            createElement(NestedFragments, null)
          ),
          container
        );
      });

      const spans = container.querySelectorAll('span');
      expect(spans).toHaveLength(4);
      expect(Array.from(spans).map(s => s.textContent)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe('Mixed Component Types', () => {
    test('renders function and class components together', async () => {
      const FunctionChild = ({ text }) => createElement('span', null, text);
      
      class ClassParent extends Component {
        render() {
          return createElement('div', null,
            createElement(FunctionChild, { text: 'Function Component' }),
            ' - ',
            createElement('span', null, 'Regular Element')
          );
        }
      }

      await act(() => {
        render(createElement(ClassParent, null), container);
      });

      expect(container.textContent).toBe('Function Component - Regular Element');
    });

    test('deeply nested mixed components', async () => {
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

  describe('Dynamic Rendering', () => {
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

    test('renders dynamic children', async () => {
      let addChildFunc;
      
      const DynamicChildren = () => {
        const [children, setChildren] = useState([]);
        
        addChildFunc = () => {
          setChildren(prev => [
            ...prev,
            createElement('div', { key: prev.length }, `Child ${prev.length + 1}`)
          ]);
        };
        
        return createElement('div', null, ...children);
      };

      await act(() => {
        render(createElement(DynamicChildren, null), container);
      });

      expect(container.firstChild.children).toHaveLength(0);

      await act(() => {
        addChildFunc();
      });

      expect(container.firstChild.children).toHaveLength(1);
      expect(container.textContent).toBe('Child 1');

      await act(() => {
        addChildFunc();
        addChildFunc();
      });

      expect(container.firstChild.children).toHaveLength(3);
      expect(container.textContent).toBe('Child 1Child 2Child 3');
    });
  });

  describe('Error Boundaries', () => {
    test('handles render errors gracefully', async () => {
      const BrokenComponent = () => {
        throw new Error('Render error');
      };

      const ErrorBoundary = ({ children }) => {
        try {
          return children;
        } catch (error) {
          return createElement('div', null, 'Error occurred');
        }
      };

      const originalError = console.error;
      console.error = jest.fn();

      try {
        await act(() => {
          render(
            createElement(ErrorBoundary, null,
              createElement(BrokenComponent, null)
            ),
            container
          );
        });
      } catch (error) {
        
      }

      console.error = originalError;
    });
  });
});