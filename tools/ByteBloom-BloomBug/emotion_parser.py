import json

def load_synonyms():
    with open("../emotion-data/synonyms.json") as f:
        return json.load(f)

def parse_emotion(user_input):
    synonyms = load_synonyms()
    user_words = user_input.lower().split()

    for emotion, keywords in synonyms.items():
        for word in keywords:
            if word in user_words:
                return emotion
    return "unknown"
