const crypto = require('node:crypto');

// When running jest tests in node 18, this is not defined despite normally
// being defined in node 18+. This does not appear to be an issue in Node 19+.
if (globalThis.crypto === undefined) {
  Object.defineProperty(globalThis, 'crypto', {
    value: crypto.webcrypto,
  });
}
