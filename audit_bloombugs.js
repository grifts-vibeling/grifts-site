#!/usr/bin/env node

/**
 * BloomBug Audit Script
 * ---------------------
 * Dynamically loads intended dual emotion combos from data/grifts_canon.json
 * and compares them to the actual combos in BloomBug entries.
 *
 * Flags:
 *  - Missing duals (in canon list but not present in BloomBugs)
 *  - Extras (present in BloomBugs but not in canon list)
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Auditing BloomBug entries...\n');

// --- 1. Load canon ---
const canonPath = path.join(__dirname, 'data', 'grifts_canon.json');
if (!fs.existsSync(canonPath)) {
  console.error(`❌ Canon file not found at ${canonPath}`);
  process.exit(1);
}

const canon = JSON.parse(fs.readFileSync(canonPath, 'utf8'));

// --- 2. Extract intended duals from canon ---
let EXPECTED_DUALS = [];

// Option A: dedicated array in canon
if (Array.isArray(canon.intendedDuals)) {
  EXPECTED_DUALS = canon.intendedDuals.map(k =>
    k.split('+').sort().join('+')
  );
}

// Option B: derive from mutation_rules
else if (canon.mutation_rules) {
  EXPECTED_DUALS = Object.values(canon.mutation_rules)
    .filter(rule => rule.type === 'dual' && Array.isArray(rule.emotions))
    .map(rule => rule.emotions.slice().sort().join('+'));
}

// Deduplicate
EXPECTED_DUALS = [...new Set(EXPECTED_DUALS)];

// --- 3. Load BloomBug entries ---
const bloombugsDir = path.join(__dirname, 'bloombugs');
if (!fs.existsSync(bloombugsDir)) {
  console.error(`❌ BloomBugs directory not found at ${bloombugsDir}`);
  process.exit(1);
}

const bloombugFiles = fs.readdirSync(bloombugsDir).filter(f => f.endsWith('.json'));

let actualCombos = [];

bloombugFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(bloombugsDir, file), 'utf8'));

  if (Array.isArray(data.emotions) && data.emotions.length === 2) {
    const combo = data.emotions.slice().sort().join('+');
    actualCombos.push(combo);
  }
});

// Deduplicate actual combos
actualCombos = [...new Set(actualCombos)];

// --- 4. Compare ---
const missing = EXPECTED_DUALS.filter(combo => !actualCombos.includes(combo));
const extras = actualCombos.filter(combo => !EXPECTED_DUALS.includes(combo));

// --- 5. Report ---
missing.forEach(combo => {
  console.warn(`⚠️ Missing dual emotion evolution for: ${combo}`);
});

extras.forEach(combo => {
  // Find which BloomBug(s) have this combo
  const offenders = bloombugFiles.filter(file => {
    const data = JSON.parse(fs.readFileSync(path.join(bloombugsDir, file), 'utf8'));
    return Array.isArray(data.emotions) &&
           data.emotions.slice().sort().join('+') === combo;
  }).map(f => path.basename(f, '.json'));

  offenders.forEach(name => {
    console.warn(`⚠️ ${name}: has an emotion combo not in intended list -> ${combo}`);
  });
});

console.log(
  missing.length || extras.length
    ? '\n✅ Audit complete. Issues found – see above.\n'
    : '\n✅ Audit complete. No issues found.\n'
);
