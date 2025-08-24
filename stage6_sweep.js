#!/usr/bin/env node

/**
 * Stage 6 Final Sweep — Fully Canon‑Driven + Auto‑Discovery
 * Works with Nathan's repo structure
 */

const fs = require('fs');
const path = require('path');

// === CONFIG ===
const canonPath = path.join(__dirname, 'data', 'grifts_canon.json');
const assetBaseDir = path.join(__dirname, 'assets');

// === LOAD CANON ===
if (!fs.existsSync(canonPath)) {
  console.error(`❌ Canon file not found at ${canonPath}`);
  process.exit(1);
}
const canon = JSON.parse(fs.readFileSync(canonPath, 'utf8'));

// === FUZZY MATCH HELPER ===
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1].toLowerCase() === a[j - 1].toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
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

// === CATEGORY CHECK ===
function checkCategory(categoryName, assetFolder) {
  console.log(`\n=== ${categoryName.toUpperCase()} CHECK ===`);

  const canonIDs = Object.keys(canon[categoryName] || {});
  const canonLower = canonIDs.map(id => id.toLowerCase());

  const dirPath = path.join(assetBaseDir, assetFolder);
  const assetFiles = fs.existsSync(dirPath)
    ? fs.readdirSync(dirPath)
        .filter(f => !f.startsWith('.'))
        .map(f => path.basename(f, path.extname(f)))
    : [];
  const assetsLower = assetFiles.map(f => f.toLowerCase());

  const missingAssets = canonIDs.filter(id => !assetsLower.includes(id.toLowerCase()));
  const extraAssets = assetFiles.filter(f => !canonLower.includes(f.toLowerCase()));

  console.log(`Missing Assets: ${missingAssets.length}`);
  if (missingAssets.length) console.log(missingAssets.join(', '));

  console.log(`Extra Assets: ${extraAssets.length}`);
  if (extraAssets.length) console.log(extraAssets.join(', '));

  const fuzzySuggestions = suggestMatches(
    missingAssets.map(m => m.toLowerCase()),
    extraAssets.map(e => e.toLowerCase())
  );
  if (fuzzySuggestions.length) {
    console.log('Possible Fuzzy Matches:');
    fuzzySuggestions.forEach(s =>
      console.log(`  Canon: ${s.canon} ↔ Asset: ${s.asset} (distance ${s.distance})`)
    );
  }
}

// === DUALS CHECK ===
function checkDuals() {
  console.log(`\n=== DUALS CHECK ===`);
  let missingDuals = [];
  Object.entries(canon).forEach(([category, items]) => {
    if (typeof items !== 'object') return;
    Object.entries(items).forEach(([id, data]) => {
      if (data.dual && !canon[category][data.dual]) {
        missingDuals.push(`${id} → ${data.dual}`);
      }
    });
  });
  console.log(`Missing duals: ${missingDuals.length}`);
  if (missingDuals.length) console.log(missingDuals.join(', '));
}

// === COMBOS CHECK ===
function checkCombos() {
  console.log(`\n=== COMBOS CHECK ===`);
  let missingCombos = [];
  let extraCombos = [];

  Object.entries(canon).forEach(([category, items]) => {
    if (typeof items !== 'object') return;
    Object.entries(items).forEach(([id, data]) => {
      if (data.emotions && data.emotions.length === 2) {
        const combo = data.emotions.slice().sort().join('+');
        // Build expected combos from canon
        const allCanonCombos = Object.values(canon)
          .filter(v => typeof v === 'object')
          .flatMap(obj =>
            Object.values(obj)
              .filter(e => e.emotions && e.emotions.length === 2)
              .map(e => e.emotions.slice().sort().join('+'))
          );
        if (!allCanonCombos.includes(combo)) {
          missingCombos.push(`${id} → ${combo}`);
        }
      }
    });
  });

  console.log(`Missing combos: ${missingCombos.length}`);
  if (missingCombos.length) console.log(missingCombos.join(', '));
}

// === AUTO‑DISCOVER CATEGORIES ===
function discoverCategories() {
  const discovered = {};
  Object.keys(canon).forEach(category => {
    const folderPath = path.join(assetBaseDir, category.toLowerCase());
    if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
      discovered[category] = category.toLowerCase();
    }
  });
  return discovered;
}

// === RUN ALL CHECKS ===
console.log('=== Stage 6 Final Sweep (Canon‑Driven + Auto‑Discovery) ===');

const categoryMap = discoverCategories();

if (Object.keys(categoryMap).length === 0) {
  console.log('No matching asset folders found for canon categories.');
} else {
  Object.entries(categoryMap).forEach(([canonKey, folderName]) => {
    checkCategory(canonKey, folderName);
  });
}

checkDuals();
checkCombos();

console.log('\nStage 6 sweep complete.');
