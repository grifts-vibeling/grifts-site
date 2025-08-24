// audit_bloombugs.js
// Run with: node audit_bloombugs.js

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CANON_PATH = path.join(ROOT, 'data', 'grifts_canon.json');
const ASSET_DIR = path.join(ROOT, 'assets', 'bloombugs');

const BASE_EMOTIONS = [
  'love', 'sadness', 'anger', 'calm', 'confusion',
  'fear', 'joy', 'curiosity', 'pride', 'shame'
];

// --- Helpers ---
function existsFile(p) {
  try { return fs.existsSync(p) && fs.statSync(p).isFile(); }
  catch { return false; }
}
function existsDir(p) {
  try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); }
  catch { return false; }
}

// --- Load canon ---
if (!existsFile(CANON_PATH)) {
  console.error(`❌ Canon file not found at ${CANON_PATH}`);
  process.exit(1);
}
const canon = JSON.parse(fs.readFileSync(CANON_PATH, 'utf8'));
const bloombugs = canon.bloombugs || {};
let hasErrors = false;

console.log(`\n🔍 Auditing ${Object.keys(bloombugs).length} BloomBug entries...\n`);

// --- 1. Per-entry checks ---
const referencedAssets = new Set();

for (const [name, data] of Object.entries(bloombugs)) {
  const { emotions, asset, lore } = data;

  // Emotions valid
  if (!Array.isArray(emotions) || emotions.length === 0) {
    console.warn(`⚠️  ${name}: missing emotions array`);
    hasErrors = true;
  } else {
    for (const emo of emotions) {
      if (!BASE_EMOTIONS.includes(emo)) {
        console.warn(`⚠️  ${name}: unknown emotion "${emo}"`);
        hasErrors = true;
      }
    }
  }

  // Lore present
  if (!lore || !lore.trim()) {
    console.warn(`⚠️  ${name}: missing/empty lore`);
    hasErrors = true;
  }

  // Asset exists
  if (!asset) {
    console.warn(`⚠️  ${name}: missing asset filename`);
    hasErrors = true;
  } else {
    referencedAssets.add(asset);
    const assetPath = path.join(ASSET_DIR, asset);
    if (!existsFile(assetPath)) {
      console.warn(`⚠️  ${name}: asset not found -> ${asset}`);
      hasErrors = true;
    }
  }
}

// --- 2. Mutation coverage check ---
function sortedKey(arr) {
  return [...arr].sort().join('+');
}

// Expected singles
const expectedSingles = BASE_EMOTIONS.map(e => sortedKey([e]));

// Expected duals (all unique pairs)
const expectedDuals = [];
for (let i = 0; i < BASE_EMOTIONS.length; i++) {
  for (let j = i + 1; j < BASE_EMOTIONS.length; j++) {
    expectedDuals.push(sortedKey([BASE_EMOTIONS[i], BASE_EMOTIONS[j]]));
  }
}

// Filter to only combos actually in canon
const canonKeys = Object.values(bloombugs).map(bb => sortedKey(bb.emotions));

// Check singles
for (const key of expectedSingles) {
  if (!canonKeys.includes(key)) {
    console.warn(`⚠️  Missing single emotion evolution for: ${key}`);
    hasErrors = true;
  }
}

// Check duals
for (const key of expectedDuals) {
  if (!canonKeys.includes(key)) {
    console.warn(`⚠️  Missing dual emotion evolution for: ${key}`);
    hasErrors = true;
  }
}

// --- 3. Orphan detection ---
for (const [name, data] of Object.entries(bloombugs)) {
  const key = sortedKey(data.emotions);
  if (!expectedSingles.includes(key) && !expectedDuals.includes(key)) {
    console.warn(`⚠️  ${name}: has an emotion combo not in expected singles/duals list -> ${key}`);
    hasErrors = true;
  }
}

// --- 4. Unused assets ---
if (existsDir(ASSET_DIR)) {
  const allFiles = fs.readdirSync(ASSET_DIR).filter(f => existsFile(path.join(ASSET_DIR, f)));
  const unused = allFiles.filter(f => !referencedAssets.has(f));
  if (unused.length) {
    console.log('\n🧹 Unused assets in assets/bloombugs:');
    unused.forEach(f => console.log('   •', f));
  }
}

console.log(`\n✅ Audit complete. ${hasErrors ? 'Issues found — see above.' : 'No issues found.'}\n`);
