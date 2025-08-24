document.getElementById('mutation-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('emotion-input').value.toLowerCase();

  // Step 1: Fetch synonyms mapping to detect emotions + tribe
  fetch('/emotion-data/synonyms.json')
    .then(res => res.json())
    .then(data => {
      let matchedTribe = null;
      let matchedEmotions = [];

      // Loop over each emotion in synonyms.json
      for (const [emotion, info] of Object.entries(data)) {
        if (info.synonyms.some(word => input.includes(word))) {
          matchedEmotions.push(emotion);
          if (!matchedTribe) matchedTribe = info.tribe; // First match sets the tribe
        }
      }

      const resultDiv = document.getElementById('mutation-result');

      if (!matchedTribe) {
        resultDiv.innerHTML = `<p>No match found. Try a different phrase.</p>`;
        return;
      }

      // Step 2: If ByteBloom, look up BloomBug evolution from canon
      if (matchedTribe === 'ByteBloom') {
        fetch('/data/grifts_canon.json')
          .then(res => res.json())
          .then(canon => {
            // Sort emotions for consistent combo key
            const key = matchedEmotions.slice().sort().join('+');

            // Find matching BloomBug evolution
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
        // Step 3: Non-BloomBug tribes — just show the tribe
        resultDiv.innerHTML = `
          <h2>Your Tribe: ${matchedTribe}</h2>
          <p>This tribe has its own Vibelings — no BloomBug evolution.</p>
        `;
      }
    });
});
