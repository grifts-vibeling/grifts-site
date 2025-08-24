// audit_bloombugs.js — Stage 6+ (Option A: intended combos only)

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CANON_PATH = path.join(ROOT, 'data', 'grifts_canon.json');
const ASSET_DIR = path.join(ROOT, 'assets', 'bloombugs');

const BASE_EMOTIONS = [
  'love', 'sadness', 'anger', 'calm', 'confusion',
  'fear', 'joy', 'curiosity', 'pride', 'shame'
];

// Your actual intended dual combos from canon
const EXPECTED_DUALS = [
  'joy+calm',
  'joy+anger',
  'sadness+confusion',
  'anger+confusion',
  'fear+confusion',
  'love+pride',
  'sadness+shame',
  'curiosity+joy',
  'anger+pride',
  'calm+curiosity'
];

function existsFile(p) {
  try { return fs.existsSync(p) && fs.statSync(p).isFile(); }
  catch { return false; }
}
function existsDir(p) {
  try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); }
  catch { return false; }
}
function sortedKey(arr) {
  return [...arr].sort().join('+');
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

const referencedAssets = new Set();
const canonKeys = Object.values(bloombugs).map(bb => sortedKey(bb.emotions));

// --- 1. Per-entry checks ---
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
// Singles: all base emotions
for (const emo of BASE_EMOTIONS) {
  const key = sortedKey([emo]);
  if (!canonKeys.includes(key)) {
    console.warn(`⚠️  Missing single emotion evolution for: ${key}`);
    hasErrors = true;
  }
}

// Duals: only intended combos
for (const key of EXPECTED_DUALS) {
  if (!canonKeys.includes(key)) {
    console.warn(`⚠️  Missing dual emotion evolution for: ${key}`);
    hasErrors = true;
  }
}

// --- 3. Orphan detection ---
for (const [name, data] of Object.entries(bloombugs)) {
  const key = sortedKey(data.emotions);
  if (
    !BASE_EMOTIONS.includes(key) && // not a single
    !EXPECTED_DUALS.includes(key)   // not an intended dual
  ) {
    console.warn(`⚠️  ${name}: has an emotion combo not in intended list -> ${key}`);
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
