import json
import itertools

def load_synonyms():
    with open("../emotion-data/synonyms.json") as f:
        return json.load(f)

def parse_emotion_combo(user_input):
    synonyms = load_synonyms()
    user_words = user_input.lower().split()
    detected = set()

    for emotion, keywords in synonyms.items():
        if any(word in user_words for word in keywords):
            detected.add(emotion)

    combos = list(detected)
    if len(combos) >= 2:
        return ["+".join(sorted(pair)) for pair in itertools.combinations(combos, 2)]
    return combos
