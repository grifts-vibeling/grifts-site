document.getElementById('mutation-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const input = document.getElementById('emotion-input').value.toLowerCase();

  fetch('/emotion-data/synonyms.json')
    .then(res => res.json())
    .then(data => {
      let matchedTribe = null;
      let matchedBug = null;

      for (const [emotion, tribe] of Object.entries(data.map)) {
        if (data.synonyms[emotion].some(word => input.includes(word))) {
          matchedTribe = tribe;
          matchedBug = data.bloombugs?.[emotion] || null;
          break;
        }
      }

      const resultDiv = document.getElementById('mutation-result');
      if (matchedTribe) {
        resultDiv.innerHTML = `
          <h2>Your Tribe: ${matchedTribe}</h2>
          ${matchedBug ? `
            <img src="/assets/bloombugs/${matchedBug.image}" alt="${matchedBug.name}" />
            <p><strong>${matchedBug.name}</strong>: ${matchedBug.lore}</p>
          ` : `<p>No evolution found, but your vibe is strong.</p>`}
        `;
      } else {
        resultDiv.innerHTML = `<p>No match found. Try a different phrase.</p>`;
      }
    });
});
