document.getElementById('mutation-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const inputEl = document.getElementById('emotion-input');
  const input = inputEl.value;
  const resultDiv = document.getElementById('mutation-result');

  // Debounce
  let busy = resultDiv.dataset.busy === '1';
  if (busy) return;
  resultDiv.dataset.busy = '1';
  setTimeout(() => (resultDiv.dataset.busy = '0'), 800);

  // Normalisation
  function normalise(str) {
    return str
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Short-input guard
  if (!input || normalise(input).length < 3) {
    resultDiv.classList.remove('show');
    resultDiv.innerHTML = `<p class="hint">Try a feeling in your own words, e.g. “I feel hopeful but tired”.</p>`;
    requestAnimationFrame(() => resultDiv.classList.add('show'));
    return;
  }

  // Loading skeleton
  resultDiv.classList.remove('show');
  resultDiv.innerHTML = `<div class="skeleton">
    <div class="skeleton-line w-60"></div>
    <div class="skeleton-line w-40"></div>
  </div>`;

  // Levenshtein (fuzzy per-word matching)
  function levenshtein(a, b) {
    const m = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          m[i][j] = m[i - 1][j - 1];
        } else {
          m[i][j] = Math.min(
            m[i - 1][j - 1] + 1,
            m[i][j - 1] + 1,
            m[i - 1][j] + 1
          );
        }
      }
    }
    return m[b.length][a.length];
  }
  function fuzzyWordMatch(a, b, maxDistance = 1) {
    return levenshtein(a, b) <= maxDistance;
  }

  const normalisedInput = normalise(input);
  const inputWords = normalisedInput.split(' ');

  fetch('/emotion-data/synonyms.json')
    .then((res) => res.json())
    .then((data) => {
      let matchedTribe = null;
      let matchedEmotions = [];

      for (const [emotion, info] of Object.entries(data)) {
        const synMatched = (info.synonyms || []).some((syn) => {
          const synWords = normalise(syn).split(' ');
          const allWordsPresent = synWords.every((synWord) =>
            inputWords.some((w) => fuzzyWordMatch(w, synWord))
          );
          const negators = info.negators || [];
          const hasNegator = inputWords.some((w) => negators.includes(w));
          return allWordsPresent && !hasNegator;
        });

        if (synMatched) {
          matchedEmotions.push(emotion);
          if (!matchedTribe) matchedTribe = info.tribe;
        }
      }

      // Unique + sorted
      matchedEmotions = Array.from(new Set(matchedEmotions)).sort();

      if (!matchedTribe) {
        console.log('[mutate:no_match]', normalisedInput);
        resultDiv.innerHTML = `<p class="hint">No match found. Try a different phrase or pair two feelings (e.g., “joy + calm”).</p>`;
        requestAnimationFrame(() => resultDiv.classList.add('show'));
        inputEl.focus();
        inputEl.select();
        return;
      }

      if (matchedTribe === 'ByteBloom') {
        // Resolve ByteBloom via canon (keeps evolution name/key)
        fetch('/data/grifts_canon.json')
          .then((res) => res.json())
          .then((canon) => {
            const key = matchedEmotions.slice().sort().join('+');
            const entries = Object.entries(canon.bloombugs || {});
            const match = entries.find(
              ([, bug]) =>
                Array.isArray(bug.emotions) &&
                bug.emotions.slice().sort().join('+') === key
            );

            if (match) {
              const [evoName, evo] = match;
              const humanEmos = matchedEmotions.join(' + ');
              resultDiv.innerHTML = `
                <h2>Your Tribe: ${matchedTribe}</h2>
                <p class="detected">We heard: <strong>${humanEmos}</strong></p>
                <img src="/assets/bloombugs/${evo.asset}" alt="${evoName}" loading="lazy" />
                <p><strong>${evoName}</strong>: ${evo.lore}</p>
              `;
            } else {
              resultDiv.innerHTML = `
                <h2>Your Tribe: ${matchedTribe}</h2>
                <p>No BloomBug evolution found for: ${key}</p>
                <p class="hint">Try pairing two feelings, e.g. “joy + calm” or “sadness with confusion”.</p>
              `;
            }

            requestAnimationFrame(() => resultDiv.classList.add('show'));
            inputEl.focus();
            inputEl.select();
          })
          .catch(() => {
            resultDiv.innerHTML = `<p class="hint">Couldn’t reach canon right now. Try again in a moment.</p>`;
            requestAnimationFrame(() => resultDiv.classList.add('show'));
          });
      } else {
        resultDiv.innerHTML = `
          <h2>Your Tribe: ${matchedTribe}</h2>
          <p class="detected">We heard: <strong>${matchedEmotions.join(' + ')}</strong></p>
          <p>This tribe has its own Vibelings — no BloomBug evolution.</p>
        `;
        requestAnimationFrame(() => resultDiv.classList.add('show'));
        inputEl.focus();
        inputEl.select();
      }
    })
    .catch(() => {
      resultDiv.innerHTML = `<p class="hint">Couldn’t reach the emotion map. Try again in a moment.</p>`;
      requestAnimationFrame(() => resultDiv.classList.add('show'));
    });
});
