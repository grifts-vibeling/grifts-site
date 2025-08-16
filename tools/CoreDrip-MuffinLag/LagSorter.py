import os
import shutil
import json

# Load emotional tags
with open('emotional-tags.json', 'r') as f:
    tags = json.load(f)

source_folder = 'unsorted'
target_base = 'sample-folders'

def sort_files():
    for filename in os.listdir(source_folder):
        for emotion, keywords in tags.items():
            if any(keyword in filename.lower() for keyword in keywords):
                target_folder = os.path.join(target_base, emotion)
                os.makedirs(target_folder, exist_ok=True)
                shutil.move(os.path.join(source_folder, filename), os.path.join(target_folder, filename))
                print(f"Moved {filename} to {emotion}")
                break

if __name__ == "__main__":
    sort_files()
