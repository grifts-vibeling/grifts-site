import json
import os
import random
from emotion_parser import parse_emotions

def load_evolution_map():
    with open("evolution-map.json") as f:
        return json.load(f)

def evolve_character(user_input):
    emotions = parse_emotions(user_input)
    evo_map = load_evolution_map()

    if len(emotions) == 0:
        print("❌ No valid emotions detected. Try again.")
        return None

    elif len(emotions) == 1:
        mood = emotions[0]
        options = evo_map["single"].get(mood, [])
        if options:
            evolution = random.choice(options)
        else:
            print(f"⚠️ No evolution found for emotion: {mood}")
            return None

    elif len(emotions) == 2:
        combo_key = "+".join(sorted(emotions))
        evolution = evo_map["combo"].get(combo_key)
        if not evolution:
            print(f"⚠️ No evolution found for combo: {combo_key}")
            return None

    image_path = f"assets/{evolution}.png"
    if os.path.exists(image_path):
        print(f"\n🌱 Your BloomBug evolved into: {evolution}")
        print(f"🖼️ Image path: {image_path}")
    else:
        print(f"\n⚠️ Evolution image not found: {image_path}")
    return evolution

if __name__ == "__main__":
    user_input = input("Enter your emotional prompt: ")
    evolve_character(user_input)
