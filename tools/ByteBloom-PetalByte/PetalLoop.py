import tkinter as tk
import json
import random

with open("loops.json") as f:
    loops = json.load(f)

root = tk.Tk()
root.title("PetalLoop — ByteBloom")
root.geometry("400x300")
root.configure(bg="#ffe6f2")

loop_text = tk.StringVar()
loop_label = tk.Label(root, textvariable=loop_text, font=("Helvetica", 14), wraplength=380, justify="center", bg="#ffe6f2")
loop_label.pack(pady=40)

def generate_loop():
    loop = random.choice(loops)
    loop_text.set(loop)

btn = tk.Button(root, text="Generate PetalLoop", command=generate_loop)
btn.pack()

root.mainloop()
