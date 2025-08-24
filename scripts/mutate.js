document.getElementById('mutation-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('emotion-input').value;

  // --- Normalisation ---
  function normalise(str) {
    return str
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, '') // remove punctuation/symbols
      .replace(/\s+/g, ' ')               // collapse multiple spaces
      .trim();
  }

  // --- Levenshtein distance ---
  function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
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

  function fuzzyWordMatch(wordA, wordB, maxDistance = 1) {
    return levenshtein(wordA, wordB) <= maxDistance;
  }

  fetch('/emotion-data/synonyms.json')
    .then(res => res.json())
    .then(data => {
      let matchedTribe = null;
      let matchedEmotions = [];

      const normalisedInput = normalise(input);
      const inputWords = normalisedInput.split(' ');

      for (const [emotion, info] of Object.entries(data)) {
        const synMatched = info.synonyms.some(syn => {
          const synWords = normalise(syn).split(' ');
          // Every word in synonym must appear in input (order‑agnostic, fuzzy)
          const allWordsPresent = synWords.every(synWord =>
            inputWords.some(inputWord => fuzzyWordMatch(inputWord, synWord))
          );
          // Negator check (per‑emotion list if provided)
          const negators = info.negators || [];
          const hasNegator = inputWords.some(w => negators.includes(w));
          return allWordsPresent && !hasNegator;
        });

        if (synMatched) {
          matchedEmotions.push(emotion);
          if (!matchedTribe) matchedTribe = info.tribe;
        }
      }

      const resultDiv = document.getElementById('mutation-result');

      if (!matchedTribe) {
        resultDiv.innerHTML = `<p>No match found. Try a different phrase.</p>`;
        return;
      }

      if (matchedTribe === 'ByteBloom') {
        fetch('/data/grifts_canon.json')
          .then(res => res.json())
          .then(canon => {
            const key = matchedEmotions.slice().sort().join('+');
            const evo = Object.values(canon.bloombugs).find(bug =>
              bug.emotions.slice().sort().join('+') === key
            );

            if (evo) {
              resultDiv.innerHTML = `
                <h2>Your Tribe: ${matchedTribe}</h2>
                <img src="/assets/bloombugs/${evo.asset}" alt="${evo.name}" />
                <p><strong>${evo.name}</strong>: ${evo.lore}</p>
              `;
            } else {
              resultDiv.innerHTML = `
                <h2>Your Tribe: ${matchedTribe}</h2>
                <p>No BloomBug evolution found for: ${key}</p>
              `;
            }
          });
      } else {
        resultDiv.innerHTML = `
          <h2>Your Tribe: ${matchedTribe}</h2>
          <p>This tribe has its own Vibelings — no BloomBug evolution.</p>
        `;
      }
    });
});
