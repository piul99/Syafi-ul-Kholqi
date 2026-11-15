// Ensure window.fetch is writable and cannot throw getter-only errors
(function ensureWritableFetch() {
  try {
    if (typeof window !== 'undefined') {
      const nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined;
      let currentFetch = nativeFetch;
      const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
      if (!desc || !desc.set) {
        try {
          Object.defineProperty(window, 'fetch', {
            configurable: true,
            enumerable: true,
            get() {
              return currentFetch;
            },
            set(fn) {
              currentFetch = fn;
            },
          });
        } catch (_) {}
      }
    }
  } catch (_) {}
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
