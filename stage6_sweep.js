#!/usr/bin/env node

/**
 * Stage 6 Final Sweep — Canon‑Driven Version
 * Nathan's BloomBug integrity check with fuzzy matching
 */

const fs = require('fs');
const path = require('path');

// === CONFIG ===
const canonPath = path.join(__dirname, '../data/grifts_canon.json');
const bloomBugAssetDir = path.join(__dirname, '../assets/bloombugs');

// === LOAD CANON ===
const canon = require(canonPath);
const bloomBugIDs = Object.keys(canon.bloombugs);

// === LOAD ASSET FILENAMES ===
const assetFiles = fs.readdirSync(bloomBugAssetDir)
  .filter(f => !f.startsWith('.'))
  .map(f => path.basename(f, path.extname(f)));

// === CASE‑INSENSITIVE MATCHING ===
const canonLower = bloomBugIDs.map(id => id.toLowerCase());
const assetsLower = assetFiles.map(f => f.toLowerCase());

// === DIRECT MISMATCHES ===
const missingAssets = bloomBugIDs.filter(id => !assetsLower.includes(id.toLowerCase()));
const extraAssets = assetFiles.filter(f => !canonLower.includes(f.toLowerCase()));

// === FUZZY MATCH HELPER ===
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function suggestMatches(missing, extras) {
  const suggestions = [];
  missing.forEach(miss => {
    let best = { name: null, dist: Infinity };
    extras.forEach(extra => {
      const dist = levenshtein(miss, extra);
      if (dist < best.dist) best = { name: extra, dist };
    });
    if (best.dist > 0 && best.dist <= 3) {
      suggestions.push({ canon: miss, asset: best.name, distance: best.dist });
    }
  });
  return suggestions;
}

// === FUZZY SUGGESTIONS ===
const fuzzySuggestions = suggestMatches(
  missingAssets.map(m => m.toLowerCase()),
  extraAssets.map(e => e.toLowerCase())
);

// === REPORT ===
console.log('=== Stage 6 Final Sweep ===\n');

console.log(`BloomBug Missing Assets: ${missingAssets.length}`);
if (missingAssets.length) console.log(missingAssets.join(', '), '\n');

console.log(`BloomBug Extra Assets: ${extraAssets.length}`);
if (extraAssets.length) console.log(extraAssets.join(', '), '\n');

if (fuzzySuggestions.length) {
  console.log('Possible Fuzzy Matches (naming drift):');
  fuzzySuggestions.forEach(s =>
    console.log(`  Canon: ${s.canon} ↔ Asset: ${s.asset} (distance ${s.distance})`)
  );
  console.log('');
}

// === PLACEHOLDER FOR OTHER STAGE 6 CHECKS ===
// Keep your existing logic for:
// - Missing duals
// - Extra combos
// - Missing assets in other categories
// - Orphan assets in other categories
// Just slot this BloomBug section in place of the old one.

console.log('Stage 6 sweep complete.');
