import json
import random
import os
from emotion_parser import parse_emotion_combo

def load_evolution_map():
    with open("evolution-map.json") as f:
        return json.load(f)

def evolve_character(user_input):
    moods = parse_emotion_combo(user_input)
    evo_map = load_evolution_map()

    for mood_combo in moods:
        if mood_combo in evo_map:
            evolution = random.choice(evo_map[mood_combo])
            image_path = f"assets/{evolution}.png"

            print(f"🌱 Your BloomBug evolved into: {evolution}")
            print(f"🖼️ Image path: {image_path}" if os.path.exists(image_path) else f"⚠️ Image not found: {image_path}")
            return evolution

    print("❓ No evolution found for that mood.")
    return None

if __name__ == "__main__":
    user_input = input("Enter your emotional state: ")
    evolve_character(user_input)
