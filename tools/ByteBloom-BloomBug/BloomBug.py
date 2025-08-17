import json
import random
import os
from emotion_parser import parse_emotion

def load_evolution_map():
    with open("evolution-map.json") as f:
        return json.load(f)

def evolve_character(user_input):
    mood = parse_emotion(user_input)
    evo_map = load_evolution_map()

    if mood in evo_map:
        evolution = random.choice(evo_map[mood])
        image_path = f"assets/{evolution}.png"

        if os.path.exists(image_path):
            print(f"🌱 Your BloomBug evolved into: {evolution}")
            print(f"🖼️ Image path: {image_path}")
        else:
            print(f"⚠️ Evolution image not found: {image_path}")
        return evolution
    else:
        print("❓ No evolution found for that mood.")
        return None

if __name__ == "__main__":
    user_input = input("Enter your emotional state: ")
    evolve_character(user_input)
