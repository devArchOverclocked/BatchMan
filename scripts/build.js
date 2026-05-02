#!/usr/bin/env node
// Validates knowledge-base/alerts.json and copies it into the extension folder.
// Run this after every `git pull` that touches the knowledge base.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC  = path.resolve(__dirname, '../knowledge-base/alerts.json');
const DEST = path.resolve(__dirname, '../extension/alerts.json');

// Run validate first — exits with code 1 on errors, which stops the build.
try {
  execSync(`node ${path.resolve(__dirname, 'validate.js')}`, { stdio: 'inherit' });
} catch {
  process.exit(1);
}

fs.copyFileSync(SRC, DEST);
console.log(`✓ Copied alerts.json → extension/alerts.json`);
console.log(`\nNext step: open chrome://extensions and click ↺ on the BatchMan card to reload.\n`);
