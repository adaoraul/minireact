import MiniReact from '../../src/index.js';
import { Component } from '../../src/component.js';
import { createContainer, cleanupContainer, act, fireEvent } from '../testUtils.js';

const { createElement, render, useState, useCallback } = MiniReact;

describe('Integration - Event Handling', () => {
  let container;

  beforeEach(() => {
    container = createContainer();
  });

  afterEach(() => {
    cleanupContainer(container);
  });

  describe('Click Events', () => {
    test('handles click events on buttons', async () => {
      let clicked = false;
      
      const Button = () => {
        const handleClick = () => {
          clicked = true;
        };
        
        return createElement('button', { onClick: handleClick }, 'Click me');
      };

      await act(() => {
        render(createElement(Button, null), container);
      });

      const button = container.querySelector('button');
      fireEvent(button, 'click');
      
      expect(clicked).toBe(true);
    });

    test('updates state on click', async () => {
      const Counter = () => {
        const [count, setCount] = useState(0);
        
        return createElement('button', {
          onClick: () => setCount(count + 1)
        }, `Count: ${count}`);
      };

      await act(() => {
        render(createElement(Counter, null), container);
      });

      const button = container.querySelector('button');
      expect(button.textContent).toBe('Count: 0');

      await act(() => {
        fireEvent(button, 'click');
      });
      expect(button.textContent).toBe('Count: 1');

      await act(() => {
        fireEvent(button, 'click');
      });
      expect(button.textContent).toBe('Count: 2');
    });

    test('handles multiple click handlers', async () => {
      const order = [];
      
      const MultiHandler = () => {
        return createElement('div', {
          onClick: () => order.push('parent')
        },
          createElement('button', {
            onClick: (e) => {
              order.push('child');
              e.stopPropagation();
            }
          }, 'Click')
        );
      };

      await act(() => {
        render(createElement(MultiHandler, null), container);
      });

      const button = container.querySelector('button');
      fireEvent(button, 'click');
      
      expect(order).toEqual(['child']);
    });
  });

  describe('Input Events', () => {
    test('handles input changes', async () => {
      const Form = () => {
        const [value, setValue] = useState('');
        
        return createElement('div', null,
          createElement('input', {
            type: 'text',
            value: value,
            onInput: (e) => setValue(e.target.value)
          }),
          createElement('p', null, `Value: ${value}`)
        );
      };

      await act(() => {
        render(createElement(Form, null), container);
      });

      const input = container.querySelector('input');
      const paragraph = container.querySelector('p');
      
      expect(paragraph.textContent).toBe('Value: ');

      await act(() => {
        input.value = 'Hello';
        fireEvent(input, 'input');
      });

      expect(paragraph.textContent).toBe('Value: Hello');
    });

    test('handles checkbox changes', async () => {
      const Checkbox = () => {
        const [checked, setChecked] = useState(false);
        
        return createElement('div', null,
          createElement('input', {
            type: 'checkbox',
            checked: checked,
            onChange: (e) => setChecked(e.target.checked)
          }),
          createElement('span', null, checked ? 'Checked' : 'Unchecked')
        );
      };

      await act(() => {
        render(createElement(Checkbox, null), container);
      });

      const checkbox = container.querySelector('input');
      const span = container.querySelector('span');
      
      expect(span.textContent).toBe('Unchecked');
      expect(checkbox.checked).toBe(false);

      await act(() => {
        checkbox.checked = true;
        fireEvent(checkbox, 'change');
      });

      expect(span.textContent).toBe('Checked');
    });

    test('handles select changes', async () => {
      const Select = () => {
        const [selected, setSelected] = useState('apple');
        
        return createElement('div', null,
          createElement('select', {
            value: selected,
            onChange: (e) => setSelected(e.target.value)
          },
            createElement('option', { value: 'apple' }, 'Apple'),
            createElement('option', { value: 'banana' }, 'Banana'),
            createElement('option', { value: 'cherry' }, 'Cherry')
          ),
          createElement('p', null, `Selected: ${selected}`)
        );
      };

      await act(() => {
        render(createElement(Select, null), container);
      });

      const select = container.querySelector('select');
      const paragraph = container.querySelector('p');
      
      expect(paragraph.textContent).toBe('Selected: apple');

      await act(() => {
        select.value = 'banana';
        fireEvent(select, 'change');
      });

      expect(paragraph.textContent).toBe('Selected: banana');
    });
  });

  describe('Form Events', () => {
    test('handles form submission', async () => {
      let submitted = false;
      let formData = {};
      
      const LoginForm = () => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        
        const handleSubmit = (e) => {
          e.preventDefault();
          submitted = true;
          formData = { username, password };
        };
        
        return createElement('form', { onSubmit: handleSubmit },
          createElement('input', {
            type: 'text',
            value: username,
            onInput: (e) => setUsername(e.target.value),
            placeholder: 'Username'
          }),
          createElement('input', {
            type: 'password',
            value: password,
            onInput: (e) => setPassword(e.target.value),
            placeholder: 'Password'
          }),
          createElement('button', { type: 'submit' }, 'Login')
        );
      };

      await act(() => {
        render(createElement(LoginForm, null), container);
      });

      const inputs = container.querySelectorAll('input');
      const form = container.querySelector('form');
      
      await act(() => {
        inputs[0].value = 'john';
        fireEvent(inputs[0], 'input');
        inputs[1].value = 'secret';
        fireEvent(inputs[1], 'input');
      });

      await act(() => {
        fireEvent(form, 'submit');
      });

      expect(submitted).toBe(true);
      expect(formData).toEqual({ username: 'john', password: 'secret' });
    });

    test('validates form inputs', async () => {
      const ValidatedForm = () => {
        const [email, setEmail] = useState('');
        const [error, setError] = useState('');
        
        const validateEmail = (value) => {
          setEmail(value);
          if (!value.includes('@')) {
            setError('Invalid email');
          } else {
            setError('');
          }
        };
        
        return createElement('div', null,
          createElement('input', {
            type: 'email',
            value: email,
            onInput: (e) => validateEmail(e.target.value)
          }),
          error && createElement('span', { style: { color: 'red' } }, error)
        );
      };

      await act(() => {
        render(createElement(ValidatedForm, null), container);
      });

      const input = container.querySelector('input');
      
      await act(() => {
        input.value = 'invalid';
        fireEvent(input, 'input');
      });

      expect(container.querySelector('span').textContent).toBe('Invalid email');

      await act(() => {
        input.value = 'valid@email.com';
        fireEvent(input, 'input');
      });

      expect(container.querySelector('span')).toBeFalsy();
    });
  });

  describe('Mouse Events', () => {
    test('handles mouse enter and leave', async () => {
      const HoverComponent = () => {
        const [hovered, setHovered] = useState(false);
        
        return createElement('div', {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
          style: {
            backgroundColor: hovered ? 'blue' : 'gray',
            padding: '20px'
          }
        }, hovered ? 'Hovered' : 'Not hovered');
      };

      await act(() => {
        render(createElement(HoverComponent, null), container);
      });

      const div = container.querySelector('div');
      expect(div.textContent).toBe('Not hovered');
      expect(div.style.backgroundColor).toBe('gray');

      await act(() => {
        fireEvent(div, 'mouseenter');
      });

      expect(div.textContent).toBe('Hovered');
      expect(div.style.backgroundColor).toBe('blue');

      await act(() => {
        fireEvent(div, 'mouseleave');
      });

      expect(div.textContent).toBe('Not hovered');
      expect(div.style.backgroundColor).toBe('gray');
    });

    test('tracks mouse position', async () => {
      let position = { x: 0, y: 0 };
      
      const MouseTracker = () => {
        const handleMouseMove = (e) => {
          position = { x: e.clientX, y: e.clientY };
        };
        
        return createElement('div', {
          onMouseMove: handleMouseMove,
          style: { width: '200px', height: '200px', backgroundColor: 'lightgray' }
        }, 'Move mouse here');
      };

      await act(() => {
        render(createElement(MouseTracker, null), container);
      });

      const div = container.querySelector('div');
      
      fireEvent(div, 'mousemove', { clientX: 100, clientY: 150 });
      
      expect(position).toEqual({ x: 100, y: 150 });
    });
  });

  describe('Keyboard Events', () => {
    test('handles key press events', async () => {
      const keys = [];
      
      const KeyHandler = () => {
        const handleKeyDown = (e) => {
          keys.push(e.key);
        };
        
        return createElement('input', {
          type: 'text',
          onKeyDown: handleKeyDown,
          placeholder: 'Type here'
        });
      };

      await act(() => {
        render(createElement(KeyHandler, null), container);
      });

      const input = container.querySelector('input');
      
      fireEvent(input, 'keydown', { key: 'a' });
      fireEvent(input, 'keydown', { key: 'b' });
      fireEvent(input, 'keydown', { key: 'Enter' });
      
      expect(keys).toEqual(['a', 'b', 'Enter']);
    });

    test('handles keyboard shortcuts', async () => {
      let action = '';
      
      const ShortcutComponent = () => {
        const handleKeyDown = (e) => {
          if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            action = 'save';
          } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            action = 'undo';
          }
        };
        
        return createElement('div', {
          onKeyDown: handleKeyDown,
          tabIndex: 0
        }, 'Press Ctrl+S or Ctrl+Z');
      };

      await act(() => {
        render(createElement(ShortcutComponent, null), container);
      });

      const div = container.querySelector('div');
      
      fireEvent(div, 'keydown', { key: 's', ctrlKey: true });
      expect(action).toBe('save');
      
      fireEvent(div, 'keydown', { key: 'z', ctrlKey: true });
      expect(action).toBe('undo');
    });
  });

  describe('Event Handler Updates', () => {
    test('updates event handlers dynamically', async () => {
      let setModeFunc;
      const results = [];
      
      const DynamicHandler = () => {
        const [mode, setMode] = useState('add');
        setModeFunc = setMode;
        
        const handleClick = useCallback(() => {
          results.push(mode);
        }, [mode]);
        
        return createElement('button', { onClick: handleClick }, `Mode: ${mode}`);
      };

      await act(() => {
        render(createElement(DynamicHandler, null), container);
      });

      const button = container.querySelector('button');
      
      fireEvent(button, 'click');
      expect(results).toEqual(['add']);

      await act(() => {
        setModeFunc('edit');
      });

      fireEvent(button, 'click');
      expect(results).toEqual(['add', 'edit']);

      await act(() => {
        setModeFunc('delete');
      });

      fireEvent(button, 'click');
      expect(results).toEqual(['add', 'edit', 'delete']);
    });

    test('removes event handlers', async () => {
      let clicked = 0;
      let setEnabledFunc;
      
      const ConditionalHandler = () => {
        const [enabled, setEnabled] = useState(true);
        setEnabledFunc = setEnabled;
        
        const handleClick = enabled ? () => clicked++ : undefined;
        
        return createElement('button', {
          onClick: handleClick
        }, enabled ? 'Enabled' : 'Disabled');
      };

      await act(() => {
        render(createElement(ConditionalHandler, null), container);
      });

      const button = container.querySelector('button');
      
      fireEvent(button, 'click');
      expect(clicked).toBe(1);

      await act(() => {
        setEnabledFunc(false);
      });

      fireEvent(button, 'click');
      expect(clicked).toBe(1);

      await act(() => {
        setEnabledFunc(true);
      });

      fireEvent(button, 'click');
      expect(clicked).toBe(2);
    });
  });

  describe('Class Component Events', () => {
    test('handles events in class components', async () => {
      class EventfulComponent extends Component {
        constructor(props) {
          super(props);
          this.state = { count: 0, hovered: false };
          this.handleClick = this.handleClick.bind(this);
          this.handleMouseEnter = this.handleMouseEnter.bind(this);
          this.handleMouseLeave = this.handleMouseLeave.bind(this);
        }
        
        handleClick() {
          this.setState({ count: this.state.count + 1 });
        }
        
        handleMouseEnter() {
          this.setState({ hovered: true });
        }
        
        handleMouseLeave() {
          this.setState({ hovered: false });
        }
        
        render() {
          const { count, hovered } = this.state;
          return createElement('button', {
            onClick: this.handleClick,
            onMouseEnter: this.handleMouseEnter,
            onMouseLeave: this.handleMouseLeave,
            style: {
              backgroundColor: hovered ? 'lightblue' : 'white'
            }
          }, `Clicked ${count} times`);
        }
      }

      await act(() => {
        render(createElement(EventfulComponent, null), container);
      });

      const button = container.querySelector('button');
      expect(button.textContent).toBe('Clicked 0 times');
      expect(button.style.backgroundColor).toBe('white');

      await act(() => {
        fireEvent(button, 'click');
      });
      expect(button.textContent).toBe('Clicked 1 times');

      await act(() => {
        fireEvent(button, 'mouseenter');
      });
      expect(button.style.backgroundColor).toBe('lightblue');

      await act(() => {
        fireEvent(button, 'mouseleave');
      });
      expect(button.style.backgroundColor).toBe('white');
    });
  });
});