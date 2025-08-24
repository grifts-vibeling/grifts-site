#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Stage 6 Final Sweep\n');

// Paths
const canonPath = path.join(__dirname, 'data', 'grifts_canon.json');
const bloombugsDir = path.join(__dirname, 'assets', 'bloombugs');

// Load canon
if (!fs.existsSync(canonPath)) {
  console.error(`❌ Canon file not found at ${canonPath}`);
  process.exit(1);
}
const canon = JSON.parse(fs.readFileSync(canonPath, 'utf8'));

// Extract intended duals
let EXPECTED_DUALS = [];
if (Array.isArray(canon.intendedDuals)) {
  EXPECTED_DUALS = canon.intendedDuals.map(k => k.split('+').sort().join('+'));
} else if (canon.mutation_rules) {
  EXPECTED_DUALS = Object.values(canon.mutation_rules)
    .filter(r => r.type === 'dual' && Array.isArray(r.emotions))
    .map(r => r.emotions.slice().sort().join('+'));
}
EXPECTED_DUALS = [...new Set(EXPECTED_DUALS)];

// Load BloomBug JSONs
if (!fs.existsSync(bloombugsDir)) {
  console.error(`❌ BloomBugs directory not found at ${bloombugsDir}`);
  process.exit(1);
}
const bloombugFiles = fs.readdirSync(bloombugsDir).filter(f => f.endsWith('.json'));

let actualCombos = [];
let jsonIDs = [];
let missingAssets = [];
let orphanAssets = [];

// Gather combos + check asset references
bloombugFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(bloombugsDir, file), 'utf8'));
  jsonIDs.push(path.basename(file, '.json'));

  if (Array.isArray(data.emotions) && data.emotions.length === 2) {
    actualCombos.push(data.emotions.slice().sort().join('+'));
  }

  // Check referenced assets exist
  ['image', 'sprite', 'audio'].forEach(key => {
    if (data[key]) {
      const assetPath = path.join(bloombugsDir, data[key]);
      if (!fs.existsSync(assetPath)) {
        missingAssets.push(`${file} → ${data[key]}`);
      }
    }
  });
});
actualCombos = [...new Set(actualCombos)];

// Orphaned assets (files without matching JSON)
const allAssetFiles = fs.readdirSync(bloombugsDir).filter(f => !f.endsWith('.json'));
allAssetFiles.forEach(asset => {
  const id = asset.split('.')[0];
  if (!jsonIDs.includes(id)) {
    orphanAssets.push(asset);
  }
});

// Canon diff
const canonIDs = Object.keys(canon.bloombugs || {});
const missingInCanon = jsonIDs.filter(id => !canonIDs.includes(id));
const missingInJSON = canonIDs.filter(id => !jsonIDs.includes(id));

// Compare combos
const missingCombos = EXPECTED_DUALS.filter(c => !actualCombos.includes(c));
const extraCombos = actualCombos.filter(c => !EXPECTED_DUALS.includes(c));

// Report
missingCombos.forEach(c => console.warn(`⚠️ Missing dual: ${c}`));
extraCombos.forEach(c => console.warn(`⚠️ Extra combo: ${c}`));
missingAssets.forEach(m => console.warn(`⚠️ Missing asset: ${m}`));
orphanAssets.forEach(o => console.warn(`⚠️ Orphan asset: ${o}`));
missingInCanon.forEach(id => console.warn(`⚠️ BloomBug in assets but not in canon: ${id}`));
missingInJSON.forEach(id => console.warn(`⚠️ BloomBug in canon but no JSON: ${id}`));

// Summary
console.log('\n📊 Summary:');
console.log(`  Missing duals: ${missingCombos.length}`);
console.log(`  Extra combos: ${extraCombos.length}`);
console.log(`  Missing assets: ${missingAssets.length}`);
console.log(`  Orphan assets: ${orphanAssets.length}`);
console.log(`  Asset-only IDs: ${missingInCanon.length}`);
console.log(`  Canon-only IDs: ${missingInJSON.length}`);

console.log('\n✅ Stage 6 sweep complete.\n');
