#!/usr/bin/env node

/**
 * Stage 6 Final Sweep — Fully Canon‑Driven
 * Unified integrity check for all asset categories, duals, and combos
 * with fuzzy matching for naming drift.
 * Author: Nathan + Copilot
 */

const fs = require('fs');
const path = require('path');

// === CONFIG ===
const canonPath = path.join(__dirname, '../data/grifts_canon.json');
const assetBaseDir = path.join(__dirname, '../assets');

// === LOAD CANON ===
const canon = require(canonPath);

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

// === GENERIC CATEGORY CHECK ===
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
    Object.entries(items).forEach(([id, data]) => {
      if (data.combos) {
        data.combos.forEach(combo => {
          if (!canon[category][combo]) {
            missingCombos.push(`${id} → ${combo}`);
          }
        });
      }
    });
  });

  // Optional: detect combos that exist but aren't referenced anywhere
  const allIDs = Object.values(canon).flatMap(obj => Object.keys(obj));
  const referencedCombos = new Set(
    Object.values(canon).flatMap(items =>
      Object.values(items).flatMap(data => data.combos || [])
    )
  );
  allIDs.forEach(id => {
    if (!referencedCombos.has(id)) {
      extraCombos.push(id);
    }
  });

  console.log(`Missing combos: ${missingCombos.length}`);
  if (missingCombos.length) console.log(missingCombos.join(', '));

  console.log(`Extra combos: ${extraCombos.length}`);
  if (extraCombos.length) console.log(extraCombos.join(', '));
}

// === RUN ALL CHECKS ===
console.log('=== Stage 6 Final Sweep (Fully Canon‑Driven) ===');

const categoryMap = {
  bloombugs: 'bloombugs',
  rituals: 'rituals',
  relics: 'relics',
  // Add more categories here
};

Object.entries(categoryMap).forEach(([canonKey, folderName]) => {
  checkCategory(canonKey, folderName);
});

checkDuals();
checkCombos();

console.log('\nStage 6 sweep complete.');
