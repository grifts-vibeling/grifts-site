#!/usr/bin/env python3
import json
import os
import random
import sys

# --- CONFIG ---
CANON_PATH = os.path.join(os.path.dirname(__file__), "../../data/grifts_canon.json")
ASSET_DIR = os.path.join(os.path.dirname(__file__), "../../assets/bloombugs/")

# --- LOAD CANON ---
def load_canon():
    try:
        with open(CANON_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        sys.exit(f"❌ Canon file not found at {CANON_PATH}")
    except json.JSONDecodeError as e:
        sys.exit(f"❌ Error parsing canon JSON: {e}")

# --- BUILD LOOKUP MAP ---
def build_evolution_map(canon):
    evo_map = {}
    for name, data in canon["bloombugs"].items():
        key = "+".join(sorted(data["emotions"]))
        evo_map.setdefault(key, []).append(name)
    return evo_map

# --- PARSE USER INPUT ---
def parse_emotion_combo(user_input):
    # Split by comma or plus, strip spaces, lowercase
    emotions = [e.strip().lower() for e in user_input.replace("+", ",").split(",") if e.strip()]
    return "+".join(sorted(emotions))

# --- EVOLVE ---
def evolve_character(user_input):
    canon = load_canon()
    evo_map = build_evolution_map(canon)

    combo_key = parse_emotion_combo(user_input)

    if combo_key not in evo_map:
        print(f"⚠️ No BloomBug evolution found for: {combo_key}")
        return

    evolution = random.choice(evo_map[combo_key])
    evo_data = canon["bloombugs"][evolution]

    # Asset path
    asset_path = os.path.join(ASSET_DIR, evo_data["asset"])
    asset_exists = os.path.exists(asset_path)

    # Output
    print(f"\n🌱 Your BloomBug evolved into: {evolution}")
    print(f"📜 Lore: {evo_data['lore']}")
    print(f"🧬 Mutation lineage: {' → '.join(evo_data['mutation_lineage'])}")
    tribe = evo_data["tribe"]
    print(f"🎨 Tribe aesthetic: {canon['tribes'][tribe]['aesthetic']}")
    print(f"🖼️ Asset: {asset_path if asset_exists else '⚠️ Missing asset file'}\n")

# --- MAIN ---
if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python BloomBug.py '<emotion1, emotion2>'")

    user_input = sys.argv[1]
    evolve_character(user_input)
