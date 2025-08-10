// Debug test to isolate the deeply nested mixed components issue
import MiniReact from './src/index.js';
import { Component } from './src/component.js';

const { createElement, render, useState, useEffect } = MiniReact;

// Mock requestIdleCallback for Node.js environment
global.requestIdleCallback = (callback) => {
  setTimeout(() => {
    callback({
      timeRemaining: () => 50,
      didTimeout: false
    });
  }, 0);
};

// Create a simple DOM-like container
const createMockContainer = () => {
  const elements = new Map();
  let idCounter = 0;
  
  const createElement = (tagName) => {
    const id = ++idCounter;
    const element = {
      id,
      tagName: tagName.toUpperCase(),
      textContent: '',
      className: '',
      children: [],
      parentNode: null,
      appendChild: function(child) {
        this.children.push(child);
        child.parentNode = this;
      },
      removeChild: function(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
        }
      },
      querySelector: function(selector) {
        if (selector.startsWith('.')) {
          const className = selector.substring(1);
          for (const child of this.children) {
            if (child.className === className) return child;
            if (child.querySelector) {
              const found = child.querySelector(selector);
              if (found) return found;
            }
          }
        } else {
          const tagName = selector.toUpperCase();
          for (const child of this.children) {
            if (child.tagName === tagName) return child;
            if (child.querySelector) {
              const found = child.querySelector(selector);
              if (found) return found;
            }
          }
        }
        return null;
      }
    };
    elements.set(id, element);
    return element;
  };
  
  // Mock document
  global.document = {
    createElement,
    body: createElement('body')
  };
  
  return createElement('div');
};

// Test components
const Level3 = ({ text }) => {
  console.log('Level3 rendering with text:', text);
  return createElement('p', null, text);
};

class Level2 extends Component {
  render() {
    console.log('Level2 rendering with props:', this.props);
    return createElement('div', { className: 'level2' },
      createElement(Level3, { text: this.props.text })
    );
  }
}

const Level1 = () => {
  console.log('Level1 rendering');
  const [text, setText] = useState('Initial');
  console.log('Level1 current text state:', text);
  
  useEffect(() => {
    console.log('useEffect running, setting text to Updated');
    setText('Updated');
    console.log('useEffect completed setState call');
  }, []);
  
  return createElement(Level2, { text });
};

// Run the test
async function runTest() {
  console.log('Starting test...');
  const container = createMockContainer();
  
  console.log('Initial render...');
  render(createElement(Level1, null), container);
  
  // Wait for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log('Checking result...');
  const pElement = container.querySelector('p');
  console.log('Found p element:', pElement);
  console.log('Text content:', pElement ? pElement.textContent : 'not found');
  console.log('Expected: "Updated", Actual:', pElement ? pElement.textContent : 'not found');
  
  if (pElement && pElement.textContent === 'Updated') {
    console.log('✅ TEST PASSED');
  } else {
    console.log('❌ TEST FAILED');
  }
}

runTest().catch(console.error);