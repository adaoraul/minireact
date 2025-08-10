import { createDom, updateDom } from '../../../src/vdom/updateDom.js';
import { TEXT_ELEMENT } from '../../../src/core/constants.js';

describe('updateDom', () => {
  describe('createDom', () => {
    test('creates DOM element for host component', () => {
      const fiber = {
        type: 'div',
        props: {
          id: 'test-id',
          className: 'test-class',
          children: []
        }
      };
      
      const dom = createDom(fiber);
      
      expect(dom.tagName).toBe('DIV');
      expect(dom.id).toBe('test-id');
      expect(dom.className).toBe('test-class');
    });

    test('creates text node for TEXT_ELEMENT', () => {
      const fiber = {
        type: TEXT_ELEMENT,
        props: {
          nodeValue: 'Hello World',
          children: []
        }
      };
      
      const dom = createDom(fiber);
      
      expect(dom.nodeType).toBe(Node.TEXT_NODE);
      expect(dom.nodeValue).toBe('Hello World');
    });

    test('sets initial properties on DOM element', () => {
      const fiber = {
        type: 'input',
        props: {
          type: 'text',
          value: 'initial',
          disabled: true,
          children: []
        }
      };
      
      const dom = createDom(fiber);
      
      expect(dom.type).toBe('text');
      expect(dom.value).toBe('initial');
      expect(dom.disabled).toBe(true);
    });

    test('attaches event listeners', () => {
      const onClick = jest.fn();
      const fiber = {
        type: 'button',
        props: {
          onClick,
          children: []
        }
      };
      
      const dom = createDom(fiber);
      dom.click();
      
      expect(onClick).toHaveBeenCalled();
    });

    test('handles style object', () => {
      const fiber = {
        type: 'div',
        props: {
          style: {
            color: 'red',
            fontSize: '16px',
            backgroundColor: 'blue'
          },
          children: []
        }
      };
      
      const dom = createDom(fiber);
      
      expect(dom.style.color).toBe('red');
      expect(dom.style.fontSize).toBe('16px');
      expect(dom.style.backgroundColor).toBe('blue');
    });
  });

  describe('updateDom property updates', () => {
    let dom;

    beforeEach(() => {
      dom = document.createElement('div');
    });

    test('adds new properties', () => {
      const prevProps = { children: [] };
      const nextProps = { 
        id: 'new-id',
        className: 'new-class',
        children: []
      };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.id).toBe('new-id');
      expect(dom.className).toBe('new-class');
    });

    test('removes old properties', () => {
      dom.id = 'old-id';
      dom.className = 'old-class';
      
      const prevProps = {
        id: 'old-id',
        className: 'old-class',
        children: []
      };
      const nextProps = { children: [] };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.id).toBe('');
      expect(dom.className).toBe('');
    });

    test('updates changed properties', () => {
      dom.id = 'old-id';
      
      const prevProps = { id: 'old-id', children: [] };
      const nextProps = { id: 'new-id', children: [] };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.id).toBe('new-id');
    });

    test('handles boolean attributes correctly', () => {
      const input = document.createElement('input');
      
      const prevProps = { disabled: false, children: [] };
      const nextProps = { disabled: true, children: [] };
      
      updateDom(input, prevProps, nextProps);
      expect(input.disabled).toBe(true);
      
      updateDom(input, nextProps, prevProps);
      expect(input.disabled).toBe(false);
    });

    test('updates value property for input elements', () => {
      const input = document.createElement('input');
      
      const prevProps = { value: 'old', children: [] };
      const nextProps = { value: 'new', children: [] };
      
      updateDom(input, prevProps, nextProps);
      
      expect(input.value).toBe('new');
    });

    test('updates checked property for checkbox', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      
      const prevProps = { checked: false, children: [] };
      const nextProps = { checked: true, children: [] };
      
      updateDom(checkbox, prevProps, nextProps);
      
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('updateDom event handling', () => {
    let dom;

    beforeEach(() => {
      dom = document.createElement('button');
    });

    test('adds new event listeners', () => {
      const onClick = jest.fn();
      
      const prevProps = { children: [] };
      const nextProps = { onClick, children: [] };
      
      updateDom(dom, prevProps, nextProps);
      dom.click();
      
      expect(onClick).toHaveBeenCalled();
    });

    test('removes old event listeners', () => {
      const onClick = jest.fn();
      
      const prevProps = { onClick, children: [] };
      const nextProps = { children: [] };
      
      updateDom(dom, prevProps, nextProps);
      dom.click();
      
      expect(onClick).not.toHaveBeenCalled();
    });

    test('replaces event listeners', () => {
      const oldClick = jest.fn();
      const newClick = jest.fn();
      
      const prevProps = { onClick: oldClick, children: [] };
      const nextProps = { onClick: newClick, children: [] };
      
      updateDom(dom, prevProps, nextProps);
      dom.click();
      
      expect(oldClick).not.toHaveBeenCalled();
      expect(newClick).toHaveBeenCalled();
    });

    test('handles multiple event types', () => {
      const onClick = jest.fn();
      const onMouseOver = jest.fn();
      const onFocus = jest.fn();
      
      const prevProps = { children: [] };
      const nextProps = { onClick, onMouseOver, onFocus, children: [] };
      
      updateDom(dom, prevProps, nextProps);
      
      dom.click();
      expect(onClick).toHaveBeenCalled();
      
      dom.dispatchEvent(new Event('mouseover'));
      expect(onMouseOver).toHaveBeenCalled();
      
      dom.dispatchEvent(new Event('focus'));
      expect(onFocus).toHaveBeenCalled();
    });
  });

  describe('updateDom style handling', () => {
    let dom;

    beforeEach(() => {
      dom = document.createElement('div');
    });

    test('adds style object', () => {
      const prevProps = { children: [] };
      const nextProps = {
        style: { color: 'red', fontSize: '20px' },
        children: []
      };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.style.color).toBe('red');
      expect(dom.style.fontSize).toBe('20px');
    });

    test('removes style object', () => {
      dom.style.color = 'red';
      dom.style.fontSize = '20px';
      
      const prevProps = {
        style: { color: 'red', fontSize: '20px' },
        children: []
      };
      const nextProps = { children: [] };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.style.color).toBe('');
      expect(dom.style.fontSize).toBe('');
    });

    test('updates style properties', () => {
      const prevProps = {
        style: { color: 'red', fontSize: '20px' },
        children: []
      };
      const nextProps = {
        style: { color: 'blue', fontSize: '20px', backgroundColor: 'yellow' },
        children: []
      };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.style.color).toBe('blue');
      expect(dom.style.fontSize).toBe('20px');
      expect(dom.style.backgroundColor).toBe('yellow');
    });

    test('handles camelCase style properties', () => {
      const prevProps = { children: [] };
      const nextProps = {
        style: {
          backgroundColor: 'red',
          marginTop: '10px',
          paddingLeft: '5px'
        },
        children: []
      };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.style.backgroundColor).toBe('red');
      expect(dom.style.marginTop).toBe('10px');
      expect(dom.style.paddingLeft).toBe('5px');
    });
  });

  describe('updateDom special attributes', () => {
    test('ignores children prop', () => {
      const dom = document.createElement('div');
      const prevProps = { children: ['old'] };
      const nextProps = { children: ['new'] };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.children).not.toBe('new');
    });

    test('handles className as class attribute', () => {
      const dom = document.createElement('div');
      const prevProps = { children: [] };
      const nextProps = { className: 'test-class', children: [] };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.className).toBe('test-class');
    });

    test('handles htmlFor as for attribute', () => {
      const label = document.createElement('label');
      const prevProps = { children: [] };
      const nextProps = { htmlFor: 'input-id', children: [] };
      
      updateDom(label, prevProps, nextProps);
      
      expect(label.htmlFor).toBe('input-id');
    });

    test('sets attributes for non-standard properties', () => {
      const dom = document.createElement('div');
      const prevProps = { children: [] };
      const nextProps = {
        'data-testid': 'test',
        'aria-label': 'Test Label',
        children: []
      };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.getAttribute('data-testid')).toBe('test');
      expect(dom.getAttribute('aria-label')).toBe('Test Label');
    });
  });

  describe('edge cases', () => {
    test('handles null and undefined values', () => {
      const dom = document.createElement('div');
      const prevProps = {
        id: 'test',
        className: 'class',
        children: []
      };
      const nextProps = {
        id: null,
        className: undefined,
        children: []
      };
      
      updateDom(dom, prevProps, nextProps);
      
      expect(dom.id).toBe('');
      expect(dom.className).toBe('');
    });

    test('handles text node updates', () => {
      const textNode = document.createTextNode('old text');
      const prevProps = { nodeValue: 'old text' };
      const nextProps = { nodeValue: 'new text' };
      
      updateDom(textNode, prevProps, nextProps);
      
      expect(textNode.nodeValue).toBe('new text');
    });

    test('handles empty props objects', () => {
      const dom = document.createElement('div');
      
      expect(() => {
        updateDom(dom, {}, {});
      }).not.toThrow();
    });
  });
});