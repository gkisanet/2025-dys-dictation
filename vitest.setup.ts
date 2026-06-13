import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver — provide a no-op polyfill so any
// component that uses it (e.g. WorksheetScaler) doesn't throw in tests.
if (typeof ResizeObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
