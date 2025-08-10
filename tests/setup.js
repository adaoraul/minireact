import '@testing-library/jest-dom';

global.requestIdleCallback = jest.fn((cb) => {
  // Store the callback but don't execute it immediately
  // Let the act function control execution
  return Math.random();
});

global.cancelIdleCallback = jest.fn();

beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});