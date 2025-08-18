import json

def load_synonyms():
    with open("../emotion-data/synonyms.json") as f:
        return json.load(f)

def parse_emotions(user_input):
    synonyms = load_synonyms()
    user_words = user_input.lower().split()
    matched = []

    for emotion, keywords in synonyms.items():
        if any(word in user_words for word in keywords):
            matched.append(emotion)
        if len(matched) == 2:
            break

    return matched
