import tkinter as tk
import random

# Load affirmations
with open('affirmations.txt', 'r') as f:
    affirmations = f.readlines()

def start_focus():
    bubble.config(text=random.choice(affirmations))
    root.after(1500000, end_focus)  # 25 minutes

def end_focus():
    bubble.config(text="Focus bubble complete. Float state achieved.")

root = tk.Tk()
root.title("Cloudie — Focus Bubble")
root.geometry("300x200")
root.configure(bg="#cceeff")

bubble = tk.Label(root, text="Tap to enter float state", wraplength=250, bg="#cceeff", font=("Helvetica", 12))
bubble.pack(pady=40)

start_btn = tk.Button(root, text="Start Bubble", command=start_focus)
start_btn.pack()

root.mainloop()
