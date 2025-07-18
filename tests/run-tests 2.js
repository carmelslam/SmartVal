// Provide a minimal sessionStorage mock for tests that rely on browser APIs
global.sessionStorage = {
  _store: {},
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this._store, key)
      ? this._store[key]
      : null;
  },
  setItem(key, value) {
    this._store[key] = String(value);
  },
  removeItem(key) {
    delete this._store[key];
  },
  clear() {
    this._store = {};
  }
};

// Dynamically load the test files after the environment is prepared
await import('./renderHTMLBlock.test.js');
await import('./validation.test.js');
await import('./feeCalculation.test.js');
await import('./finalReportDepreciation.test.js');
