// audit_bloombugs.js
// Run with: node audit_bloombugs.js

const fs = require('fs');
const path = require('path');

// CONFIG — adjust if your paths differ
const CANON_PATH = path.join(__dirname, 'grifts_canon.json');
const ASSET_DIR = path.join(__dirname, 'assets', 'bloombugs');

// Expected base emotions (must match synonyms.json keys exactly)
const BASE_EMOTIONS = [
  'love', 'sadness', 'anger', 'calm', 'confusion',
  'fear', 'joy', 'curiosity', 'pride', 'shame'
];

// Load canon
let canon;
try {
  canon = JSON.parse(fs.readFileSync(CANON_PATH, 'utf8'));
} catch (err) {
  console.error(`❌ Failed to load canon file: ${err.message}`);
  process.exit(1);
}

const bloombugs = canon.bloombugs || {};
let hasErrors = false;

console.log(`\n🔍 Auditing ${Object.keys(bloombugs).length} BloomBug entries...\n`);

for (const [name, data] of Object.entries(bloombugs)) {
  const { emotions, asset, lore } = data;

  // 1. Check emotions
  if (!Array.isArray(emotions) || emotions.length === 0) {
    console.warn(`⚠️  ${name} has no emotions array`);
    hasErrors = true;
  } else {
    for (const emo of emotions) {
      if (!BASE_EMOTIONS.includes(emo)) {
        console.warn(`⚠️  ${name} has unknown emotion: "${emo}"`);
        hasErrors = true;
      }
    }
  }

  // 2. Check asset file exists
  if (!asset) {
    console.warn(`⚠️  ${name} has no asset filename`);
    hasErrors = true;
  } else {
    const assetPath = path.join(ASSET_DIR, asset);
    if (!fs.existsSync(assetPath)) {
      console.warn(`⚠️  ${name} asset missing: ${asset}`);
      hasErrors = true;
    }
  }

  // 3. Check lore
  if (!lore || !lore.trim()) {
    console.warn(`⚠️  ${name} has missing/empty lore`);
    hasErrors = true;
  }
}

console.log(`\n✅ Audit complete. ${hasErrors ? 'Issues found — see above.' : 'No issues found.'}\n`);
