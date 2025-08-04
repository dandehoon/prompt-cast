/// <reference types="jest" />
import '@testing-library/jest-dom';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    get: jest.fn(),
    sendMessage: jest.fn(),
    onRemoved: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    },
  },
  windows: {
    update: jest.fn(),
  },
};

// @ts-ignore
global.chrome = mockChrome;

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Mock document methods
Object.defineProperty(document, 'querySelector', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(document, 'querySelectorAll', {
  value: jest.fn(),
  writable: true,
});

// Mock logger to prevent console noise in tests
jest.mock('./logger', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  return {
    logger: mockLogger,
    Logger: jest.fn(() => mockLogger),
  };
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
