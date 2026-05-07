#!/usr/bin/env node
/**
 * whatsapp-rust-bridge@0.5.3 só declara `exports["."].import` — resolução via tsx/contexto CJS
 * falha com ERR_PACKAGE_PATH_NOT_EXPORTED. Isto adiciona `require` e `default` para o mesmo entry.
 * Idempotente: pode correr várias vezes.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'node_modules', 'whatsapp-rust-bridge', 'package.json');

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

let raw;
try {
  raw = fs.readFileSync(pkgPath, 'utf8');
} catch {
  process.exit(0);
}

const pkg = JSON.parse(raw);
if (!pkg.exports || typeof pkg.exports !== 'object') {
  process.exit(0);
}

const dot = pkg.exports['.'];
if (!dot || typeof dot !== 'object') {
  process.exit(0);
}

if (dot.require && dot.default) {
  process.exit(0);
}

const entry =
  typeof dot.import === 'string'
    ? dot.import
    : './dist/index.js';

pkg.exports['.'] = {
  types: dot.types || './dist/index.d.ts',
  import: dot.import || entry,
  require: entry,
  default: entry
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n');
console.warn('[postinstall] whatsapp-rust-bridge: exports patch aplicado (tsx / resolução CJS).');
