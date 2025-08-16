import json
import random

with open("questions.json") as f:
    questions = json.load(f)

with open("results.json") as f:
    results = json.load(f)

score = {"chaos": 0, "soft": 0, "glitch": 0}

print("🌸 Welcome to HiveQuiz — What kind of BloomBug are you?\n")

for q in questions:
    print(q["question"])
    for i, opt in enumerate(q["options"]):
        print(f"{i+1}. {opt['text']}")
    choice = int(input("Choose: ")) - 1
    for k in opt["tags"]:
        score[k] += 1
    print()

# Determine result
result_type = max(score, key=score.get)
result = random.choice(results[result_type])

print(f"🧬 You are: {result['name']}")
print(result["description"])
