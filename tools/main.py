import tkinter as tk
from tkinter import messagebox

rituals = []

def add_ritual():
    ritual = entry.get()
    if ritual:
        rituals.append(ritual)
        listbox.insert(tk.END, ritual)
        entry.delete(0, tk.END)

def show_lore():
    messagebox.showinfo("Lore Unlock", "You've unlocked EchoNova's burnout recovery loop.")

root = tk.Tk()
root.title("EchoNova — Ritual Tracker")

entry = tk.Entry(root, width=40)
entry.pack(pady=10)

add_btn = tk.Button(root, text="Add Ritual", command=add_ritual)
add_btn.pack()

listbox = tk.Listbox(root, width=50)
listbox.pack(pady=10)

lore_btn = tk.Button(root, text="Unlock Lore", command=show_lore)
lore_btn.pack(pady=5)

root.mainloop()
