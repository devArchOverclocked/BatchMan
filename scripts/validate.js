#!/usr/bin/env node
// Validates knowledge-base/alerts.json and exits with code 1 on errors.

const fs = require('fs');
const path = require('path');

const KB_PATH = path.resolve(__dirname, '../knowledge-base/alerts.json');

const REQUIRED_FIELDS = ['id', 'match', 'title', 'hint'];
const OPTIONAL_FIELDS = ['wiki', 'sql', 'action'];
const VALID_ACTIONS = new Set(['close', 'sql', 'escalate']);
const ALL_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);

let errors = [];
let warnings = [];

function error(msg) { errors.push(`  ✗ ${msg}`); }
function warn(msg)  { warnings.push(`  ⚠ ${msg}`); }

// ── Load ──────────────────────────────────────────────────────────────────────
let raw;
try {
  raw = fs.readFileSync(KB_PATH, 'utf8');
} catch (e) {
  console.error(`Cannot read ${KB_PATH}: ${e.message}`);
  process.exit(1);
}

let entries;
try {
  entries = JSON.parse(raw);
} catch (e) {
  console.error(`Invalid JSON in alerts.json: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(entries)) {
  console.error('alerts.json must be a JSON array.');
  process.exit(1);
}

// ── Per-entry checks ──────────────────────────────────────────────────────────
const seenIds = new Map();
const seenMatches = new Map();

entries.forEach((entry, i) => {
  const label = entry.id ? `[${entry.id}]` : `[index ${i}]`;

  // Required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!entry[field] || typeof entry[field] !== 'string' || !entry[field].trim()) {
      error(`${label}: missing or empty required field "${field}"`);
    }
  });

  // Optional string-or-null fields
  ['wiki', 'sql'].forEach(field => {
    if (field in entry && entry[field] !== null && typeof entry[field] !== 'string') {
      error(`${label}: "${field}" must be a string or null`);
    }
  });

  // action must be a recognised value if present
  if ('action' in entry && entry.action !== null) {
    if (!VALID_ACTIONS.has(entry.action)) {
      error(`${label}: "action" must be one of: ${[...VALID_ACTIONS].join(', ')} (got "${entry.action}")`);
    }
    // Warn if action is "sql" but no SQL is provided
    if (entry.action === 'sql' && !entry.sql) {
      warn(`${label}: action is "sql" but no sql field is provided`);
    }
  }

  // Unknown fields
  Object.keys(entry).forEach(key => {
    if (!ALL_FIELDS.has(key)) {
      warn(`${label}: unknown field "${key}" (will be ignored by extension)`);
    }
  });

  // Duplicate IDs
  if (entry.id) {
    if (seenIds.has(entry.id)) {
      error(`Duplicate id "${entry.id}" (also at index ${seenIds.get(entry.id)})`);
    } else {
      seenIds.set(entry.id, i);
    }
  }

  // Duplicate match strings (case-insensitive)
  if (entry.match) {
    const key = entry.match.toLowerCase();
    if (seenMatches.has(key)) {
      error(`${label}: duplicate match string "${entry.match}" (also used by id "${seenMatches.get(key)}")`);
    } else {
      seenMatches.set(key, entry.id || i);
    }
  }

  // Warn if wiki looks like a placeholder
  if (entry.wiki && entry.wiki.includes('YOUR_WIKI')) {
    warn(`${label}: wiki URL still contains placeholder "YOUR_WIKI"`);
  }
});

// ── Report ────────────────────────────────────────────────────────────────────
console.log(`\nBatchMan knowledge base — ${entries.length} entries\n`);

if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach(w => console.log(w));
  console.log('');
}

if (errors.length) {
  console.log('Errors:');
  errors.forEach(e => console.log(e));
  console.log(`\nFix the errors above before building.\n`);
  process.exit(1);
}

console.log('✓ Validation passed.\n');
