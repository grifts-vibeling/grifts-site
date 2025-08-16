import random

affirmations = {
    "low": ["You’ve got this.", "Small steps count.", "Even resting is progress."],
    "medium": ["Rest is productive.", "You’re allowed to pause.", "Burnout recovery is valid."],
    "high": ["Burnout isn’t weakness.", "You deserve recovery.", "Your worth isn’t tied to output."]
}

def get_affirmation(level="medium"):
    return random.choice(affirmations.get(level, affirmations["medium"]))

if __name__ == "__main__":
    print("Welcome to EchoNova’s Burnout Recovery Loop 🌌")
    level = input("How burned out are you? (low / medium / high): ").strip().lower()
    print("\nEchoNova says:", get_affirmation(level))
