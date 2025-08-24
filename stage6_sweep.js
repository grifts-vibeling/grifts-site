#!/usr/bin/env node

/**
 * Stage 6 Final Sweep — Canon‑Driven + Auto‑Discovery + Interactive Auto‑Heal
 * Nathan's repo edition
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const canonPath = path.join(__dirname, 'data', 'grifts_canon.json');
const assetBaseDir = path.join(__dirname, 'assets');
const autoHeal = process.argv.includes('--auto-heal');

if (!fs.existsSync(canonPath)) {
  console.error(`❌ Canon file not found at ${canonPath}`);
  process.exit(1);
}
const canon = JSON.parse(fs.readFileSync(canonPath, 'utf8'));

// === Interactive prompt ===
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, ans => resolve(ans.trim().toLowerCase())));
}

// === Helpers ===
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

function findAssetFile(dir, baseName) {
  const files = fs.readdirSync(dir);
  return files.find(f => path.basename(f, path.extname(f)).toLowerCase() === baseName.toLowerCase()) || '';
}

// === Category Check ===
async function checkCategory(categoryName, assetFolder) {
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

  // === Interactive Auto‑Heal ===
  if (autoHeal) {
    for (const s of fuzzySuggestions) {
      const oldFile = findAssetFile(dirPath, s.asset);
      if (!oldFile) continue;
      const oldPath = path.join(dirPath, oldFile);
      const ext = path.extname(oldFile);
      const newPath = path.join(dirPath, s.canon + ext);

      const ans = await ask(`Rename "${oldFile}" → "${s.canon + ext}"? (y/n) `);
      if (ans === 'y') {
        fs.renameSync(oldPath, newPath);
        console.log(`  🔄 Renamed: ${oldFile} → ${s.canon + ext}`);
      }
    }

    for (const id of missingAssets) {
      const placeholderPath = path.join(dirPath, id + '.png');
      const ans = await ask(`Create placeholder for missing "${id}.png"? (y/n) `);
      if (ans === 'y') {
        fs.writeFileSync(placeholderPath, '');
        console.log(`  🆕 Created placeholder: ${id}.png`);
      }
    }
  }
}

// === Duals Check ===
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

// === Combos Check ===
function checkCombos() {
  console.log(`\n=== COMBOS CHECK ===`);
  let missingCombos = [];

  Object.entries(canon).forEach(([category, items]) => {
    if (typeof items !== 'object') return;
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

  console.log(`Missing combos: ${missingCombos.length}`);
  if (missingCombos.length) console.log(missingCombos.join(', '));
}

// === Auto‑Discover Categories ===
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

// === Run Sweep ===
(async () => {
  console.log(`=== Stage 6 Final Sweep (Canon‑Driven + Auto‑Discovery${autoHeal ? ' + Interactive Auto‑Heal' : ''}) ===`);

  const categoryMap = discoverCategories();

  if (Object.keys(categoryMap).length === 0) {
    console.log('No matching asset folders found for canon categories.');
  } else {
    for (const [canonKey, folderName] of Object.entries(categoryMap)) {
      await checkCategory(canonKey, folderName);
    }
  }

  checkDuals();
  checkCombos();

  rl.close();
  console.log(`\nStage 6 sweep complete.${autoHeal ? ' Auto‑heal session ended.' : ''}`);
})();
