import { createElement } from '../../../src/vdom/createElement.js';
import { TEXT_ELEMENT, Fragment } from '../../../src/core/constants.js';

describe('createElement', () => {
  describe('basic element creation', () => {
    test('creates element with type and props', () => {
      const element = createElement('div', { id: 'test' });
      
      expect(element).toEqual({
        type: 'div',
        props: {
          id: 'test',
          children: []
        }
      });
    });

    test('creates element with null props', () => {
      const element = createElement('span', null);
      
      expect(element).toEqual({
        type: 'span',
        props: {
          children: []
        }
      });
    });

    test('creates element with children', () => {
      const element = createElement('div', null, 'Hello', 'World');
      
      expect(element).toEqual({
        type: 'div',
        props: {
          children: [
            {
              type: TEXT_ELEMENT,
              props: {
                nodeValue: 'Hello',
                children: []
              }
            },
            {
              type: TEXT_ELEMENT,
              props: {
                nodeValue: 'World',
                children: []
              }
            }
          ]
        }
      });
    });
  });

  describe('children handling', () => {
    test('flattens nested children arrays', () => {
      const child1 = createElement('span', null, 'child1');
      const child2 = createElement('span', null, 'child2');
      const element = createElement('div', null, [child1, child2]);
      
      expect(element.props.children).toHaveLength(2);
      expect(element.props.children[0]).toBe(child1);
      expect(element.props.children[1]).toBe(child2);
    });

    test('filters out null and undefined children', () => {
      const element = createElement('div', null, 'text', null, undefined, 'more text');
      
      expect(element.props.children).toHaveLength(2);
      expect(element.props.children[0].props.nodeValue).toBe('text');
      expect(element.props.children[1].props.nodeValue).toBe('more text');
    });

    test('handles boolean children', () => {
      const element = createElement('div', null, true, false, 'text');
      
      // Implementation converts true to text element, filters out false
      expect(element.props.children).toHaveLength(2);
      expect(element.props.children[0].props.nodeValue).toBe(true);
      expect(element.props.children[1].props.nodeValue).toBe('text');
    });

    test('converts number children to text elements', () => {
      const element = createElement('div', null, 42, 3.14);
      
      expect(element.props.children).toHaveLength(2);
      expect(element.props.children[0]).toEqual({
        type: TEXT_ELEMENT,
        props: {
          nodeValue: 42,
          children: []
        }
      });
      expect(element.props.children[1].props.nodeValue).toBe(3.14);
    });

    test('handles zero as valid child', () => {
      const element = createElement('div', null, 0);
      
      expect(element.props.children).toHaveLength(1);
      expect(element.props.children[0].props.nodeValue).toBe(0);
    });
  });

  describe('component types', () => {
    test('creates element with function component type', () => {
      const Component = () => createElement('div', null);
      const element = createElement(Component, { prop: 'value' });
      
      expect(element).toEqual({
        type: Component,
        props: {
          prop: 'value',
          children: []
        }
      });
    });

    test('creates element with class component type', () => {
      class Component {
        render() {
          return createElement('div', null);
        }
      }
      const element = createElement(Component, { prop: 'value' });
      
      expect(element).toEqual({
        type: Component,
        props: {
          prop: 'value',
          children: []
        }
      });
    });
  });

  describe('Fragment support', () => {
    test('creates Fragment element', () => {
      const result = createElement(Fragment, null, 
        createElement('div', null),
        createElement('span', null)
      );
      
      // Fragment returns an array of children, not an element
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('div');
      expect(result[1].type).toBe('span');
    });
  });

  describe('special props', () => {
    test('preserves key prop', () => {
      const element = createElement('div', { key: 'unique-key', id: 'test' });
      
      expect(element).toEqual({
        type: 'div',
        props: {
          key: 'unique-key',
          id: 'test',
          children: []
        }
      });
    });

    test('preserves ref prop', () => {
      const ref = { current: null };
      const element = createElement('div', { ref, id: 'test' });
      
      expect(element).toEqual({
        type: 'div',
        props: {
          ref,
          id: 'test',
          children: []
        }
      });
    });

    test('handles className prop', () => {
      const element = createElement('div', { className: 'test-class' });
      
      expect(element.props.className).toBe('test-class');
    });

    test('handles event handlers', () => {
      const onClick = jest.fn();
      const onMouseOver = jest.fn();
      const element = createElement('button', { onClick, onMouseOver });
      
      expect(element.props.onClick).toBe(onClick);
      expect(element.props.onMouseOver).toBe(onMouseOver);
    });
  });

  describe('edge cases', () => {
    test('handles empty string as text child', () => {
      const element = createElement('div', null, '');
      
      expect(element.props.children).toHaveLength(1);
      expect(element.props.children[0].props.nodeValue).toBe('');
    });

    test('deeply nested children arrays', () => {
      const element = createElement('div', null, [[[['deep']]]]);
      
      expect(element.props.children).toHaveLength(1);
      expect(element.props.children[0].props.nodeValue).toBe('deep');
    });

    test('mixed nested content', () => {
      const span = createElement('span', null, 'span text');
      const element = createElement('div', null, 
        'text',
        [span, null, [42, undefined, true]],
        false
      );
      
      // true is not filtered out, only false, null, and undefined
      expect(element.props.children).toHaveLength(4);
      expect(element.props.children[0].props.nodeValue).toBe('text');
      expect(element.props.children[1]).toBe(span);
      expect(element.props.children[2].props.nodeValue).toBe(42);
      expect(element.props.children[3].props.nodeValue).toBe(true);
    });

    test('preserves object children as-is', () => {
      const objectChild = { custom: 'object' };
      const element = createElement('div', null, objectChild);
      
      expect(element.props.children).toHaveLength(1);
      expect(element.props.children[0]).toBe(objectChild);
    });
  });
});