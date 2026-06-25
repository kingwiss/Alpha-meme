import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  // Safe shadow-assignment polyfill for fetch and DOMException to prevent "TypeError: Attempted to assign to readonly property"
  const safeDefineShadow = (target: any, prop: string, originalVal: any) => {
    try {
      let currentVal = originalVal;
      Object.defineProperty(target, prop, {
        get: () => currentVal,
        set: function(this: any, val: any) {
          if (this === target || this === window || (typeof globalThis !== 'undefined' && this === globalThis)) {
            currentVal = val;
          } else {
            Object.defineProperty(this, prop, {
              value: val,
              writable: true,
              enumerable: true,
              configurable: true
            });
          }
        },
        configurable: true
      });
    } catch (e) {
      console.warn(`safeDefineShadow failed for ${prop} on target:`, e);
    }
  };

  if (typeof (window as any).fetch !== 'undefined') {
    const nativeFetch = (window as any).fetch;
    if (typeof Window !== 'undefined' && Window.prototype) {
      safeDefineShadow(Window.prototype, 'fetch', nativeFetch);
    }
    safeDefineShadow(window, 'fetch', nativeFetch);
  }

  if (typeof (window as any).DOMException !== 'undefined') {
    const nativeDOM = (window as any).DOMException;
    if (typeof Window !== 'undefined' && Window.prototype) {
      safeDefineShadow(Window.prototype, 'DOMException', nativeDOM);
    }
    safeDefineShadow(window, 'DOMException', nativeDOM);
  }

  // Safe Buffer polyfill
  try {
    if (typeof (window as any).Buffer === 'undefined') {
      Object.defineProperty(window, 'Buffer', {
        value: Buffer,
        writable: true,
        configurable: true
      });
    }
  } catch (e) {
    console.warn("Buffer polyfill failed:", e);
    try {
      (window as any).Buffer = Buffer;
    } catch (err) {
      console.error("Direct Buffer assignment failed:", err);
    }
  }

  // Safe global polyfill
  try {
    if (typeof (window as any).global === 'undefined') {
      Object.defineProperty(window, 'global', {
        value: window,
        writable: true,
        configurable: true
      });
    }
  } catch (e) {
    console.warn("global polyfill failed:", e);
    try {
      (window as any).global = window;
    } catch (err) {
      console.error("Direct global assignment failed:", err);
    }
  }

  // Safe process polyfill
  try {
    if (typeof (window as any).process === 'undefined') {
      Object.defineProperty(window, 'process', {
        value: {
          env: {},
          browser: true,
          version: '',
          nextTick: (fn: any) => setTimeout(fn, 0)
        },
        writable: true,
        configurable: true
      });
    }
  } catch (e) {
    console.warn("process polyfill failed:", e);
    try {
      (window as any).process = {
        env: {},
        browser: true,
        version: '',
        nextTick: (fn: any) => setTimeout(fn, 0)
      };
    } catch (err) {
      console.error("Direct process assignment failed:", err);
    }
  }
}

